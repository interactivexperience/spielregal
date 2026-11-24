/* Konzept 12 · 3D-Möwe (Owner-Modell „Möwe 1“, Meshopt + WebP-Textur, Skelett mit Flügeln, Hals, Kopf, Lidern).
   Sie fliegt bei jedem Kapitelwechsel mit Flügelschlag zum neuen Platz und landet dort. Kopf und Blick folgen dem Zeiger (auch Touch),
   beim Scrollen schaut sie in Scrollrichtung, im Flug zum Ziel. Ohne WebGL, bei „Bewegung aus“ oder reduzierter Bewegung bleibt das Standbild (.cut). */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const NK = window.NK;
const root = document.documentElement;
/* Ziel je Kapitel = Position der Headline. Die Möwe bleibt groß wie die Person in der Referenz und überlappt die Riesenschrift teilweise.
   fx = Stelle entlang der Headline (0 links … 1 rechts) bzw. side = daneben (links/rechts, k = Überlappung in Möwenbreiten); Füße am unteren Fensterrand.
   h/hm = Höhe in Anteilen der Fensterhöhe (Desktop/Handy). m = Handy-Ziel: Sie steht auf der Oberkante des Textes darunter.
   Die Position wird laufend aus dem echten Element gelesen. */
const TARGETS = [
  { sel: '.s1 .bigw', fx: .5, h: .86, hm: .42, m: { sel: '.s1 .q', fx: .8 } },
  { sel: '.s2 .bigw', fx: .65, h: .82, hm: .34, m: { sel: '.s2 .orl', fx: .85 } },
  { sel: '.s3 .bigw', side: 'left', k: .2, h: .8, hm: .34, m: { sel: '.s3 .dz', fx: .85 } },
  { sel: '.s4 .date', side: 'right', k: .5, h: .5, hm: .26, m: { sel: '.s4 .date', fx: .86, bottom: true } },
  { sel: '.s5 .stack', fx: .3, h: .5, hm: .3, m: { sel: '.s5 .stack', fx: .8 } },
  { sel: '.s6 .bigw', side: 'right', k: .35, h: .84, hm: .38, m: { sel: '.s6 .ct', fx: .85 } },
];
const tEls = [];
const clamp = THREE.MathUtils.clamp, lerp = THREE.MathUtils.lerp;
const ease = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
const smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
const rand = (a, b) => a + Math.random() * (b - a);

let renderer, scene, cam, bird, mixer, headBone = null, neckBone = null, A = {}, current = null;
let ready = false, loading = false, failed = false, running = false;
let state = 'idle', fly = null, thinkT = 4, blinkT = 2, followW = 0, sec = 0, lastY = 0, sv = 0;
let visH = 1, halfW = 1, halfH = 1, H0 = 1;
const cur = { x: 0, y: 0, z: 0, s: 1, yaw: 0 };
let tgtNow = { look: [0, 0] };
const look = { yaw: 0, pitch: 0 }, ptr = { x: 0, y: 0, t: -1e9 }, applied = new Map(), clock = new THREE.Clock();

