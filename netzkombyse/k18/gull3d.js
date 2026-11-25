/* Konzept 15 · 3D-Möwe aus dem Foto: Das Foto der Möwe wird in Ebenen zerlegt (Körper, Flügel, Kopf mit Mütze) und in three.js im Raum gedreht.
   Farben, Federn und Licht bleiben pixelgleich wie im Foto (unbeleuchtete Texturen, keine Neuberechnung). Der Kopf besteht aus mehreren Schichten mit Tiefe,
   dreht sich zur Maus (bis zum Blick nach rechts, dabei geht er kurz durch die Schmalansicht), der Körper neigt sich leicht, der Flügel schlägt nur auf Klick.
   Nur mit ?3d an der Adresse aktiv; Standard ist das 2D-Foto mit Kopf- und Flügelanimation (app.js). */
import * as THREE from 'three';

const NK = window.NK;
const wrap = location.search.includes('3d') ? document.querySelector('[data-gull]') : null;   // Standard ist das 2D-Foto; die 3D-Fassung nur mit ?3d
const clamp = THREE.MathUtils.clamp, smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const SRC = new URL('../media/moewe-cut-l.webp', import.meta.url).href;
const AR = 1232 / 832, W = 1, Hh = AR;                       // Ebene in Welteinheiten (Breite 1, Höhe 1,481)
const NECK = { x: .52, y: .268 }, SHOULDER = { x: .38, y: .38 };
let renderer, scene, cam, bird, bodyG, headG, wingG, headLayers = [], ready = false, failed = false, running = false, flapT = -1;
const look = { yaw: 0, pitch: 0 }, ptr = { x: -.6, y: .1, t: -1e9 }, clock = new THREE.Clock();

const load = src => new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
function layer(img, fn) {
  const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const g = c.getContext('2d');
  fn(g, c.width, c.height, img);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t;
}
const gradMask = (g, w, h, stops) => { const gr = g.createLinearGradient(0, 0, 0, h); stops.forEach(([p, a]) => gr.addColorStop(p, `rgba(0,0,0,${a})`)); g.globalCompositeOperation = 'destination-in'; g.fillStyle = gr; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over'; };
const WING = [[38.1, 38.1], [27.9, 42.2], [20.7, 48.7], [14.7, 64.1], [8.1, 75.1], [13.5, 77.1], [23.1, 74.3], [29.1, 64.9], [33.3, 56.8], [37.5, 45.5]];

/* Ebene mit Drehpunkt (px, py in Bildanteilen) und Tiefe z */
function plane(tex, pivot, z, o = {}) {
  const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: .02, side: THREE.DoubleSide, depthWrite: true, color: o.tint ?? 0xffffff });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(W, Hh), m);
  mesh.position.set(-(pivot.x - .5) * W, (pivot.y - .5) * Hh, z);
  const g = new THREE.Group(); g.position.set((pivot.x - .5) * W, -(pivot.y - .5) * Hh, 0); g.add(mesh); return { g, mesh, m };
}

async function build() {
  const img = await load(SRC);
  const texBody = layer(img, (g, w, h, i) => { g.drawImage(i, 0, 0); gradMask(g, w, h, [[0, 0], [.2, 0], [.245, 1], [1, 1]]); });
  const texHead = layer(img, (g, w, h, i) => { g.drawImage(i, 0, 0); gradMask(g, w, h, [[0, 1], [.215, 1], [.268, 0], [1, 0]]); });
  const texWing = layer(img, (g, w, h, i) => { g.save(); g.beginPath(); WING.forEach(([x, y], k) => g[k ? 'lineTo' : 'moveTo'](x / 100 * w, y / 100 * h)); g.closePath(); g.clip(); g.drawImage(i, 0, 0); g.restore(); });
  bird = new THREE.Group(); bodyG = new THREE.Group(); bird.add(bodyG);
  /* Körper: Hauptebene plus dünne dunklere Rückschichten für Volumen bei Neigung */
  for (let k = 3; k >= 1; k--) { const p = plane(texBody, { x: .5, y: .8 }, -k * .012, { tint: 0x777777 }); bodyG.add(p.g); }
  const b0 = plane(texBody, { x: .5, y: .8 }, 0); bodyG.add(b0.g);
  /* Flügel über dem Körper */
  const w = plane(texWing, SHOULDER, .035); wingG = w.g; bodyG.add(wingG);
  /* Kopf: mehrere Schichten, hinten dunkler (Dicke), vorn das helle Foto */
  headG = new THREE.Group(); headG.position.set((NECK.x - .5) * W, -(NECK.y - .5) * Hh, 0); bodyG.add(headG);
  const N = 5;
  for (let k = 0; k < N; k++) {
    const z = (k - (N - 1) / 2) * .005, v = 0x88 + Math.round(k * (0xff - 0x88) / (N - 1)), shade = (v << 16) | (v << 8) | v;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(W, Hh), new THREE.MeshBasicMaterial({ map: texHead, transparent: true, alphaTest: .02, side: THREE.DoubleSide, color: shade }));
    mesh.position.set(-(NECK.x - .5) * W, (NECK.y - .5) * Hh, z + .06); headG.add(mesh); headLayers.push(mesh);
  }
  return bird;
}

function size() {
  if (!renderer || !wrap) return;
  const w = wrap.clientWidth, h = wrap.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); cam.aspect = w / h;
  const d = (Hh / 2) / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)); cam.position.set(0, 0, d); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
}

function loop() {
  const now = performance.now(), dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  const a = now - ptr.t < 6000, nx = a ? ptr.x : -.6, ny = a ? ptr.y : .1;
  const r = wrap.getBoundingClientRect(), cx = (r.left + r.width * .46) / innerWidth * 2 - 1, cy = 1 - (r.top + r.height * .2) / innerHeight * 2;
  const dx = nx - cx, dy = ny - cy;
  /* Kopf: Maus links = Foto-Blick, Maus rechts = Kopf dreht sich bis zur Dreiviertel-Ansicht zur Kamera */
  const yawT = 1.0 * smooth(0, .7, dx), pitchT = clamp(dy * .4, -.35, .4);
  look.yaw += (yawT - look.yaw) * Math.min(1, dt * 4.5); look.pitch += (pitchT - look.pitch) * Math.min(1, dt * 5);
  headG.rotation.y = look.yaw; headG.rotation.x = -look.pitch * .8; headG.rotation.z = Math.sin(look.yaw) * .02;
  /* Körper neigt sich minimal zur Maus, Atmen */
  bird.rotation.y += (clamp(dx * .22, -.14, .2) - bird.rotation.y) * Math.min(1, dt * 3);
  bodyG.scale.y = 1 + Math.sin(t * 1.6) * .004;
  if (flapT >= 0) { flapT += dt; const u = flapT / 1.1, f = u < 1 ? Math.sin(u * Math.PI * 4.5) * Math.sin(u * Math.PI) : 0;
    wingG.rotation.z = f * .22; wingG.rotation.y = -Math.abs(f) * .5; if (u >= 1) { flapT = -1; wingG.rotation.set(0, 0, 0); } }
  renderer.render(scene, cam);
}

async function init() {
  if (!wrap || ready || failed) return;
  try {
    const mobile = innerWidth < 900;
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
    renderer.domElement.className = 'gull3d'; renderer.domElement.setAttribute('aria-hidden', 'true');
    scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(16, 1, .1, 80);
    scene.add(await build());
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
