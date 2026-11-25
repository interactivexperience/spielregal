/* Konzept 15 · echte 3D-Möwe im Hero (Owner-Modell „Möwe 1“ aus Konzept 12: Skelett mit Hals, Kopf, Lidern, Flügeln).
   Sie sitzt ruhig, atmet, blinzelt selten. Hals und Kopf drehen sich im Raum zum Zeiger (links, rechts, oben, unten), auch Touch.
   Flügelschlag nur beim Anklicken, kein Hüpfen. Ohne WebGL oder bei „Bewegung aus“ bleibt das Standbild (2D). */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const NK = window.NK;
const wrap = location.search.includes('3d') ? document.querySelector('[data-gull]') : null;   // nur mit ?3d: Standard ist das Foto-Bild der Möwe (bessere Qualität)
const clamp = THREE.MathUtils.clamp, rand = (a, b) => a + Math.random() * (b - a);
let renderer, scene, cam, bird, mixer, headBone = null, neckBone = null, A = {}, current = null, H0 = 1;
let ready = false, loading = false, failed = false, running = false, blinkT = 2, lookT = 9, followW = 0;
const look = { yaw: 0, pitch: 0 }, ptr = { x: .6, y: .1, t: -1e9 }, applied = new Map(), clock = new THREE.Clock();

function size() {
  if (!renderer || !wrap) return;
  const w = wrap.clientWidth, h = wrap.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); cam.aspect = w / h;
  /* Möwe füllt die Höhe des Rahmens (Füße am unteren Rand, etwas Luft oben) */
  const vis = H0 * 1.06; cam.position.set(0, H0 * .5, vis / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)))); cam.lookAt(0, H0 * .5, 0);
  cam.updateProjectionMatrix();
}

function fadeTo(name, d = .35) { const n = A[name]; if (!n || current === n) return; n.reset().setEffectiveWeight(1).fadeIn(d).play(); current?.fadeOut(d); current = n; }
function toIdle() { A.Flap?.setLoop(THREE.LoopOnce, 1); if (A.Flap) A.Flap.timeScale = 1; fadeTo('Idle', .5); }
function blink(twice) { if (!A.Blink) return; A.Blink.reset().play(); if (twice) setTimeout(() => A.Blink.reset().play(), 330); }

function gaze(now) {
  /* Zeiger, solange er sich bewegt hat; sonst ruhig Richtung Seitenmitte */
  const a = now - ptr.t < 6000 ? 1 : 0;
  return [a ? ptr.x : -.15, a ? ptr.y : .05];
}
function headFollow(dt, now) {
  if (!headBone) return;
  followW += (1 - followW) * Math.min(1, dt * 4);
  const [nx, ny] = gaze(now), hp = new THREE.Vector3(); headBone.getWorldPosition(hp);
  /* Blickpunkt im Raum: vom Zeiger durch die Kamera auf eine Ebene vor dem Kopf */
  const ray = new THREE.Vector3(nx, ny, .5).unproject(cam).sub(cam.position).normalize();
  const tgt = cam.position.clone().addScaledVector(ray, (hp.z + 1.5 - cam.position.z) / Math.min(-.05, ray.z));
  const local = tgt.sub(hp).applyQuaternion(bird.quaternion.clone().invert());
  const yawT = clamp(Math.atan2(local.x, local.z), -1.15, 1.15), pitchT = clamp(Math.atan2(local.y, Math.hypot(local.x, local.z)), -.45, .4);
  look.yaw += (yawT - look.yaw) * Math.min(1, dt * 5); look.pitch += (pitchT - look.pitch) * Math.min(1, dt * 5);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(bird.quaternion);
  for (const [bone, f] of neckBone ? [[neckBone, .5], [headBone, .6]] : [[headBone, 1]]) {
    const d = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), look.yaw * followW * f)
      .multiply(new THREE.Quaternion().setFromAxisAngle(right, -look.pitch * followW * f));
    const pq = new THREE.Quaternion(); bone.parent.getWorldQuaternion(pq);
    const lq = pq.clone().invert().multiply(d).multiply(pq);
    bone.quaternion.premultiply(lq); applied.set(bone, lq); bone.updateMatrixWorld(true);
  }
}

