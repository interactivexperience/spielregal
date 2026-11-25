/* Konzept 15 · neue 3D-Möwe im Glut-Stil, komplett prozedural (kein Fremdmodell):
   schlanke Silbermöwe mit roter Strickmütze, weiche matte Flächen in Weiß, Schiefergrau und Orange, warmes Randlicht von hinten.
   Hals und Kopf drehen sich im Raum zur Maus, Flügel schlägt nur auf Klick, sie atmet und blinzelt selten.
   Ohne WebGL oder bei „Bewegung aus“ bleibt das Standbild (Foto-Bild). Mit ?foto bleibt das Foto auch bei WebGL. */
import * as THREE from 'three';

const NK = window.NK;
const wrap = location.search.includes('foto') ? null : document.querySelector('[data-gull]');
const clamp = THREE.MathUtils.clamp, rand = (a, b) => a + Math.random() * (b - a);
let renderer, scene, cam, bird, headG, neckG, wingL, wingR, tailG, lidL, lidR, bodyG, legs;
let ready = false, failed = false, running = false, blinkT = 2, flapT = -1;
const look = { yaw: 0, pitch: 0 }, ptr = { x: .5, y: .1, t: -1e9 }, clock = new THREE.Clock(), blink = { t: -1 };
const H = 6.1;   // Höhe der Möwe in Welteinheiten (Füße bei y = 0)

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .88, metalness: 0, ...o });
const M = {
  white: mat(0xf3ece4), cream: mat(0xe9ddd0), slate: mat(0x59606b, { roughness: .8 }), dark: mat(0x1b1d24),
  beak: mat(0xff9a1c, { roughness: .55 }), red: mat(0xe0301c, { roughness: .6 }), leg: mat(0xff6a1a, { roughness: .6 }),
  eye: mat(0x0b0b0b, { roughness: .25 }), ring: mat(0xffb020, { roughness: .5 }), hatA: mat(0xff4a12, { roughness: .95 }),
};
function ell(m, rx, ry, rz, seg = 40) { const o = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.round(seg * .7)), m); o.scale.set(rx, ry, rz); return o; }
function at(o, x, y, z, rz = 0, ry = 0, rx = 0) { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); return o; }
function beanieTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#ff4a12'; g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 32; i++) { g.fillStyle = i % 2 ? 'rgba(120,20,0,.55)' : 'rgba(255,140,60,.35)'; g.fillRect(i * 8, 0, 3, 128); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t;
}

/* Möwe blickt nach links (−X), Körper leicht zur Kamera gedreht. */
function build() {
  bird = new THREE.Group(); bodyG = new THREE.Group(); bird.add(bodyG);
  const body = ell(M.white, .8, 1.5, .62); at(body, 0, 2.55, 0, .3); bodyG.add(body);
  const back = ell(M.slate, .55, 1.25, .58); at(back, .36, 2.65, 0, .3); back.scale.z = .6; bodyG.add(back);
  const belly = ell(M.cream, .66, 1.0, .58); at(belly, -.2, 2.0, 0, .3); bodyG.add(belly);
  tailG = new THREE.Group(); at(tailG, .72, 1.55, 0, -.5); bodyG.add(tailG);
  tailG.add(at(ell(M.white, .9, .12, .4), .5, 0, 0)); tailG.add(at(ell(M.dark, .32, .13, .36), .95, .01, 0));
  const mkWing = s => { const g = new THREE.Group(); at(g, .05, 3.35, .56 * s);
    g.add(at(ell(M.slate, .42, 1.3, .13), .35, -1.15, 0, .5));
    g.add(at(ell(M.dark, .18, .6, .12), .95, -2.1, 0, .54));
    g.add(at(ell(M.white, .15, .5, .11), .75, -1.6, s * .03, .5));
    bodyG.add(g); return g; };
  wingL = mkWing(1); wingR = mkWing(-1);
  legs = new THREE.Group(); bodyG.add(legs);
  for (const z of [.24, -.24]) {
    legs.add(at(new THREE.Mesh(new THREE.CylinderGeometry(.06, .05, 1.5, 14), M.leg), -.05, .78, z));
    for (const a of [-.55, 0, .55]) legs.add(at(ell(M.leg, .5, .06, .09, 20), -.35, .05, z + a * .28, 0, a * .5));
  }
  neckG = new THREE.Group(); at(neckG, -.55, 4.0, 0, .26); bodyG.add(neckG);
  neckG.add(at(ell(M.white, .36, .62, .34), 0, .32, 0));
  headG = new THREE.Group(); at(headG, -.1, .86, 0); neckG.add(headG);
  headG.add(at(ell(M.white, .5, .42, .4, 48), -.05, .2, 0));
  const bu = at(new THREE.Mesh(new THREE.ConeGeometry(.15, 1.0, 24), M.beak), -.78, .06, 0, Math.PI / 2 + .12); bu.scale.set(1, 1, .8); headG.add(bu);
  headG.add(at(ell(M.beak, .17, .08, .13), -1.2, -.04, 0, -.55));
  headG.add(at(ell(M.red, .05, .05, .09), -1.02, -.14, 0));
  const lids = [];
  for (const s of [1, -1]) {
    headG.add(at(ell(M.ring, .13, .13, .06), -.28, .3, s * .46, 0, s * .45));
    headG.add(at(ell(M.eye, .08, .08, .06), -.29, .3, s * .5, 0, s * .45));
    const lid = at(ell(M.white, .15, .15, .08), -.28, .3, s * .49, 0, s * .45); lid.scale.y = .001; headG.add(lid); lids.push(lid);
  }
  [lidL, lidR] = lids;
  const hat = new THREE.Group(); at(hat, -.02, .42, 0, .12); headG.add(hat);
  const capM = new THREE.MeshStandardMaterial({ map: beanieTexture(), roughness: .98 });
  const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 28, 0, Math.PI * 2, 0, Math.PI * .55), capM); cap.scale.set(.56, .6, .5); at(cap, 0, .05, 0); hat.add(cap);
  const brim = new THREE.Mesh(new THREE.TorusGeometry(.5, .11, 16, 48), M.hatA); brim.rotation.x = Math.PI / 2; brim.scale.set(1.04, .95, 1); hat.add(brim);
  hat.add(at(new THREE.Mesh(new THREE.IcosahedronGeometry(.2, 3), M.hatA), .05, .7, 0));
  bird.rotation.y = .12;
  return bird;
}

