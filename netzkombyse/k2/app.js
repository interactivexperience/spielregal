/* Konzept 2 · Brise – Wind in der Headline, Leuchtturm-Etagen, Postkarten ziehen, scheue Möwe */
(() => {
  const { $, $$, motionOn } = window.NK || {};
  if (!$) return;

  /* Headline: Buchstaben wiegen sich im Wind (Zeigerposition) */
  $$('[data-wind]').forEach(h => {
    const txt = h.textContent.trim(); h.setAttribute('aria-label', txt); h.textContent = '';
    let n = 0;
    txt.split(/\s+/).forEach((w, wi, arr) => {
      const wd = document.createElement('span'); wd.className = 'wd'; wd.setAttribute('aria-hidden', 'true');
      [...w].forEach(c => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c;
        s.style.setProperty('--k', (Math.sin(n * 2.3) * .9 + Math.cos(n * .7) * .4).toFixed(2)); s.style.setProperty('--n', n++); wd.appendChild(s); });
      h.appendChild(wd); if (wi < arr.length - 1) h.appendChild(document.createTextNode(' '));
    });
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => { cx += (tx - cx) * .08; cy += (ty - cy) * .08;
      h.style.setProperty('--wx', cx.toFixed(3)); h.style.setProperty('--wy', cy.toFixed(3));
      raf = (Math.abs(tx - cx) + Math.abs(ty - cy) > .003) ? requestAnimationFrame(loop) : 0; };
    addEventListener('pointermove', e => { if (!motionOn()) return; tx = (e.clientX / innerWidth - .5) * 2; ty = (e.clientY / innerHeight - .5) * 2; if (!raf) raf = requestAnimationFrame(loop); }, { passive: true });
  });

  /* Menü: Buchstaben für die Wellen-Hover-Animation */
  $$('[data-wave]').forEach(el => { const t = el.textContent; el.setAttribute('aria-label', t); el.textContent = '';
    [...t].forEach((c, i) => { const s = document.createElement('span'); s.textContent = c; s.style.setProperty('--i', i); s.setAttribute('aria-hidden', 'true'); el.appendChild(s); }); });

  /* Leuchtturm: Etage im Blick → Fenster leuchtet */
  const lh = $('[data-lh]');
  if (lh) {
    const tower = $('.lh-t', lh), floors = $$('[data-floor]', lh);
    const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return;
      floors.forEach(f => f.classList.toggle('on', f === e.target)); tower.dataset.f = e.target.dataset.floor; }), { rootMargin: '-40% 0px -40% 0px' });
    floors.forEach(f => io.observe(f)); floors[0]?.classList.add('on');
  }

  /* Postkarten per Maus ziehen (Touch scrollt nativ) */
  $$('[data-drag]').forEach(el => {
    let down = false, sx = 0, sl = 0, moved = 0;
    el.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = 0; sx = e.clientX; sl = el.scrollLeft; el.classList.add('drag'); });
    addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx)); el.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { if (!down) return; down = false; el.classList.remove('drag'); });
    el.addEventListener('click', e => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
  });

  /* Scheue Möwe auf der Überschrift */
  const perch = $('.perch');
  if (perch) {
    let busy = false;
    const scare = () => { if (busy || !motionOn()) return; busy = true; perch.classList.add('flap', 'away');
      setTimeout(() => { perch.classList.remove('away', 'flap'); perch.classList.add('back', 'flap'); }, 2800);
      setTimeout(() => { perch.classList.remove('back', 'flap'); busy = false; }, 5300); };
    perch.addEventListener('pointerenter', scare); perch.addEventListener('click', scare);
  }
})();
