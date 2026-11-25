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

  /* Möwe: Kopf folgt dem Zeiger, im Leerlauf möwentypische Gesten (umschauen, picken, Gefieder schütteln, Hüpfer) */
  const gull = $('[data-gull]');
  if (gull) {
    const head = $('.gh', gull), body = $('.gb', gull), cl = (v, a, b) => Math.max(a, Math.min(b, v));
    let last = performance.now(), cur = { r: 0, x: 0, y: 0 }, tgt = { r: 0, x: 0, y: 0 }, raf = 0, busy = false, lastAct = -1;
    const eye = () => { const r = gull.getBoundingClientRect(); return { x: r.left + r.width * .52, y: r.top + r.height * .17 }; };
    const loop = () => { cur.r += (tgt.r - cur.r) * .12; cur.x += (tgt.x - cur.x) * .12; cur.y += (tgt.y - cur.y) * .12;
      head.style.transform = `translate3d(${cur.x.toFixed(2)}px,${cur.y.toFixed(2)}px,0) rotate(${cur.r.toFixed(2)}deg)`; body.style.transform = `rotate(${(-cur.r * .12).toFixed(2)}deg)`;
      raf = (Math.abs(tgt.r - cur.r) + Math.abs(tgt.x - cur.x) + Math.abs(tgt.y - cur.y) > .02) ? requestAnimationFrame(loop) : 0; };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    addEventListener('pointermove', e => { if (!motionOn()) return; last = performance.now();
      const c = eye(), dx = cl((e.clientX - c.x) / (innerWidth * .5), -1, 1), dy = cl((c.y - e.clientY) / (innerHeight * .6), -1, 1);
      tgt.r = dy * 8 - dx * 2; tgt.x = dx * 7; tgt.y = -dy * 3; kick(); }, { passive: true });
    const ease = 'cubic-bezier(.45,0,.2,1)';
    const acts = [
      () => head.animate([{ rotate: '0deg', translate: '0 0' }, { rotate: '-6deg', translate: '-4px 2px', offset: .3 }, { rotate: '7deg', translate: '5px -3px', offset: .65 }, { rotate: '0deg', translate: '0 0' }], { duration: 3200, easing: ease }),
      () => head.animate([{ rotate: '0deg', translate: '0 0' }, { rotate: '-13deg', translate: '-6px 10px', offset: .18 }, { rotate: '1deg', translate: '0 0', offset: .34 }, { rotate: '-13deg', translate: '-6px 10px', offset: .52 }, { rotate: '0deg', translate: '0 0' }], { duration: 1500, easing: ease }),
      () => { body.animate([{ rotate: '0deg' }, { rotate: '1.4deg' }, { rotate: '-1.4deg' }, { rotate: '1.1deg' }, { rotate: '-1.1deg' }, { rotate: '0deg' }], { duration: 650, iterations: 2 }); return head.animate([{ rotate: '0deg' }, { rotate: '4deg' }, { rotate: '-4deg' }, { rotate: '3deg' }, { rotate: '-3deg' }, { rotate: '0deg' }], { duration: 650, iterations: 2 }); },
      () => { gull.animate([{ translate: '0 0' }, { translate: '0 -22px', offset: .4 }, { translate: '0 0', offset: .75 }, { translate: '0 -5px', offset: .88 }, { translate: '0 0' }], { duration: 700, easing: ease }); return head.animate([{ rotate: '0deg' }, { rotate: '-5deg', offset: .5 }, { rotate: '0deg' }], { duration: 700 }); },
    ];
    setInterval(() => {
      if (busy || !motionOn() || document.hidden || performance.now() - last < 2400) return;
      const r = gull.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      let i; do { i = Math.floor(Math.random() * acts.length); } while (i === lastAct); lastAct = i;
      busy = true; tgt.r = 0; tgt.x = 0; tgt.y = 0; kick();
      const a = acts[i](); (a.finished || Promise.resolve()).then(() => { busy = false; }, () => { busy = false; });
    }, 3000);
  }

  /* Zitate: Wörter einzeln, damit sie beim Einblenden nacheinander aufleuchten */
  $$('[data-words]').forEach(q => { const t = q.textContent; q.setAttribute('aria-label', t); q.textContent = '';
    t.split(' ').forEach((w, i, a) => { const s = document.createElement('span'); s.className = 'wd'; s.style.setProperty('--i', i); s.setAttribute('aria-hidden', 'true'); s.textContent = w; q.appendChild(s); if (i < a.length - 1) q.appendChild(document.createTextNode(' ')); }); });

  /* Stimmen: ein Zitat im Fokus, Auswahl darunter */
  const vox = $('.vox');
  if (vox) { const qs = $$('.vq', vox), bs = $$('.vsel button', vox);
    bs.forEach((b, i) => b.addEventListener('click', () => { qs.forEach((q, j) => q.classList.toggle('on', j === i)); bs.forEach((x, j) => x.setAttribute('aria-selected', String(j === i))); })); }

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
  const pv = $('.pv'), work = $('[data-work]'), pc = $('.pc');
  if (pv && work) {
    const img = $('img', pv); let x = 0, y = 0, cx = 0, cy = 0, raf = 0, shown = false;
    const loop = () => { cx += (x - cx) * .16; cy += (y - cy) * .16;
      const sk = Math.max(-8, Math.min(8, (x - cx) * .08));
      pv.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0) scale(${shown ? 1 : .86}) rotate(${(shown ? sk : -3).toFixed(2)}deg)`;
      raf = (Math.abs(x - cx) + Math.abs(y - cy) > .4 || shown !== pv.classList.contains('on')) ? requestAnimationFrame(loop) : 0; };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    const place = e => { const w = pv.offsetWidth, h = pv.offsetHeight;
      x = Math.min(innerWidth - w - 16, Math.max(16, e.clientX + 60));      // rechts vom Zeiger, ragt über die Zeile hinaus
      y = Math.min(innerHeight - h - 16, Math.max(16, e.clientY - h * .55)); };
    $$('a', work).forEach(a => {
      a.addEventListener('pointerenter', e => { if (!motionOn()) return; img.src = a.dataset.src; shown = true; pv.classList.add('on'); if (pc) { pc.classList.add('on'); pc.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`; } place(e); if (!pv.dataset.init) { cx = x; cy = y; pv.dataset.init = 1; } kick(); });
      a.addEventListener('pointermove', e => { if (!shown) return; place(e); if (pc) pc.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`; kick(); });
      a.addEventListener('pointerleave', () => { shown = false; pv.classList.remove('on'); if (pc) pc.classList.remove('on'); kick(); });
    });
    addEventListener('scroll', () => { if (shown) { shown = false; pv.classList.remove('on'); if (pc) pc.classList.remove('on'); kick(); } }, { passive: true });
  }
})();
