/* Konzept 16 · Stencil – Zähler [ 00x ] folgt dem sichtbaren Kapitel, Möwe driftet mit dem Scroll gegen die Schrift (transform) */
(() => {
  const { $, $$, motionOn } = window.NK || {};
  const sls = $ && $$('[data-sl]');
  if (!sls || !sls.length) return;
  const cur = $('[data-cur]');
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && cur) cur.textContent = String(sls.indexOf(e.target) + 1).padStart(3, '0'); }), { threshold: .5 });
  sls.forEach(s => io.observe(s));
  const obj = $('[data-obj] img');
  let tick = false, px = 0, py = 0, sy = 0;
  const gl = $$('[data-lg]');
  const upd = () => { tick = false; const on = motionOn(), y = Math.min(1, scrollY / innerHeight); sy = y;
    if (obj) obj.style.transform = on ? `translate3d(0,${(y * 14).toFixed(1)}vh,0) rotate(${(y * 6).toFixed(2)}deg)` : '';
    /* Liquid-Glas: Zeiger und Scroll schieben und drehen die Elemente leicht */
    gl.forEach((g, i) => { const k = (i % 3 + 1) * .6;
      g.style.setProperty('--gx', on ? (px * 36 * k).toFixed(1) + 'px' : '0px');
      g.style.setProperty('--gy', on ? (py * 24 * k + y * (i % 2 ? -40 : 60)).toFixed(1) + 'px' : '0px');
      g.style.setProperty('--gr', on ? (px * 10 * k + y * 30 * (i % 2 ? -1 : 1)).toFixed(1) + 'deg' : '0deg'); }); };
  const q = () => { if (!tick) { tick = true; requestAnimationFrame(upd); } };
  addEventListener('scroll', q, { passive: true });
  addEventListener('pointermove', e => { px = e.clientX / innerWidth - .5; py = e.clientY / innerHeight - .5; q(); }, { passive: true });
  addEventListener('nk:motion', q); upd();
})();