const curSec = () => Math.max(0, [...document.querySelectorAll('[data-sl]')].findIndex(s => s.classList.contains('act')));
function size() {
  if (!renderer) return;
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  visH = 2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.position.z; halfH = visH / 2; halfW = halfH * cam.aspect;
}
function targetWorld(i) {
  i = Math.min(i, TARGETS.length - 1); const mob = innerWidth < 900, T0 = TARGETS[i], T = mob ? { ...T0, ...T0.m, side: null } : T0;
  const key = i + (mob ? 'm' : 'd'), el = tEls[key] || (tEls[key] = document.querySelector(T.sel));
  const r = el ? el.getBoundingClientRect() : { left: innerWidth * .6, right: innerWidth * .8, width: innerWidth * .2, top: innerHeight * .6, bottom: innerHeight * .7, height: 100 };
  let gh = (mob ? T0.hm : T0.h) * innerHeight;
  if (mob && !T.bottom) gh = Math.max(innerHeight * .2, Math.min(gh, r.top - 66));   // Handy: nur so groß, dass sie über dem Text Platz findet
  const hf = gh / innerHeight, gw = gh * .58;
  let px = T.side === 'left' ? r.left - gw * T.k : T.side === 'right' ? r.right + gw * T.k : r.left + T.fx * r.width;
  px = clamp(px, gw * .4 + (mob ? 0 : 160), innerWidth - gw * .4);
  // Desktop: Füße am unteren Rand (Möwe wächst von unten ins Bild wie die Person der Referenz). Handy: steht auf der Oberkante des Textes.
  const py = mob && !T.bottom ? clamp(r.top + 4, 60 + gh, innerHeight) : innerHeight + gh * .03;
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  return { x: (px / innerWidth * 2 - 1) * halfW, y: (1 - py / innerHeight * 2) * halfH, z: 0, s: hf * visH / H0,
    yaw: px > cx ? -.55 : .55, look: [clamp(cx / innerWidth * 2 - 1, -1, 1), clamp(1 - cy / innerHeight * 2, -1, 1)] };
}
function place() { bird.position.set(cur.x, cur.y, cur.z); bird.scale.setScalar(cur.s); bird.rotation.y = cur.yaw; }

function fadeTo(name, d = .3) { const n = A[name]; if (!n || current === n) return; n.reset().setEffectiveWeight(1).fadeIn(d).play(); current?.fadeOut(d); current = n; }
function toIdle() { state = 'idle'; A.Flap?.setLoop(THREE.LoopOnce, 1); if (A.Flap) A.Flap.timeScale = 1; fadeTo('Idle', .4); thinkT = rand(4, 9); }
function blink(twice) { if (!A.Blink) return; A.Blink.reset().play(); if (twice) setTimeout(() => A.Blink.reset().play(), 330); }
function flapOnce() { state = 'flap'; A.Flap.setLoop(THREE.LoopOnce, 1); A.Flap.timeScale = 1; fadeTo('Flap', .15); }

/* Flug zum Platz des Kapitels: Absprung, hoher Bogen mit Flügelschlag, Landung */
function flyTo(i, intro) {
  const to = targetWorld(i);
  if (intro) { cur.x = to.x + halfW * .25; cur.y = halfH * 1.5; cur.z = 0; cur.s = to.s * .8; cur.yaw = -.9; place(); }
  const from = { ...cur }, dist = Math.abs(to.x - from.x) / (halfW * 2) + Math.abs(to.y - from.y) / visH;
  fly = { t0: performance.now(), dur: intro ? 2 : 1.15 + Math.min(.7, dist * .9), from, to, apex: (intro ? .1 : .3) * visH };
  state = 'fly'; A.Flap.setLoop(THREE.LoopRepeat, Infinity); A.Flap.timeScale = 1.8; fadeTo('Flap', .12);
}
function stepFly(now) {
  fly.to = targetWorld(sec);   // Ziel folgt der Headline, auch wenn die Seite noch scrollt
  const u = clamp((now - fly.t0) / 1000 / fly.dur, 0, 1), { from, to } = fly, e = ease(u), arc = Math.sin(Math.PI * u);
  cur.x = lerp(from.x, to.x, e); cur.y = lerp(from.y, to.y, e) + arc * fly.apex; cur.z = arc * .6; cur.s = lerp(from.s, to.s, e) * (1 - .5 * arc);
  const dir = Math.sign(to.x - from.x) || (to.yaw > 0 ? 1 : -1), travel = dir * 1.15;
  cur.yaw = lerp(lerp(from.yaw, travel, smooth(u * 4)), to.yaw, smooth((u - .72) / .28));
  place();
  if (u >= 1) { cur.z = 0; cur.yaw = to.yaw; place(); toIdle(); flapOnce(); }
}

