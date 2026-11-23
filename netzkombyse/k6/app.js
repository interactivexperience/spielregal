/* Konzept 6 · Fischmarkt – Wortzeilen laufen mit dem Scroll gegenläufig seitwärts */
(() => {
  const { $$, motionOn } = window.NK || {};
  const rows = $$ && $$('[data-slide]');
  if (!rows || !rows.length) return;
  let tick = false;
  const upd = () => { tick = false;
    rows.forEach(r => {
      const b = r.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight - b.top) / (innerHeight + b.height)));   // 0 = unten rein … 1 = oben raus
      const x = motionOn() ? (p - .5) * 38 * Number(r.dataset.slide) : 0;                      // vw
      r.style.setProperty('--x', x.toFixed(2) + 'vw');
    });
  };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  addEventListener('resize', upd); addEventListener('nk:motion', upd); upd();
})();
