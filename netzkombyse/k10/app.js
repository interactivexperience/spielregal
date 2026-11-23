/* Konzept 10 · Signal – Wortfüllung beim Scrollen, Cursor-Blase mit Beschriftung (nur Maus) */
(() => {
  const { $, $$, motionOn } = window.NK || {};
  if (!$) return;

  /* Text füllt sich Wort für Wort, gekoppelt an die Scrollposition */
  const fill = $('[data-fill]');
  if (fill) {
    const ws = $$('.sw', fill); let tick = false;
    const upd = () => { tick = false;
      const r = fill.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight * .85 - r.top) / (r.height + innerHeight * .35)));
      const n = Math.round(p * ws.length);
      ws.forEach((w, i) => w.classList.toggle('on', i < n)); };
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener('resize', upd); upd();
  }

  /* Cursor-Blase folgt der Maus und zeigt ein Stichwort über Elementen mit data-cur */
  const cur = $('.cur');
  if (cur && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    const label = $('span', cur);
    let x = -100, y = -100, cx = x, cy = y, s = .2, ts = .2, raf = 0;
    const loop = () => { cx += (x - cx) * .2; cy += (y - cy) * .2; s += (ts - s) * .2;
      cur.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0) scale(${s.toFixed(3)})`;
      raf = (Math.abs(x - cx) + Math.abs(y - cy) + Math.abs(ts - s) * 50 > .3) ? requestAnimationFrame(loop) : 0; };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' || !motionOn()) return;
      x = e.clientX; y = e.clientY; cur.classList.add('on');
      const t = e.target.closest?.('[data-cur]');
      if (t) { label.textContent = t.dataset.cur; cur.classList.add('big'); ts = 1; } else { cur.classList.remove('big'); ts = .2; }
      kick(); }, { passive: true });
    document.addEventListener('mouseleave', () => cur.classList.remove('on'));
  }
})();
