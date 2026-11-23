/* Konzept 1 · Hafenkarte – Kompass im Menü, Routen-Fortschritt (Präsentation: shared/deck.js) */
(() => {
  const { $, $$ } = window.NK || {};
  if (!$) return;

  /* Kompassnadel folgt dem Menüpunkt */
  const mc = $('.menu-compass'), deg = $('[data-deg]');
  const aim = v => { if (!mc) return; mc.style.setProperty('--rot', v + 'deg'); if (deg) deg.textContent = String(v).padStart(3, '0'); };
  $$('.menu-nav li>a').forEach(a => {
    const v = +a.dataset.rot;
    ['mouseenter', 'focus'].forEach(ev => a.addEventListener(ev, () => aim(v)));
  });

  /* Routen-Fortschritt je Stationsbereich (nur Variable, kein Layout) */
  const sts = $$('.stations');
  if (sts.length) {
    let tick = false;
    const upd = () => { tick = false;
      sts.forEach(s => { const r = s.getBoundingClientRect(), h = r.height;
        const p = Math.min(1, Math.max(0, (innerHeight * .6 - r.top) / h)); s.style.setProperty('--rp', p.toFixed(4)); }); };
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener('resize', upd); upd();
  }
})();
