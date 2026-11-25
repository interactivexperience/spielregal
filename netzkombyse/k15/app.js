/* Konzept 15 · Glut – Akkordeon der Leistungen und 3D-Coverflow der Projekte */
(() => {
  const { $, $$, motionOn } = window.NK || {};
  if (!$$) return;
  const items = $$('.acc li');
  items.forEach(li => $$('button', li).forEach(b => b.addEventListener('click', () => {
    const open = li.classList.contains('open');
    items.forEach(x => { x.classList.remove('open'); $$('button', x)[0].setAttribute('aria-expanded', 'false'); $$('.pn', x)[0].hidden = true; });
    if (!open) { li.classList.add('open'); b.setAttribute('aria-expanded', 'true'); $$('.pn', li)[0].hidden = false; }
  })));

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
