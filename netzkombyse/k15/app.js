/* Konzept 15 · Glut – Akkordeon der Leistungen und 3D-Coverflow der Projekte */
(() => {
  const { $, $$, motionOn } = window.NK || {};
  if (!$$) return;
  const items = $$('.acc>li');
  items.forEach(li => $$('button', li).forEach(b => b.addEventListener('click', () => {
    const open = li.classList.contains('open');
    items.forEach(x => { x.classList.remove('open'); $$('button', x)[0].setAttribute('aria-expanded', 'false'); $$('.pn', x)[0].hidden = true; });
    if (!open) { li.classList.add('open'); b.setAttribute('aria-expanded', 'true'); $$('.pn', li)[0].hidden = false; }
  })));

  /* Lage-Karten drehen sich beim Antippen und zeigen mehr Inhalt */
  $$('.cd').forEach(c => { const b = $('.flip', c); if (!b) return;
    b.addEventListener('click', () => { const on = c.classList.toggle('on'); b.setAttribute('aria-pressed', String(on)); }); });

  const cf = $('[data-cf]'); if (!cf) return;
  const cards = $$('.cf-c', cf), N = cards.length, meta = JSON.parse($('[data-meta]', cf).textContent);
  const info = $('.cf-i', cf), el = { t: $('[data-t]', cf), d: $('[data-d]', cf), b: $('[data-b]', cf), l: $('[data-l]', cf), c: $('[data-cur]', cf) };
  let pos = 0, target = 0, raf = 0, shown = -1, drag = null, moved = false, auto = 0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mob = () => innerWidth < 860;
  const render = () => {
    const cw = cards[0].offsetWidth, step = cw * (mob() ? .42 : .5), anim = motionOn();
    cards.forEach((c, i) => {
      const d = i - pos, a = Math.abs(d), s = clamp(d, -1, 1);
      const x = anim ? s * Math.min(a, 1) * step + (a > 1 ? Math.sign(d) * (a - 1) * step * .55 : 0) : d * step;
      const z = anim ? -Math.min(a, 3) * 150 : 0, ry = anim ? -s * Math.min(a, 1) * 48 : 0, sc = anim ? 1 - Math.min(a, 1) * .12 : 1;
      c.style.transform = `translate3d(${x.toFixed(1)}px,0,${z.toFixed(1)}px) rotateY(${ry.toFixed(1)}deg) scale(${sc.toFixed(3)})`;
      c.style.opacity = clamp(1.15 - Math.max(0, a - 1.6) * .6, 0, 1).toFixed(2);
      c.style.zIndex = String(100 - Math.round(a * 10));
      c.style.setProperty('--dim', clamp(a * .6, 0, .78).toFixed(2)); c.style.setProperty('--glow', clamp(1 - a * 1.6, 0, 1).toFixed(2));
      c.style.pointerEvents = a > 2.6 ? 'none' : '';
    });
    cf.style.setProperty('--p', (pos / (N - 1)).toFixed(3));
    const idx = clamp(Math.round(pos), 0, N - 1);
    cards.forEach((c, i) => { const on = i === idx; c.classList.toggle('act', on); $('a', c).tabIndex = on ? 0 : -1; });
    if (idx !== shown) { shown = idx; info.classList.add('sw');
      setTimeout(() => { el.t.textContent = meta[idx].t; el.d.textContent = meta[idx].d; el.b.textContent = meta[idx].b; el.l.href = meta[idx].h; el.c.textContent = String(idx + 1).padStart(2, '0'); info.classList.remove('sw'); }, shown < 0 ? 0 : 160); }
  };
  const loop = () => { pos += (target - pos) * .12; if (Math.abs(target - pos) < .002) pos = target; render(); raf = pos === target ? 0 : requestAnimationFrame(loop); };
  const go = n => { target = clamp(Math.round(n), 0, N - 1); if (!raf) raf = requestAnimationFrame(loop); };
  $('[data-prev]', cf).addEventListener('click', () => { stop(); go(Math.round(target) - 1); });
  $('[data-next]', cf).addEventListener('click', () => { stop(); go(Math.round(target) + 1); });
  cf.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { stop(); go(Math.round(target) + 1); } if (e.key === 'ArrowLeft') { stop(); go(Math.round(target) - 1); } });
  cf.tabIndex = 0;
  /* Ziehen und Wischen: Position folgt dem Finger, beim Loslassen rastet die nächste Karte ein */
  cf.addEventListener('pointerdown', e => { drag = { x: e.clientX, p: target }; moved = false; stop(); });
  addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 6) moved = true; if (moved) { target = clamp(drag.p - dx / (cards[0].offsetWidth * .5), 0, N - 1); pos = target; render(); } });
  addEventListener('pointerup', () => { if (!drag) return; drag = null; if (moved) go(target); });
  cf.addEventListener('click', e => { const c = e.target.closest('.cf-c'); if (!c) return; const i = +c.dataset.i;
    if (moved) { e.preventDefault(); return; } if (i !== Math.round(target)) { e.preventDefault(); stop(); go(i); } }, true);
  cf.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 20) { e.preventDefault(); stop(); go(Math.round(target) + Math.sign(e.deltaX)); } }, { passive: false });
  /* Automatisch weiterblättern, solange sichtbar und unberührt */
  const stop = () => { clearInterval(auto); auto = 0; };
  new IntersectionObserver(es => { stop(); if (es[0].isIntersecting && motionOn()) auto = setInterval(() => go(Math.round(target) >= N - 1 ? 0 : Math.round(target) + 1), 4200); }, { threshold: .5 }).observe(cf);
  addEventListener('resize', render); addEventListener('nk:motion', render); render();
})();

