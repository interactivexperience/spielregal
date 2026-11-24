/* Konzept 17 · Index – aktiver Navigationspunkt folgt dem sichtbaren Block; Möwe driftet leicht mit dem Scroll (transform) */
(() => {
  const { $, $$, motionOn } = window.NK || {};
  const links = $ && $$('.hd-nav a');
  if (!links) return;
  const map = { leistung: 0, studio: 1, arbeit: 2, kontakt: 3 };
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && e.target.id in map) links.forEach((a, i) => { if (i === map[e.target.id]) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); }), { rootMargin: '-45% 0px -45% 0px' });
  $$('main section[id]').forEach(s => io.observe(s));
  const g = $('.gbw img'); if (!g) return;
  let tick = false;
  const upd = () => { tick = false; const p = Math.min(1, scrollY / innerHeight); g.style.transform = motionOn() ? `translate3d(0,${(p * 12).toFixed(1)}vh,0)` : ''; };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  addEventListener('nk:motion', upd); upd();
})();
