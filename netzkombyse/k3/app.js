/* Konzept 3 · Werkbank – Systemgraph, Spotlight, Tabs, horizontales Pin, Command-Palette, Vorher/Nachher */
(() => {
  const { $, $$, motionOn } = window.NK || {};
  if (!$) return;
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- Systemgraph ---------- */
  const g = $('[data-graph]');
  if (g) {
    const svg = $('.g-svg', g), nodes = $$('.gn', g), st = $('[data-gst]', g), base = st.textContent;
    let lines = [];
    const build = () => {
      const r = g.getBoundingClientRect(); if (!r.width) return;
      svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`); svg.innerHTML = ''; lines = [];
      const cx = r.width / 2, cy = r.height / 2;
      nodes.forEach((n, i) => {
        const nx = parseFloat(n.style.left) / 100 * r.width, ny = parseFloat(n.style.top) / 100 * r.height;
        const l = document.createElementNS(NS, 'line'); l.setAttribute('x1', cx); l.setAttribute('y1', cy); l.setAttribute('x2', nx); l.setAttribute('y2', ny); svg.appendChild(l); lines.push(l);
        const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', 3);
        const a = document.createElementNS(NS, 'animateMotion'); a.setAttribute('dur', (3 + (i % 4) * .7) + 's'); a.setAttribute('repeatCount', 'indefinite'); a.setAttribute('begin', (-i * .6) + 's');
        a.setAttribute('path', i % 2 ? `M${nx},${ny} L${cx},${cy}` : `M${cx},${cy} L${nx},${ny}`); c.appendChild(a); svg.appendChild(c);
      });
      sync();
    };
    const sync = () => { try { motionOn() ? svg.unpauseAnimations() : svg.pauseAnimations(); } catch {} };
    const act = (i, on) => { lines[i]?.classList.toggle('on', on); nodes[i].classList.toggle('on', on); st.textContent = on ? nodes[i].dataset.info : base; };
    nodes.forEach((n, i) => { ['pointerenter', 'focus'].forEach(e => n.addEventListener(e, () => act(i, true))); ['pointerleave', 'blur'].forEach(e => n.addEventListener(e, () => act(i, false)));
      n.addEventListener('click', () => act(i, true)); });
    new ResizeObserver(build).observe(g); build();
    window.addEventListener('nk:motion', sync);
    /* sanfte Zeiger-Parallaxe */
    let raf = 0, px = 0, py = 0;
    const move = () => { raf = 0; nodes.forEach((n, i) => { const d = 4 + (i % 3) * 3; n.style.transform = motionOn() ? `translate3d(${px * d}px,${py * d}px,0)` : ''; }); };
    g.addEventListener('pointermove', e => { const r = g.getBoundingClientRect(); px = (e.clientX - r.left) / r.width - .5; py = (e.clientY - r.top) / r.height - .5; if (!raf) raf = requestAnimationFrame(move); });
    g.addEventListener('pointerleave', () => { px = py = 0; if (!raf) raf = requestAnimationFrame(move); });
  }

  /* ---------- Spotlight auf Kacheln ---------- */
  addEventListener('pointermove', e => {
    const t = e.target.closest?.('[data-spot]'); if (!t) return;
    const r = t.getBoundingClientRect(); t.style.setProperty('--mx', (e.clientX - r.left) + 'px'); t.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  /* ---------- Tabs ---------- */
  const tabs = $$('[role=tab]');
  if (tabs.length) {
    const sel = i => tabs.forEach((t, k) => { const on = k === i; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; $('#' + t.getAttribute('aria-controls')).hidden = !on; });
    tabs.forEach((t, i) => { t.addEventListener('click', () => sel(i));
      t.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length; sel(n); tabs[n].focus(); } }); });
  }

  /* ---------- Horizontales Pin (Referenzen) ---------- */
  const pin = $('.pin');
  if (pin) {
    const track = $('[data-track]', pin), cur = $('[data-pin-cur]', pin), cards = $$('.dc', pin);
    let tick = false, max = 0;
    const mode = () => {
      const on = motionOn() && innerWidth > 800;
      pin.classList.toggle('pinned', on);
      requestAnimationFrame(() => { max = Math.max(0, track.scrollWidth - innerWidth); upd(); });
    };
    const upd = () => { tick = false;
      if (!pin.classList.contains('pinned')) { pin.style.removeProperty('--tx'); return; }
      const r = pin.getBoundingClientRect(), total = r.height - innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / total));
      pin.style.setProperty('--tx', (-p * max).toFixed(1) + 'px'); pin.style.setProperty('--pp', p.toFixed(3));
      cur.textContent = String(Math.min(cards.length, Math.round(p * (cards.length - 1)) + 1)).padStart(2, '0'); };
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener('resize', mode); window.addEventListener('nk:motion', mode); mode();
    addEventListener('load', mode);
  }

  /* ---------- Command-Palette ---------- */
  const menu = $('#menu');
  if (menu) {
    const input = $('[data-filter]', menu), items = $$('[data-it]', menu), groups = $$('.pal-g', menu), empty = $('.pal-e', menu);
    let idx = 0;
    const vis = () => items.filter(a => !a.hidden);
    const mark = () => { const v = vis(); items.forEach(a => a.classList.remove('sel')); if (v[idx]) { v[idx].classList.add('sel'); v[idx].scrollIntoView({ block: 'nearest' }); } };
    const filter = () => {
      const q = input.value.trim().toLowerCase();
      items.forEach(a => { a.hidden = q && !a.textContent.toLowerCase().includes(q); });
      groups.forEach(gp => { let n = gp.nextElementSibling, any = false; while (n && n.matches('[data-it]')) { if (!n.hidden) any = true; n = n.nextElementSibling; } gp.hidden = !any; });
      empty.hidden = vis().length > 0; idx = 0; mark();
    };
    input.addEventListener('input', filter);
    items.forEach(a => a.addEventListener('pointermove', () => { const v = vis(); const k = v.indexOf(a); if (k !== idx) { idx = k; mark(); } }));
    menu.addEventListener('keydown', e => {
      const v = vis(); if (!v.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); idx = (idx + 1) % v.length; mark(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); idx = (idx - 1 + v.length) % v.length; mark(); }
      if (e.key === 'Enter' && document.activeElement === input) { e.preventDefault(); v[idx]?.click(); }
    });
    new MutationObserver(() => { if (document.documentElement.classList.contains('menu-open')) { input.value = ''; filter(); } }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    mark();
    addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('[data-menu-open]')?.click(); } });
  }

  /* ---------- Vorher / Nachher ---------- */
  const ba = $('[data-ba]');
  if (ba) $$('[data-ba-set]', ba).forEach(b => b.addEventListener('click', () => {
    ba.dataset.ba = b.dataset.baSet; $$('[data-ba-set]', ba).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
})();