function loop() {
  const now = performance.now(), dt = Math.min(clock.getDelta(), .05);
  for (const [bone, dq] of applied) bone.quaternion.premultiply(dq.clone().invert());   // Zusatzdrehung des letzten Bildes zurücknehmen
  applied.clear();
  mixer.update(dt);
  if ((blinkT -= dt) <= 0) { blink(Math.random() < .2); blinkT = rand(2.5, 6.5); }
  if ((lookT -= dt) <= 0) { lookT = rand(14, 26); if (A.Look && now - ptr.t > 6000) { A.Look.reset(); fadeTo('Look', .4); } }
  headFollow(dt, now);
  renderer.render(scene, cam);
}

async function loadBuffer() {
  try {
    const r = await fetch(new URL('../media/moewe.glb', import.meta.url));
    if (r.ok) { const b = await r.arrayBuffer(); if (new Uint8Array(b, 0, 4).join() === '103,108,84,70') return b; }   // „glTF“
  } catch (e) { /* weiter mit Modul */ }
  const b64 = (await import('../media/moewe.glb.js')).default;
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;
}

async function init() {
  if (!wrap || loading || ready || failed) return; loading = true;
  try {
    const mobile = innerWidth < 900;
    renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .78;
    renderer.domElement.className = 'gull3d'; renderer.domElement.setAttribute('aria-hidden', 'true');
    scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(26, 1, .1, 80);
    /* Licht wie im Standbild: weiche warme Fläche, starkes orangefarbenes Randlicht von rechts hinten, kaum Kontrast von vorn */
    scene.add(new THREE.HemisphereLight(0xffe2c8, 0x3a1608, .9));
    const sun = new THREE.DirectionalLight(0xffcfa0, 1.25); sun.position.set(-4, 5, 5); scene.add(sun);
    const rim = new THREE.DirectionalLight(0xff5a14, 4.2); rim.position.set(6, 2.5, -3); scene.add(rim);
    const rim2 = new THREE.DirectionalLight(0xff7a30, 1.6); rim2.position.set(5, 1, 4); scene.add(rim2);
    bird = new THREE.Group(); bird.rotation.order = 'YXZ'; bird.rotation.y = +.95; scene.add(bird);
    const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.parseAsync(await loadBuffer(), '');
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
    wrap.appendChild(renderer.domElement);
    size(); ready = true; loading = false;
    if (NK.motionOn()) resume();
  } catch (e) { failed = true; loading = false; console.warn('3D-Möwe nicht verfügbar, Standbild bleibt:', e?.message || e); }
}
function resume() {
  if (!ready || running) return; running = true;
  renderer.domElement.style.display = ''; wrap.classList.add('g3'); clock.getDelta();
  renderer.setAnimationLoop(loop);
}
function pause() { if (!running) return; running = false; renderer.setAnimationLoop(null); renderer.domElement.style.display = 'none'; wrap.classList.remove('g3'); }

if (NK && wrap) {
  const set = e => { const r = wrap.getBoundingClientRect(); ptr.x = (e.clientX / innerWidth) * 2 - 1; ptr.y = -(e.clientY / innerHeight) * 2 + 1; ptr.t = performance.now(); };
  addEventListener('pointermove', set, { passive: true }); addEventListener('pointerdown', set, { passive: true });
  /* Flügelschlag nur auf Klick */
  wrap.style.pointerEvents = 'auto'; wrap.style.cursor = 'pointer';
  wrap.addEventListener('click', () => { if (running && A.Flap) { A.Flap.setLoop(THREE.LoopOnce, 1); A.Flap.timeScale = 1; fadeTo('Flap', .15); } });
  addEventListener('resize', () => { if (ready) size(); });
  addEventListener('nk:motion', () => { if (NK.motionOn()) { if (ready) resume(); else init(); } else pause(); });
  if (NK.motionOn()) setTimeout(init, 200);
}
if (NK && location.search.includes('debug')) window.__gull = () => ({ running, ready, failed, yaw: +look.yaw.toFixed(2), pitch: +look.pitch.toFixed(2) });