function size() {
  if (!renderer || !wrap) return;
  const w = wrap.clientWidth, h = wrap.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); cam.aspect = w / h;
  const vis = H * 1.08, d = vis / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
  cam.position.set(0, H * .5, d); cam.lookAt(0, H * .5, 0); cam.updateProjectionMatrix();
}

function loop() {
  const now = performance.now(), dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  const a = now - ptr.t < 6000, nx = a ? ptr.x : -.2, ny = a ? ptr.y : .05;
  const r = wrap.getBoundingClientRect(), cx = (r.left + r.width * .48) / innerWidth * 2 - 1, cy = 1 - (r.top + r.height * .2) / innerHeight * 2;
  const yawT = clamp((nx - cx) * 1.55, -.55, 2.3), pitchT = clamp((ny - cy) * .8, -.45, .5);
  look.yaw += (yawT - look.yaw) * Math.min(1, dt * 5); look.pitch += (pitchT - look.pitch) * Math.min(1, dt * 5);
  neckG.rotation.y = look.yaw * .42; neckG.rotation.z = .22 - look.pitch * .25;
  headG.rotation.y = look.yaw * .58; headG.rotation.z = -look.pitch * .75;
  bird.rotation.y += ((.12 + look.yaw * .12) - bird.rotation.y) * Math.min(1, dt * 3);
  bodyG.scale.y = 1 + Math.sin(t * 1.7) * .006; bodyG.position.y = 0;
  tailG.rotation.z = -.42 + Math.sin(t * .8) * .02;
  if (flapT >= 0) { flapT += dt; const u = flapT / 1.1, f = u < 1 ? Math.sin(u * Math.PI * 4.5) * Math.sin(u * Math.PI) * .75 : 0;
    wingL.rotation.z = wingR.rotation.z = -f * .5; wingL.rotation.x = -f * .9; wingR.rotation.x = f * .9; bodyG.position.y = Math.max(0, f) * .12;
    if (u >= 1) { flapT = -1; wingL.rotation.set(0, 0, 0); wingR.rotation.set(0, 0, 0); } }
  if ((blinkT -= dt) <= 0) { blinkT = rand(2.5, 6.5); blink.t = 0; }
  if (blink.t >= 0) { blink.t += dt; const u = blink.t / .26, s = u < 1 ? Math.sin(u * Math.PI) : 0; lidL.scale.y = lidR.scale.y = Math.max(.001, s); if (u >= 1) blink.t = -1; }
  renderer.render(scene, cam);
}

function init() {
  if (!wrap || ready || failed) return;
  try {
    const mobile = innerWidth < 900;
    renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .95;
    renderer.domElement.className = 'gull3d'; renderer.domElement.setAttribute('aria-hidden', 'true');
    scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(24, 1, .1, 80);
    scene.add(new THREE.HemisphereLight(0xffe9d6, 0x3a1608, 1.0));
    const key = new THREE.DirectionalLight(0xfff0e0, 2.2); key.position.set(-4, 6, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0xff5a14, 4.5); rim.position.set(6, 3, -3); scene.add(rim);
    const rim2 = new THREE.DirectionalLight(0xff7a30, 1.4); rim2.position.set(5, 1, 4); scene.add(rim2);
    scene.add(build());
    wrap.appendChild(renderer.domElement);
    size(); ready = true;
    if (NK.motionOn()) resume();
  } catch (e) { failed = true; console.warn('3D-Möwe nicht verfügbar, Standbild bleibt:', e?.message || e); }
}
function resume() { if (!ready || running) return; running = true; renderer.domElement.style.display = ''; wrap.classList.add('g3'); clock.getDelta(); renderer.setAnimationLoop(loop); }
function pause() { if (!running) return; running = false; renderer.setAnimationLoop(null); renderer.domElement.style.display = 'none'; wrap.classList.remove('g3'); }

if (NK && wrap) {
  const set = e => { ptr.x = (e.clientX / innerWidth) * 2 - 1; ptr.y = -(e.clientY / innerHeight) * 2 + 1; ptr.t = performance.now(); };
  addEventListener('pointermove', set, { passive: true }); addEventListener('pointerdown', set, { passive: true });
  wrap.style.pointerEvents = 'auto'; wrap.style.cursor = 'pointer';
  wrap.addEventListener('click', () => { if (running && flapT < 0) flapT = 0; });
  addEventListener('resize', () => { if (ready) size(); });
  addEventListener('nk:motion', () => { if (NK.motionOn()) { if (ready) resume(); else init(); } else pause(); });
  if (NK.motionOn()) setTimeout(init, 150);
}
if (NK && location.search.includes('debug')) window.__gull = () => ({ running, ready, failed, yaw: +look.yaw.toFixed(2), pitch: +look.pitch.toFixed(2) });
