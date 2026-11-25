/* Konzept 14 · Pille – die Möwe im Hero-Blob driftet leicht mit dem Scroll (transform), sonst nur die gemeinsamen Reveals */
(() => {
  const { $, motionOn } = window.NK || {};
  const b = $ && $('.hg');
  if (!b) return;
  let tick = false;
  const upd = () => { tick = false; const p = Math.min(1, scrollY / innerHeight); b.style.transform = motionOn() ? `translate3d(0,${(p * 50).toFixed(1)}px,0) rotate(${(p * -4).toFixed(2)}deg)` : ''; };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  addEventListener('nk:motion', upd); upd();
})();