/* Blickziel: Zeiger (3 s nach der letzten Bewegung, auch Touch) → Scrollrichtung → Flugziel → Platz-Blick */
function gazeNdc(now) {
  if (now - ptr.t < 3000) return [ptr.x, ptr.y];
  if (Math.abs(sv) > 3) return [0, sv > 0 ? -.75 : .75];
  if (state === 'fly' && fly) { const l = fly.to.look; return [l[0], l[1]]; }
  return tgtNow.look;
}
function headFollow(dt, now) {
  if (!headBone) return;
  const want = state === 'fly' ? .35 : (state === 'idle' || state === 'flap' ? .85 : 0);
  followW += (want - followW) * Math.min(1, dt * 4);
  if (followW < .01) return;
  const [nx, ny] = gazeNdc(now), hp = new THREE.Vector3(); headBone.getWorldPosition(hp);
  const ray = new THREE.Vector3(nx, ny, .5).unproject(cam).sub(cam.position).normalize();
  const tgt = cam.position.clone().addScaledVector(ray, (hp.z + 1.5 - cam.position.z) / Math.min(-.05, ray.z));
  const local = tgt.sub(hp).applyQuaternion(bird.quaternion.clone().invert());
  const yawT = clamp(Math.atan2(local.x, local.z), -.9, .9), pitchT = clamp(Math.atan2(local.y, Math.hypot(local.x, local.z)), -.4, .32);
  look.yaw += (yawT - look.yaw) * Math.min(1, dt * 6); look.pitch += (pitchT - look.pitch) * Math.min(1, dt * 6);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(bird.quaternion);
  for (const [bone, f] of neckBone ? [[neckBone, .45], [headBone, .55]] : [[headBone, 1]]) {
    const d = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), look.yaw * followW * f)
      .multiply(new THREE.Quaternion().setFromAxisAngle(right, -look.pitch * followW * f));
    const pq = new THREE.Quaternion(); bone.parent.getWorldQuaternion(pq);
    const lq = pq.clone().invert().multiply(d).multiply(pq);
    bone.quaternion.premultiply(lq); applied.set(bone, lq); bone.updateMatrixWorld(true);
  }
}

function loop() {
  const now = performance.now(), dt = Math.min(clock.getDelta(), .05);
  const y = scrollY; sv += ((y - lastY) - sv) * .2; lastY = y;
  for (const [bone, dq] of applied) bone.quaternion.premultiply(dq.clone().invert());   // Zusatzdrehung des letzten Bildes zurücknehmen
  applied.clear();
  mixer.update(dt);
  if ((blinkT -= dt) <= 0) { blink(Math.random() < .25); blinkT = rand(1.8, 5.8); }
  if (state === 'idle' && (thinkT -= dt) <= 0) { if (Math.random() < .55) { state = 'look'; fadeTo('Look', .3); } else flapOnce(); thinkT = rand(4, 9); }
  tgtNow = targetWorld(sec);
  if (state === 'fly') stepFly(now);
  else { const k = 1 - Math.exp(-dt * 9); cur.x += (tgtNow.x - cur.x) * k; cur.y += (tgtNow.y - cur.y) * k; cur.s += (tgtNow.s - cur.s) * k; cur.yaw += (tgtNow.yaw - cur.yaw) * k; cur.z = 0; place(); }
  headFollow(dt, now);
  renderer.render(scene, cam);
}