/* Tabs, Projektwand und Stimmen */
(() => {
  const { $, $$, motionOn } = window.NK || {}; if (!$$) return;
  $$('[data-tab]').forEach(t => t.addEventListener('click', () => {
    $$('[data-tab]').forEach(x => x.setAttribute('aria-selected', String(x === t)));
    $$('[data-gal]').forEach(g => { g.hidden = g.dataset.gal !== t.dataset.tab; });
    const w = $('[data-wall]'); if (t.dataset.tab === 'wall' && w) { w.classList.remove('in'); void w.offsetWidth; w.classList.add('in'); }
  }));
  const wall = $('[data-wall]');
  if (wall) {
    const inn = $('.wall-in', wall), tiles = $$('.wt', wall);
    let x = 0, y = 0, tx = 0, ty = 0, d = null, moved = false, raf = 0;
    const lim = () => ({ minx: Math.min(0, wall.clientWidth - inn.offsetWidth), miny: Math.min(0, wall.clientHeight - inn.offsetHeight) });
    const cl = (v, a, b) => Math.max(a, Math.min(b, v));
    const draw = () => { x += (tx - x) * .14; y += (ty - y) * .14; if (Math.abs(tx - x) < .3 && Math.abs(ty - y) < .3) { x = tx; y = ty; }
      inn.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      tiles.forEach(t => { const z = +t.dataset.z, p = motionOn() ? (z - 1) * 0.35 : 0; t.style.transform = `translate3d(${(-x * p).toFixed(1)}px,${(-y * p).toFixed(1)}px,0)`; });
      raf = x === tx && y === ty ? 0 : requestAnimationFrame(draw); };
    const set = (a, b) => { const L = lim(); tx = cl(a, L.minx, 0); ty = cl(b, L.miny, 0); if (!raf) raf = requestAnimationFrame(draw); };
    wall.addEventListener('pointerdown', e => { d = { px: e.clientX, py: e.clientY, x: tx, y: ty }; moved = false; });
    addEventListener('pointermove', e => { if (!d) return; const dx = e.clientX - d.px, dy = e.clientY - d.py; if (Math.hypot(dx, dy) > 6) { moved = true; wall.classList.add('dr'); } if (moved) set(d.x + dx, d.y + dy); });
    addEventListener('pointerup', () => { d = null; wall.classList.remove('dr'); });
    wall.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; } }, true);
    wall.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); set(tx - e.deltaX, ty); } }, { passive: false });
    wall.addEventListener('keydown', e => { const s = 160; if (e.key === 'ArrowRight') set(tx - s, ty); if (e.key === 'ArrowLeft') set(tx + s, ty); if (e.key === 'ArrowDown') set(tx, ty - s); if (e.key === 'ArrowUp') set(tx, ty + s); });
    wall.tabIndex = 0; addEventListener('nk:motion', () => { raf = raf || requestAnimationFrame(draw); });
  }
  const v = $('[data-voices]');
  if (v) {
    const ps = $$('.vp', v), qs = $$('.vq', v), bs = $$('.vs-n button', v), N = ps.length, DUR = 6500;
    let cur = 0, t = 0;
    const show = i => { cur = (i + N) % N;
      ps.forEach((p, j) => p.style.setProperty('--k', String((j - cur + N) % N)));
      qs.forEach((q, j) => q.classList.toggle('on', j === cur));
      bs.forEach((b, j) => { b.setAttribute('aria-selected', String(j === cur)); b.style.setProperty('--dur', DUR + 'ms'); const bar = $('i', b); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }); };
    const run = () => { clearInterval(t); t = 0; if (motionOn()) t = setInterval(() => show(cur + 1), DUR); };
    bs.forEach((b, j) => b.addEventListener('click', () => { show(j); run(); }));
    ps.forEach(p => p.addEventListener('click', () => { show(+p.dataset.i); run(); }));
    new IntersectionObserver(es => { if (es[0].isIntersecting) run(); else { clearInterval(t); t = 0; } }, { threshold: .4 }).observe(v);
    addEventListener('nk:motion', run); show(0);
  }
})();
