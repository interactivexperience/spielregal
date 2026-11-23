/* Konzept 4 · Gezeiten – Wasserstand folgt dem Scroll: zweimal Flut, zweimal Ebbe über die Seite */
(() => {
  const { $, motionOn } = window.NK || {};
  if (!$) return;
  const root = document.documentElement, pegel = $('[data-pegel]');
  let tick = false;
  const upd = () => { tick = false;
    const h = root.scrollHeight - innerHeight, sp = h > 0 ? scrollY / h : 0;
    const lv = motionOn() ? .1 + .42 * (.5 - .5 * Math.cos(sp * Math.PI * 4)) : .1;
    root.style.setProperty('--lv', lv.toFixed(3));
    if (pegel) pegel.textContent = (1.2 + lv * 4.4).toFixed(1).replace('.', ',');
  };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  addEventListener('resize', upd); addEventListener('nk:motion', upd); upd();
})();
