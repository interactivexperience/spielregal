/* Konzept 15 · Glut – Möwe mit Blick, Zeichen-Headlines, Riesenzeilen, drehende Karten, vier Projektansichten, typografische Stimmen, Lichtpunkt.
   Bewegt wird nur per transform/opacity. Alles reagiert auf den Schalter „Bewegung“ (nk:motion). */
(() => {
  const { $, $$, motionOn } = window.NK || {};
  if (!$$) return;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };

  /* ---------- Headlines Zeichen für Zeichen ---------- */
  /* ---------- Text-Reveal für die ganze Seite: Wörter leuchten beim Scrollen nacheinander auf ----------
     Gilt für Headlines, Einleitungen und Fließtexte. Text bleibt als normaler Text lesbar (keine aria-Ersetzung);
     bei ausgeschalteter Bewegung ist alles sofort sichtbar. */
  const REVEAL = '[data-chars],[data-lit],.side,.s,.igt,.tm-f,.fp b,.k + p,.cd .tx,.pn p,.faq p,.vq figcaption,.rate';
  const wordify = el => {
    if (el.dataset.wf) return null; el.dataset.wf = '1';
    const keep = /E-Commerce|Unternehmensentwicklung|Möwen/;
    const walk = node => { [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) { const parts = n.textContent.split(/(\s+)/); const frag = document.createDocumentFragment();
        parts.forEach(t => { if (!t) return; if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
          const s = document.createElement('span'); s.className = 'lw' + (keep.test(t) && el.hasAttribute('data-lit') ? ' hl' : ''); s.textContent = t; frag.appendChild(s); });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !/^(svg|img|BR|script|style)$/i.test(n.tagName) && !n.classList.contains('lw')) walk(n); }); };
    walk(el); el.removeAttribute('data-reveal'); el.classList.add('in', 'wr2');
    return $$('.lw', el);
  };
  const revealEls = [];
  $$(REVEAL).forEach(el => { if (el.closest('[hidden],.vq,.pn[hidden]') && !el.closest('.vq')) return; const ws = wordify(el); if (ws && ws.length) revealEls.push({ el, ws }); });
  const heroDone = el => el.getBoundingClientRect().top < innerHeight * .75;
  revealEls.forEach(r => { r.hero = r.el.closest('.hero') !== null; });
  let rt = false;
  const revealUpdate = () => { rt = false; const on = motionOn();
    revealEls.forEach(r => { const b = r.el.getBoundingClientRect(); if (b.bottom < -50 || b.top > innerHeight + 50) { if (b.top > innerHeight + 50) r.ws.forEach(w => w.classList.toggle('on', !on)); else r.ws.forEach(w => w.classList.add('on')); return; }
      const p = r.hero ? 1 : clamp((innerHeight * .9 - b.top) / (b.height + innerHeight * .3), 0, 1);
      r.ws.forEach((w, i) => w.classList.toggle('on', !on || i / r.ws.length < p * 1.04)); }); };
  addEventListener('scroll', () => { if (!rt) { rt = true; requestAnimationFrame(revealUpdate); } }, { passive: true });
  addEventListener('nk:motion', revealUpdate); addEventListener('resize', revealUpdate); revealUpdate();

  /* ---------- Lesefortschritt, Laufband, Hero-Glühen beim Scrollen ---------- */
  const prog = $('.prog'), mqs = $$('[data-mq]'), glow = $('.hero .glow'), gk = $('.gk');
  let st = false;
  const onScroll = () => { st = false;
    const h = document.documentElement.scrollHeight - innerHeight; prog && prog.style.setProperty('--sp', h > 0 ? (scrollY / h).toFixed(4) : 0);
    mqs.forEach(m => { const d = +m.dataset.mq, off = motionOn() ? scrollY * .35 * d : 0; m.style.transform = `translate3d(${(-25 + (d > 0 ? 0 : 0) + (d > 0 ? -off * 0 : 0)).toFixed(0)}%,0,0) translate3d(${off.toFixed(1)}px,0,0)`; });
    if (gk) { const r = gk.parentElement.getBoundingClientRect(), p = clamp(1 - r.top / innerHeight, 0, 1.2); gk.style.transform = motionOn() ? `translate3d(0,${((1 - Math.min(p, 1)) * 40).toFixed(1)}px,0)` : ''; } };
  addEventListener('scroll', () => { if (!st) { st = true; requestAnimationFrame(onScroll); } }, { passive: true }); addEventListener('nk:motion', onScroll); onScroll();

  /* ---------- Magnetische Knöpfe ---------- */
  if (fine) $$('[data-mag]').forEach(b => {
    b.addEventListener('pointermove', e => { if (!motionOn()) return; const r = b.getBoundingClientRect(); b.style.transform = `translate3d(${(((e.clientX - r.left) / r.width - .5) * 12).toFixed(1)}px,${(((e.clientY - r.top) / r.height - .5) * 8).toFixed(1)}px,0)`; });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });

  /* ---------- Möwe: ruhig wie ein Sitzvogel. Nur der Vogel bewegt sich (Hintergrund und Boden stehen still):
     Blick folgt dem Zeiger, im Leerlauf selten blinzeln, umschauen, picken, Gefieder schütteln, kleiner Hüpfer ---------- */
  const gull = $('[data-gull]');
  if (gull) {
    const head = $('.gh', gull), body = $('.gb', gull), lid = $('.lid', gull);
    let last = performance.now(), cur = { r: 0, x: 0, y: 0 }, tgt = { r: 0, x: 0, y: 0 }, raf = 0, busy = false, lastAct = -1;
    const eye = () => { const r = gull.getBoundingClientRect(); return { x: r.left + r.width * .52, y: r.top + r.height * .17 }; };
    const loop = () => { cur.r += (tgt.r - cur.r) * .08; cur.x += (tgt.x - cur.x) * .08; cur.y += (tgt.y - cur.y) * .08;
      head.style.transform = `rotate(${cur.r.toFixed(2)}deg)`;
      raf = (Math.abs(tgt.r - cur.r) + Math.abs(tgt.x - cur.x) + Math.abs(tgt.y - cur.y) > .02) ? requestAnimationFrame(loop) : 0; };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    addEventListener('pointermove', e => { if (!motionOn()) return; last = performance.now();
      const c = eye(), dx = clamp((e.clientX - c.x) / Math.max(260, gull.offsetWidth * .9), -1, 1), dy = clamp((c.y - e.clientY) / Math.max(260, gull.offsetHeight * .5), -1, 1);
      tgt.r = dy * 9 - dx * 4; tgt.x = 0; tgt.y = 0; kick(); }, { passive: true });
    const blink = () => lid && lid.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)', offset: .4 }, { transform: 'scaleY(0)' }], { duration: 260, easing: 'ease-in-out' });
    const both = (kf, o) => { body.animate(kf.body || kf, o); return head.animate(kf.head || kf, o); };

    /* Flügel flattern (Klick auf die Möwe oder im Leerlauf), Blinzeln und Schweif bleiben fein */
    const wing = $('.gw', gull);
    const flap = () => wing && wing.animate([{ rotate: '0deg' }, { rotate: '-14deg', offset: .12 }, { rotate: '3deg', offset: .24 }, { rotate: '-12deg', offset: .38 }, { rotate: '2deg', offset: .52 }, { rotate: '-8deg', offset: .68 }, { rotate: '0deg' }], { duration: 1100, easing: 'ease-in-out' });
    const hop = () => { gull.animate([{ translate: '0 0' }, { translate: '0 -16px', offset: .35 }, { translate: '0 0', offset: .7 }, { translate: '0 -3px', offset: .85 }, { translate: '0 0' }], { duration: 900, easing: 'cubic-bezier(.45,0,.2,1)' }); return flap(); };
    gull.style.pointerEvents = 'auto'; gull.style.cursor = 'pointer'; gull.addEventListener('click', () => { if (motionOn() && !busy) { busy = true; hop().finished.then(() => { busy = false; }, () => { busy = false; }); } });
    const ease = 'cubic-bezier(.45,0,.2,1)';
    const acts = [
      () => { blink(); return head.animate([{ rotate: '0deg' }, { rotate: '0deg' }], { duration: 300 }); },
      () => head.animate([{ rotate: '0deg', translate: '0 0' }, { rotate: '-6deg', translate: '-4px 2px', offset: .3 }, { rotate: '7deg', translate: '5px -3px', offset: .68 }, { rotate: '0deg', translate: '0 0' }], { duration: 3600, easing: ease }),
      () => head.animate([{ rotate: '0deg', translate: '0 0' }, { rotate: '-13deg', translate: '-6px 10px', offset: .18 }, { rotate: '1deg', translate: '0 0', offset: .34 }, { rotate: '-13deg', translate: '-6px 10px', offset: .52 }, { rotate: '0deg', translate: '0 0' }], { duration: 1700, easing: ease }),
      () => { body.animate([{ rotate: '0deg' }, { rotate: '1.4deg' }, { rotate: '-1.4deg' }, { rotate: '1.1deg' }, { rotate: '-1.1deg' }, { rotate: '0deg' }], { duration: 650, iterations: 2 }); return head.animate([{ rotate: '0deg' }, { rotate: '4deg' }, { rotate: '-4deg' }, { rotate: '3deg' }, { rotate: '-3deg' }, { rotate: '0deg' }], { duration: 650, iterations: 2 }); },
      () => hop(),
    ];
    setInterval(() => {
      if (busy || !motionOn() || document.hidden || performance.now() - last < 3000) return;
      const r = gull.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      let i; do { i = Math.random() < .4 ? 0 : 1 + Math.floor(Math.random() * (acts.length - 1)); } while (i === lastAct && acts.length > 1); lastAct = i;
      busy = true; tgt.r = 0; tgt.x = 0; tgt.y = 0; kick();
      const a = acts[i](); (a.finished || Promise.resolve()).then(() => { busy = false; }, () => { busy = false; });
    }, 3600);
    /* gelegentliches Blinzeln, auch wenn der Zeiger sich bewegt */
    setInterval(() => { if (motionOn() && !document.hidden && Math.random() < .5) blink(); }, 5200);
  }

  /* ---------- Disziplinen: Riesenzeilen ---------- */
  const items = $$('.acc>li');
  items.forEach(li => $('button', li).addEventListener('click', () => {
    const open = li.classList.contains('open');
    items.forEach(x => { x.classList.remove('open'); $('button', x).setAttribute('aria-expanded', 'false'); $('.pn', x).hidden = true; });
    if (!open) { li.classList.add('open'); $('button', li).setAttribute('aria-expanded', 'true'); $('.pn', li).hidden = false; }
  }));

  /* ---------- Lage-Karten drehen ---------- */
  $$('.cd').forEach(c => { const f = $('.fcard', c); if (!f) return;
    const flip = () => { const on = c.classList.toggle('on'); f.setAttribute('aria-pressed', String(on)); };
    f.addEventListener('click', e => { if (e.target.closest('a')) return; flip(); });
    f.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } }); });

  /* ---------- Projekte: Tabs ---------- */
  $$('[data-tab]').forEach(t => t.addEventListener('click', () => {
    $$('[data-tab]').forEach(x => x.setAttribute('aria-selected', String(x === t)));
    $$('[data-gal]').forEach(g => { g.hidden = g.dataset.gal !== t.dataset.tab; });
    const w = $('[data-wall]'); if (t.dataset.tab === 'wall' && w) { w.classList.remove('in'); void w.offsetWidth; w.classList.add('in'); }
    if (t.dataset.tab === 'cf') window.dispatchEvent(new Event('resize'));
  }));

  /* Coverflow */
  const cf = $('[data-cf]');
  if (cf) {
    const cards = $$('.cf-c', cf), N = cards.length, meta = JSON.parse($('[data-meta]', cf).textContent);
    const info = $('.cf-i', cf), el = { t: $('[data-t]', cf), d: $('[data-d]', cf), b: $('[data-b]', cf), l: $('[data-l]', cf), c: $('[data-cur]', cf) };
    let pos = 0, target = 0, raf = 0, shown = -1, drag = null, moved = false, auto = 0;
    const mob = () => innerWidth < 860;
    const render = () => {
      const cw = cards[0].offsetWidth, step = cw * (mob() ? .42 : .5), anim = motionOn();
      cards.forEach((c, i) => {
        const d = i - pos, a = Math.abs(d), s = clamp(d, -1, 1);
        const x = anim ? s * Math.min(a, 1) * step + (a > 1 ? Math.sign(d) * (a - 1) * step * .55 : 0) : d * step;
        const z = anim ? -Math.min(a, 3) * 150 : 0, ry = anim ? -s * Math.min(a, 1) * 48 : 0, sc = anim ? 1 - Math.min(a, 1) * .12 : 1;
        c.style.transform = `translate3d(${x.toFixed(1)}px,0,${z.toFixed(1)}px) rotateY(${ry.toFixed(1)}deg) scale(${sc.toFixed(3)})`;
        c.style.opacity = clamp(1.15 - Math.max(0, a - 1.6) * .6, 0, 1).toFixed(2); c.style.zIndex = String(100 - Math.round(a * 10));
        c.style.setProperty('--dim', clamp(a * .6, 0, .78).toFixed(2)); c.style.setProperty('--glow', clamp(1 - a * 1.6, 0, 1).toFixed(2)); c.style.pointerEvents = a > 2.6 ? 'none' : '';
      });
      cf.style.setProperty('--p', (pos / (N - 1)).toFixed(3));
      const idx = clamp(Math.round(pos), 0, N - 1);
      cards.forEach((c, i) => { const on = i === idx; c.classList.toggle('act', on); $('a', c).tabIndex = on ? 0 : -1; });
      if (idx !== shown) { shown = idx; info.classList.add('sw');
        setTimeout(() => { el.t.textContent = meta[idx].t; el.d.textContent = meta[idx].d; el.b.textContent = meta[idx].b; el.l.href = meta[idx].h; el.c.textContent = String(idx + 1).padStart(2, '0'); info.classList.remove('sw'); }, shown < 0 ? 0 : 160); }
    };
    const loop = () => { pos += (target - pos) * .12; if (Math.abs(target - pos) < .002) pos = target; render(); raf = pos === target ? 0 : requestAnimationFrame(loop); };
    const go = n => { target = clamp(Math.round(n), 0, N - 1); if (!raf) raf = requestAnimationFrame(loop); };
    const stop = () => { clearInterval(auto); auto = 0; };
    $('[data-prev]', cf).addEventListener('click', () => { stop(); go(Math.round(target) - 1); });
    $('[data-next]', cf).addEventListener('click', () => { stop(); go(Math.round(target) + 1); });
    cf.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { stop(); go(Math.round(target) + 1); } if (e.key === 'ArrowLeft') { stop(); go(Math.round(target) - 1); } });
    cf.tabIndex = 0;
    cf.addEventListener('pointerdown', e => { drag = { x: e.clientX, p: target }; moved = false; stop(); });
    addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 6) moved = true; if (moved) { target = clamp(drag.p - dx / (cards[0].offsetWidth * .5), 0, N - 1); pos = target; render(); } });
    addEventListener('pointerup', () => { if (!drag) return; drag = null; if (moved) go(target); });
    cf.addEventListener('click', e => { const c = e.target.closest('.cf-c'); if (!c) return; const i = +c.dataset.i;
      if (moved) { e.preventDefault(); return; } if (i !== Math.round(target)) { e.preventDefault(); stop(); go(i); } }, true);
    cf.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 20) { e.preventDefault(); stop(); go(Math.round(target) + Math.sign(e.deltaX)); } }, { passive: false });
    new IntersectionObserver(es => { stop(); if (es[0].isIntersecting && motionOn()) auto = setInterval(() => go(Math.round(target) >= N - 1 ? 0 : Math.round(target) + 1), 4200); }, { threshold: .5 }).observe(cf);
    addEventListener('resize', render); addEventListener('nk:motion', render); render();
  }

  /* Wand */
  const wall = $('[data-wall]');
  if (wall) {
    const inn = $('.wall-in', wall), tiles = $$('.wt', wall);
    let x = 0, y = 0, tx = 0, ty = 0, d = null, moved = false, raf = 0;
    const lim = () => ({ minx: Math.min(0, wall.clientWidth - inn.offsetWidth), miny: Math.min(0, wall.clientHeight - inn.offsetHeight) });
    const draw = () => { x += (tx - x) * .14; y += (ty - y) * .14; if (Math.abs(tx - x) < .3 && Math.abs(ty - y) < .3) { x = tx; y = ty; }
      inn.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      tiles.forEach(t => { const p = motionOn() ? (+t.dataset.z - 1) * .35 : 0; t.style.transform = `translate3d(${(-x * p).toFixed(1)}px,${(-y * p).toFixed(1)}px,0)`; });
      raf = x === tx && y === ty ? 0 : requestAnimationFrame(draw); };
    const set = (a, b) => { const L = lim(); tx = clamp(a, L.minx, 0); ty = clamp(b, L.miny, 0); if (!raf) raf = requestAnimationFrame(draw); };
    wall.addEventListener('pointerdown', e => { d = { px: e.clientX, py: e.clientY, x: tx, y: ty }; moved = false; });
    addEventListener('pointermove', e => { if (!d) return; const dx = e.clientX - d.px, dy = e.clientY - d.py; if (Math.hypot(dx, dy) > 6) { moved = true; wall.classList.add('dr'); } if (moved) set(d.x + dx, d.y + dy); });
    addEventListener('pointerup', () => { d = null; wall.classList.remove('dr'); });
    wall.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; } }, true);
    wall.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); set(tx - e.deltaX, ty); } }, { passive: false });
    wall.addEventListener('keydown', e => { const s = 160; if (e.key === 'ArrowRight') set(tx - s, ty); if (e.key === 'ArrowLeft') set(tx + s, ty); if (e.key === 'ArrowDown') set(tx, ty - s); if (e.key === 'ArrowUp') set(tx, ty + s); });
    wall.tabIndex = 0; addEventListener('nk:motion', () => { raf = raf || requestAnimationFrame(draw); });
  }

  /* Index: Vorschau im Bildformat, Pfeil-Knopf direkt am Zeiger */
  const pv = $('.pv'), pc = $('.pc'), idx = $('[data-idx]');
  if (pv && pc && idx && fine) {
    const img = $('img', pv); let x = 0, y = 0, cx = 0, cy = 0, raf = 0, shown = false;
    const loop = () => { cx += (x - cx) * .16; cy += (y - cy) * .16; const sk = clamp((x - cx) * .08, -8, 8);
      pv.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0) scale(${shown ? 1 : .86}) rotate(${(shown ? sk : -3).toFixed(2)}deg)`;
      raf = (Math.abs(x - cx) + Math.abs(y - cy) > .4 || shown !== pv.classList.contains('on')) ? requestAnimationFrame(loop) : 0; };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    const place = e => { const w = pv.offsetWidth, h = pv.offsetHeight; x = Math.min(innerWidth - w - 16, Math.max(16, e.clientX + 60)); y = Math.min(innerHeight - h - 16, Math.max(16, e.clientY - h * .55)); pc.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`; };
    const hide = () => { shown = false; pv.classList.remove('on'); pc.classList.remove('on'); kick(); };
    $$('a', idx).forEach(a => {
      a.addEventListener('pointerenter', e => { if (!motionOn()) return; img.src = a.dataset.src; shown = true; pv.classList.add('on'); pc.classList.add('on'); place(e); if (!pv.dataset.init) { cx = x; cy = y; pv.dataset.init = 1; } kick(); });
      a.addEventListener('pointermove', e => { if (shown) { place(e); kick(); } }); a.addEventListener('pointerleave', hide);
    });
    addEventListener('scroll', () => { if (shown) hide(); }, { passive: true });
  }

  /* Stapel */
  const deck = $('[data-deck]');
  if (deck) {
    const cs = $$('.dk-c', deck), N = cs.length, meta = JSON.parse($('[data-dmeta]', deck).textContent), s = $('.dk-s', deck);
    const tt = $('[data-dt]', deck), dd = $('[data-dd]', deck), dn = $('[data-dn]', deck);
    let top = 0, drag = null, moved = false, busy = false;
    const place = (c, p, anim) => { const a = motionOn();
      c.style.transition = anim ? '' : 'none'; c.style.zIndex = String(N - p);
      c.style.transform = p > 4 ? `translate3d(${a ? 56 : 0}px,${a ? -40 : 0}px,0) scale(.8)` : `translate3d(${a ? p * 16 : 0}px,${a ? -p * 12 : 0}px,0) rotate(${a ? (p % 2 ? 1 : -1) * p * 1.5 : 0}deg) scale(${a ? 1 - p * .04 : 1})`;
      c.style.opacity = p > 3 ? 0 : 1; c.classList.toggle('top', p === 0); c.style.pointerEvents = p === 0 ? '' : 'none'; };
    const render = anim => { cs.forEach((c, i) => place(c, (i - top + N) % N, anim)); const m = meta[top]; tt.textContent = m.t; dd.textContent = m.d; dn.textContent = `${String(top + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`; };
    const next = dir => { if (busy) return; busy = true; const c = cs[top], a = motionOn();
      if (dir > 0) { c.style.transition = 'transform .45s cubic-bezier(.2,.8,.2,1),opacity .4s'; c.style.transform = `translate3d(${a ? 130 : 0}%,-6%,0) rotate(${a ? 16 : 0}deg)`; c.style.opacity = a ? 0 : 1;
        setTimeout(() => { top = (top + 1) % N; render(false); void s.offsetWidth; cs.forEach(x => { x.style.transition = ''; }); busy = false; }, a ? 430 : 0); }
      else { top = (top - 1 + N) % N; render(true); busy = false; } };
    $('[data-dx]', deck).addEventListener('click', () => next(1)); $('[data-dp]', deck).addEventListener('click', () => next(-1));
    deck.addEventListener('keydown', e => { if (e.key === 'ArrowRight') next(1); if (e.key === 'ArrowLeft') next(-1); }); deck.tabIndex = 0;
    s.addEventListener('pointerdown', e => { drag = { x: e.clientX }; moved = false; });
    addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 6) moved = true; if (moved && !busy) { const c = cs[top]; c.style.transition = 'none'; c.style.transform = `translate3d(${dx}px,0,0) rotate(${(dx / 22).toFixed(1)}deg)`; } });
    addEventListener('pointerup', e => { if (!drag) return; const dx = e.clientX - drag.x; drag = null; if (moved) { if (Math.abs(dx) > 90) next(dx > 0 ? 1 : 1); else render(true); } });
    s.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; } }, true);
    addEventListener('nk:motion', () => render(false)); render(false);
  }

  /* ---------- Stimmen ---------- */
  const v = $('[data-voices]');
  if (v) {
    const qs = $$('.vq', v), bs = $$('.vn button', v), N = qs.length, DUR = 6500; let cur = 0, t = 0;
    const show = i => { cur = (i + N) % N; qs.forEach((q, j) => q.classList.toggle('on', j === cur));
      bs.forEach((b, j) => { b.setAttribute('aria-selected', String(j === cur)); b.style.setProperty('--dur', DUR + 'ms'); const bar = $('i', b); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }); };
    const run = () => { clearInterval(t); t = 0; if (motionOn()) t = setInterval(() => show(cur + 1), DUR); };
    bs.forEach((b, j) => b.addEventListener('click', () => { show(j); run(); }));
    new IntersectionObserver(es => { if (es[0].isIntersecting) run(); else { clearInterval(t); t = 0; } }, { threshold: .4 }).observe(v);
    addEventListener('nk:motion', run); show(0);
  }

  /* ---------- Lichtpunkt (Option „Licht“) ---------- */
  const spots = $$('.spot'), spot = spots[0], lt = $('.lt[data-light]');
  if (spot && lt) {
    let sx = innerWidth / 2, sy = innerHeight / 2, cx = sx, cy = sy, raf = 0;
    const draw = () => { cx += (sx - cx) * (motionOn() ? .12 : 1); cy += (sy - cy) * (motionOn() ? .12 : 1);
      spots.forEach(sp => { sp.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`; }); raf = (Math.abs(sx - cx) + Math.abs(sy - cy) > .5) ? requestAnimationFrame(draw) : 0; };
    const move = e => { sx = e.clientX; sy = e.clientY; if (!raf) raf = requestAnimationFrame(draw); };
    const set = (on, persist) => { document.documentElement.dataset.light = on ? 'on' : 'off'; lt.setAttribute('aria-pressed', String(on)); if (persist) store.set('nk:light', on ? 'on' : 'off');
      if (on) { addEventListener('pointermove', move, { passive: true }); addEventListener('pointerdown', move, { passive: true }); raf = requestAnimationFrame(draw); } else { removeEventListener('pointermove', move); removeEventListener('pointerdown', move); } };
    lt.addEventListener('click', () => set(document.documentElement.dataset.light !== 'on', true));
    set(store.get('nk:light') === 'on', false);
  }

  const tm = $('[data-team]');
  if (tm) {
    const ps = $$('.tp', tm), bs = $$('.tm-l button', tm);
    const show = i => { ps.forEach((p, j) => p.classList.toggle('on', j === i)); bs.forEach((b, j) => b.setAttribute('aria-selected', String(j === i))); };
    bs.forEach((b, i) => { b.addEventListener('click', () => show(i)); b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') show(i); }); });
  }
  const tc = $('[data-tcar]');
  if (tc) {
    const ls = $$('.tsl', tc), bt = $$('.tsr button', tc);
    const go = (i, f) => { ls.forEach((l, j) => l.classList.toggle('on', j === i)); bt.forEach((b, j) => b.setAttribute('aria-selected', String(j === i))); if (f) bt[i].focus(); bt[i].scrollIntoView({ block: 'nearest', inline: 'center', behavior: motionOn() ? 'smooth' : 'auto' }); };
    bt.forEach((b, i) => { b.addEventListener('click', () => go(i)); b.addEventListener('keydown', e => { const k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (k) { e.preventDefault(); go((i + k + bt.length) % bt.length, true); } }); });
  }
  const clk = $('[data-clock]');
  if (clk) { const t = () => { clk.textContent = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' }).format(new Date()); }; t(); setInterval(t, 20000); }
})();

/* Case-Kacheln: auf Touch-Geräten läuft die Hover-Bewegung, solange die Kachel mittig im Bild ist */
(() => {
  const ks = document.querySelectorAll('[data-kc]');
  if (!ks.length || !matchMedia('(hover:none)').matches) return;
  const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('hot', e.isIntersecting)), { rootMargin: '-35% 0px -35% 0px' });
  ks.forEach(k => io.observe(k));
})();