async function init() {
  if (loading || ready || failed) return; loading = true;
  try {
    const mobile = innerWidth < 900;
    renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.domElement.className = 'gull3d'; renderer.domElement.setAttribute('aria-hidden', 'true');
    scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(30, 1, .1, 80); cam.position.set(0, 0, 9);
    scene.add(new THREE.HemisphereLight(0xfff3e4, 0x8a7566, 1.5));
    const sun = new THREE.DirectionalLight(0xfff1df, 2.3); sun.position.set(-4, 7, 6); scene.add(sun);
    const rim = new THREE.DirectionalLight(0xffffff, .8); rim.position.set(5, 3, -5); scene.add(rim);
    bird = new THREE.Group(); bird.rotation.order = 'YXZ'; scene.add(bird);
    const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
    const buf = await (await fetch(new URL('../media/moewe.glb', import.meta.url))).arrayBuffer();
    const gltf = await loader.parseAsync(buf, '');
    const m = gltf.scene, box = new THREE.Box3().setFromObject(m);
    H0 = box.max.y - box.min.y; m.position.y = -box.min.y;
    m.traverse(o => { if (o.isMesh) o.frustumCulled = false; if (o.isBone && o.name === 'head') headBone = o; if (o.isBone && o.name === 'neck') neckBone = o; });
    for (const t of gltf.animations.find(c => c.name === 'Blink')?.tracks ?? []) {   // Ruhepose der Lider = geschlossen → vor dem Binden auf „offen“
      const p = THREE.PropertyBinding.parseTrackName(t.name), n = THREE.PropertyBinding.findNode(m, p.nodeName);
      if (n && p.propertyName === 'scale') n.scale.fromArray(t.values, 0);
    }
    bird.add(m); mixer = new THREE.AnimationMixer(m);
    const isLid = t => /lid/i.test(t.name);
    for (const clip of gltf.animations) { const c = clip.clone(); c.tracks = c.tracks.filter(t => (clip.name === 'Blink' ? isLid(t) : !isLid(t))); A[clip.name] = mixer.clipAction(c); }
    for (const n of ['Flap', 'Look', 'Blink']) A[n]?.setLoop(THREE.LoopOnce, 1);
    mixer.addEventListener('finished', e => { if (e.action === A.Flap || e.action === A.Look) toIdle(); });
    A.Idle.play(); current = A.Idle;
    document.body.appendChild(renderer.domElement); size();
    sec = curSec(); lastY = scrollY; ready = true; loading = false;
    if (NK.motionOn()) resume(true);
  } catch (e) { failed = true; loading = false; console.warn('3D-Möwe nicht verfügbar, Standbild bleibt:', e?.message || e); }
}
function resume(intro) {
  if (!ready || running) return; running = true;
  renderer.domElement.style.display = ''; root.classList.add('g3d'); clock.getDelta();
  if (intro) flyTo(sec, true); else { const t = targetWorld(sec); Object.assign(cur, t); place(); toIdle(); }
  renderer.setAnimationLoop(loop);
}
function pause() { if (!running) return; running = false; renderer.setAnimationLoop(null); renderer.domElement.style.display = 'none'; root.classList.remove('g3d'); }

if (NK && location.search.includes('debug')) {   // nur zum Testen: Zustand und Flügeldrehung auslesen
  window.__gull = () => { let w = null; bird?.traverse(o => { if (o.isBone && /^wing/i.test(o.name) && /L$/.test(o.name)) w = o; });
    return { state, flap: !!A.Flap?.isRunning(), wing: w ? +w.quaternion.x.toFixed(3) + ',' + +w.quaternion.z.toFixed(3) : null, pos: [+cur.x.toFixed(2), +cur.y.toFixed(2)], head: [+look.yaw.toFixed(2), +look.pitch.toFixed(2)] }; };
}
if (NK) {
  addEventListener('pointermove', e => { ptr.x = (e.clientX / innerWidth) * 2 - 1; ptr.y = -(e.clientY / innerHeight) * 2 + 1; ptr.t = performance.now(); }, { passive: true });
  addEventListener('pointerdown', e => { ptr.x = (e.clientX / innerWidth) * 2 - 1; ptr.y = -(e.clientY / innerHeight) * 2 + 1; ptr.t = performance.now(); }, { passive: true });
  addEventListener('k12:section', e => { sec = e.detail; if (running) flyTo(sec, false); });
  addEventListener('resize', () => { if (!ready) return; size(); if (running && state !== 'fly') { Object.assign(cur, targetWorld(sec)); place(); } });
  addEventListener('nk:motion', () => { if (NK.motionOn()) { if (ready) resume(false); else init(); } else pause(); });
  if (NK.motionOn()) setTimeout(init, 200);
}
