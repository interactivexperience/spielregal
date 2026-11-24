/* Konzept 14 · Pille – Blobs treiben mit dem Scroll leicht gegeneinander (transform), sonst nur die gemeinsamen Reveals */
(() => {
  const { $, $$, motionOn } = window.NK || {};
  const bl = $ && $$('.trio .blob');
  if (!bl || !bl.length) return;
  let tick = false;
  const upd = () => { tick = false; const r = bl[0].parentElement.getBoundingClientRect(), p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / innerHeight));
    bl.forEach((b, i) => { b.style.transform = motionOn() ? `translate3d(0,${(p * (i ? 40 : -40)).toFixed(1)}px,0) rotate(${(p * (i ? 4 : -4)).toFixed(2)}deg)` : ''; }); };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  addEventListener('nk:motion', upd); upd();
})();
