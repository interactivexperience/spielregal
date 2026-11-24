/* Konzept 16 · Stencil – Zähler [ 00x ] folgt dem sichtbaren Kapitel, Möwe driftet mit dem Scroll gegen die Schrift (transform) */
(() => {
  const { $, $$, motionOn } = window.NK || {};
  const sls = $ && $$('[data-sl]');
  if (!sls || !sls.length) return;
  const cur = $('[data-cur]');
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && cur) cur.textContent = String(sls.indexOf(e.target) + 1).padStart(3, '0'); }), { threshold: .5 });
  sls.forEach(s => io.observe(s));
  const obj = $('[data-obj] img');
  if (!obj) return;
  let tick = false;
  const upd = () => { tick = false; const y = Math.min(1, scrollY / innerHeight); obj.style.transform = motionOn() ? `translate3d(0,${(y * 14).toFixed(1)}vh,0) rotate(${(y * 6).toFixed(2)}deg)` : ''; };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  addEventListener('nk:motion', upd); upd();
})();
