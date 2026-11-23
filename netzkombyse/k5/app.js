/* Konzept 5 · Leuchtfeuer – Lichtkegel folgt dem Zeiger (clip-path); ohne Maus fährt er von allein über die Zeile */
(() => {
  const { $, motionOn } = window.NK || {};
  const lit = $ && $('[data-lit]');
  if (!lit) return;
  const box = lit.parentElement;
  let tx = .5, ty = .5, cx = .5, cy = .5, r = 0, tr = 0, raf = 0, last = 0;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const draw = t => {
    raf = 0;
    const w = box.clientWidth, h = box.clientHeight;
    if (!motionOn()) { return; }
    if (!last || t - last > 4000) { /* Autopilot, solange der Zeiger ruht */
      tx = .5 + .4 * Math.sin(t / 2600); ty = .5 + .3 * Math.sin(t / 1900 + 1); tr = Math.max(w, h) * .28; }
    cx += (tx - cx) * .12; cy += (ty - cy) * .12; r += (tr - r) * .12;
    lit.style.setProperty('--x', (cx * w).toFixed(1) + 'px'); lit.style.setProperty('--y', (cy * h).toFixed(1) + 'px'); lit.style.setProperty('--r', r.toFixed(1) + 'px');
    raf = requestAnimationFrame(draw);
  };
  const start = () => { if (!raf && motionOn()) raf = requestAnimationFrame(draw); };
  if (fine) addEventListener('pointermove', e => {
    const b = box.getBoundingClientRect();
    if (e.clientY > b.bottom + 120 || e.clientY < b.top - 120) return;
    tx = (e.clientX - b.left) / b.width; ty = (e.clientY - b.top) / b.height; tr = Math.max(b.width, b.height) * .22; last = performance.now(); start();
  }, { passive: true });
  addEventListener('nk:motion', () => { if (motionOn()) start(); else { cancelAnimationFrame(raf); raf = 0; } });
  start();
})();
