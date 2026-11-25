/* Konzept 14 · Pille – magnetische Knöpfe, 3D-Neigung der Leistungskarten, große Projekt-Vorschau am Zeiger, Wort-für-Wort-Zitate (alles transform/opacity) */
(() => {
  const { $, $$, motionOn } = window.NK || {};
  if (!$) return;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* Möwe im Hero driftet mit dem Scroll */
  const hg = $('.hg');
  if (hg) { let tick = false;
    const upd = () => { tick = false; const p = Math.min(1, scrollY / innerHeight); hg.style.transform = motionOn() ? `translate3d(0,${(p * 50).toFixed(1)}px,0)` : ''; };
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true }); addEventListener('nk:motion', upd); upd(); }

  /* Zitate: Wörter einzeln, damit sie beim Einblenden nacheinander aufleuchten */
  $$('[data-words]').forEach(q => { const t = q.textContent; q.setAttribute('aria-label', t); q.textContent = '';
    t.split(' ').forEach((w, i, a) => { const s = document.createElement('span'); s.className = 'wd'; s.style.setProperty('--i', i); s.setAttribute('aria-hidden', 'true'); s.textContent = w; q.appendChild(s); if (i < a.length - 1) q.appendChild(document.createTextNode(' ')); }); });

  if (!fine) return;

  /* Magnetische Knöpfe */
  $$('[data-mag]').forEach(b => {
    b.addEventListener('pointermove', e => { if (!motionOn()) return; const r = b.getBoundingClientRect();
      b.style.transform = `translate3d(${((e.clientX - r.left) / r.width - .5) * 14}px,${((e.clientY - r.top) / r.height - .5) * 10}px,0)`; });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });

  /* Leistungskarten neigen sich zum Zeiger */
  $$('[data-tilt]').forEach(c => {
    c.addEventListener('pointermove', e => { if (!motionOn()) return; const r = c.getBoundingClientRect();
      c.style.transform = `rotateX(${(-((e.clientY - r.top) / r.height - .5) * 7).toFixed(2)}deg) rotateY(${(((e.clientX - r.left) / r.width - .5) * 9).toFixed(2)}deg)`; });
    c.addEventListener('pointerleave', () => { c.style.transform = ''; });
  });

  /* Projekt-Vorschau: groß, folgt dem Zeiger weich und ragt über die Zeile; Format je Projekt */
  const pv = $('.pv'), work = $('[data-work]');
  if (pv && work) {
    const img = $('img', pv); let x = 0, y = 0, cx = 0, cy = 0, raf = 0, shown = false;
    const loop = () => { cx += (x - cx) * .16; cy += (y - cy) * .16;
      const sk = Math.max(-8, Math.min(8, (x - cx) * .08));
      pv.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0) scale(${shown ? 1 : .86}) rotate(${(shown ? sk : -3).toFixed(2)}deg)`;
      raf = (Math.abs(x - cx) + Math.abs(y - cy) > .4 || shown !== pv.classList.contains('on')) ? requestAnimationFrame(loop) : 0; };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    const place = e => { const w = pv.offsetWidth, h = pv.offsetHeight;
      x = Math.min(innerWidth - w - 16, Math.max(16, e.clientX + 36));      // rechts vom Zeiger, ragt über die Zeile hinaus
      y = Math.min(innerHeight - h - 16, Math.max(16, e.clientY - h * .55)); };
    $$('a', work).forEach(a => {
      a.addEventListener('pointerenter', e => { if (!motionOn()) return; img.src = a.dataset.src; pv.dataset.fmt = a.dataset.fmt; shown = true; pv.classList.add('on'); place(e); if (!pv.dataset.init) { cx = x; cy = y; pv.dataset.init = 1; } kick(); });
      a.addEventListener('pointermove', e => { if (!shown) return; place(e); kick(); });
      a.addEventListener('pointerleave', () => { shown = false; pv.classList.remove('on'); kick(); });
    });
    addEventListener('scroll', () => { if (shown) { shown = false; pv.classList.remove('on'); kick(); } }, { passive: true });
  }
})();
