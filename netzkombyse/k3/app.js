/* Konzept 3 · Möwenschwarm – Physik-Buchstaben, Möwenjagd, Begleit-Möwe, Postkarten-Haufen, Sammelkarten */
(() => {
  const { $, $$, motionOn } = window.NK || {};
  if (!$) return;
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  const fine = matchMedia('(hover:hover) and (pointer:fine)');

  /* ---------- Physik-Spielplatz im Hero ---------- */
  const play = $('[data-play]');
  if (play) {
    const bodies = $$('.bd', play).map(el => ({ el, x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, w: 0, h: 0, r: 0 }));
    let W = 0, H = 0, floor = 0, raf = 0, last = 0, grab = null, asleep = false, visible = true, gotoff = null;
    const G = 2100, E = .42;
    const apply = b => { b.el.style.transform = `translate3d(${(b.x - b.w / 2).toFixed(1)}px,${(b.y - b.h / 2).toFixed(1)}px,0) rotate(${b.a.toFixed(1)}deg)`; };
    const measure = () => { const r = play.getBoundingClientRect(); W = r.width; H = r.height; floor = H - 10;
      bodies.forEach(b => { b.w = b.el.offsetWidth; b.h = b.el.offsetHeight; b.r = Math.min(b.w, b.h) * (b.el.dataset.b === 'l' ? .5 : .46); }); };
    const place = animate => {
      const ls = bodies.filter(b => b.el.dataset.b === 'l'), os = bodies.filter(b => b.el.dataset.b !== 'l');
      const gap = Math.max(6, W * .01), tot = ls.reduce((s, b) => s + b.w, 0) + gap * (ls.length - 1);
      let x = (W - tot) / 2;
      ls.forEach((b, i) => { b.x = x + b.w / 2; x += b.w + gap; b.vx = b.vy = b.va = 0; b.a = 0;
        b.y = animate ? -b.h - i * 110 - 40 : floor - b.h / 2 * .92; });
      os.forEach((b, j) => { const f = [.1, .3, .62, .88][j % 4]; b.x = animate ? b.r + Math.random() * (W - 2 * b.r) : W * f; b.vx = animate ? (Math.random() - .5) * 200 : 0; b.vy = 0; b.va = 0; b.a = animate ? Math.random() * 40 - 20 : 0;
        b.y = animate ? -b.h - 480 - j * 190 : floor - b.h / 2 * .92; });
      bodies.forEach(apply);
    };
    const step = dt => {
      let moving = false;
      bodies.forEach(b => {
        if (b === grab) { b.vx = Math.max(-2600, Math.min(2600, (grab.tx - b.x) * 18)); b.vy = Math.max(-2600, Math.min(2600, (grab.ty - b.y) * 18)); b.va = b.vx * .02; }
        else b.vy += G * dt;
        b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt;
        const hw = b.w / 2 * .8, hh = b.h / 2 * .92;
        if (b.x < hw) { b.x = hw; b.vx = Math.abs(b.vx) * E; } else if (b.x > W - hw) { b.x = W - hw; b.vx = -Math.abs(b.vx) * E; }
        if (b.y > floor - hh) { b.y = floor - hh; if (Math.abs(b.vy) > 70) { b.vy = -b.vy * E; b.va += (Math.random() - .5) * 120; } else b.vy = 0; b.vx *= .94 ** (dt * 60); }
        const onFloor = b.y >= floor - hh - .5;
        if (onFloor && b !== grab) { if (Math.abs(b.vx) > 12) b.va = b.vx / b.r * 40; else { const t = Math.round(b.a / 360) * 360; b.a += (t - b.a) * Math.min(1, dt * 8); b.va *= .8; } } else b.va *= .995;
        if (Math.abs(b.vx) > 8 || Math.abs(b.vy) > 8 || !onFloor || Math.abs(b.a - Math.round(b.a / 360) * 360) > .6) moving = true;
      });
      for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
        const p = bodies[i], q = bodies[j], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || .01, m = p.r + q.r;
        if (d < m) { const nx = dx / d, ny = dy / d, pen = (m - d) / 2;
          if (p !== grab) { p.x -= nx * pen; p.y -= ny * pen; } if (q !== grab) { q.x += nx * pen; q.y += ny * pen; }
          const rv = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny;
          if (rv < 0) { const jv = -(1 + E) * rv / 2; p.vx -= jv * nx; p.vy -= jv * ny; q.vx += jv * nx; q.vy += jv * ny; moving = true; } }
      }
      bodies.forEach(apply);
      return moving;
    };
    const loop = t => { const dt = Math.min(.033, (t - last) / 1000 || .016); last = t;
      const moving = step(dt);
      if (!moving && !grab) { asleep = true; raf = 0; return; }
      raf = requestAnimationFrame(loop); };
    const wake = () => { asleep = false; if (!raf && visible && motionOn()) { last = performance.now(); raf = requestAnimationFrame(loop); } };
    const start = () => { measure(); play.classList.add('ready'); const on = motionOn(); place(on); if (on) wake(); };
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) wake(); else if (raf) { cancelAnimationFrame(raf); raf = 0; } }).observe(play);
    bodies.forEach(b => {
      b.el.addEventListener('pointerdown', e => { if (!motionOn()) return; e.preventDefault(); b.el.setPointerCapture(e.pointerId); const r = play.getBoundingClientRect();
        grab = b; b.offx = e.clientX - r.left - b.x; b.offy = e.clientY - r.top - b.y; b.tx = b.x; b.ty = b.y; b.el.classList.add('grab'); play.classList.add('touched'); wake(); });
      b.el.addEventListener('pointermove', e => { if (grab !== b) return; const r = play.getBoundingClientRect(); b.tx = e.clientX - r.left - b.offx; b.ty = e.clientY - r.top - b.offy; });
      const up = () => { if (grab === b) { grab = null; b.el.classList.remove('grab'); wake(); } };
      b.el.addEventListener('pointerup', up); b.el.addEventListener('pointercancel', up);
    });
    let rt = 0;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { measure(); if (!motionOn()) place(false); else { bodies.forEach(b => { b.x = Math.min(Math.max(b.x, b.w / 2), W - b.w / 2); }); wake(); } }, 120); });
    window.addEventListener('nk:motion', () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } measure(); const on = motionOn(); place(on); if (on) wake(); });
    (document.fonts?.ready || Promise.resolve()).then(start);
  }

  /* ---------- Möwenjagd ---------- */
  const KEY = 'nk:gulls';
  let found = new Set(); try { found = new Set(JSON.parse(store.get(KEY) || '[]')); } catch {}
  const gcount = $('[data-gcount]'), gn = $('[data-gn]'), toast = $('.toast');
  const showToast = (t, ms = 3600) => { if (!toast) return; toast.textContent = t; toast.hidden = false; toast.style.animation = 'none'; void toast.offsetWidth; toast.style.animation = ''; clearTimeout(showToast.t); showToast.t = setTimeout(() => { toast.hidden = true; }, ms); };
  const sync = bump => { if (gn) gn.textContent = found.size; if (bump && gcount) { gcount.classList.remove('bump'); void gcount.offsetWidth; gcount.classList.add('bump'); } };
  const flock = n => { if (!motionOn()) return; for (let i = 0; i < n; i++) setTimeout(() => {
    const d = document.createElement('div'); d.className = 'fx'; d.style.top = (8 + Math.random() * 78) + 'vh'; d.style.setProperty('--dy', (Math.random() * 120 - 60) + 'px'); d.style.setProperty('--t', (1.8 + Math.random() * 1.8) + 's'); d.style.width = (32 + Math.random() * 40) + 'px';
    d.innerHTML = '<svg viewBox="0 0 64 28" aria-hidden="true"><path class="fl-a" d="M2 20Q16 -2 32 17Q48 -2 62 20" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    document.body.appendChild(d); d.addEventListener('animationend', () => d.remove()); }, i * 90); };
  const MSG = ['Eine Möwe weniger. Sie kommt wieder – versprochen.', 'Zwei! Die anderen beobachten Sie schon.', 'Drei! Langsam wird es ruhiger am Himmel.', 'Vier! Eine noch, dann ist Ruhe.'];
  $$('[data-gull]').forEach(p => {
    if (found.has(p.dataset.gull)) p.classList.add('was');
    p.addEventListener('click', () => { if (p.classList.contains('gone')) return; p.classList.add('gone'); found.add(p.dataset.gull); store.set(KEY, JSON.stringify([...found])); sync(true);
      if (found.size >= 5) { showToast('Alle fünf Möwen gescheucht! Dafür gibt Henning gern einen Kaffee aus: Termin buchen und Moin sagen.', 7000); flock(18); }
      else showToast(MSG[found.size - 1] || 'Möwe gescheucht!'); });
  });
  sync(false);

  /* ---------- Begleit-Möwe am Cursor ---------- */
  const mg = $('.mgull');
  if (mg && fine.matches) {
    const img = $('.mgi', mg), say = $('.say', mg);
    let mx = 0, my = 0, gx = 0, gy = 0, dir = 1, raf = 0, talkT = 0;
    const loop = () => { const dx = mx - gx, dy = my - gy; gx += dx * .13; gy += dy * .13;
      if (Math.abs(dx) > 2) dir = dx > 0 ? 1 : -1;
      const tilt = Math.max(-24, Math.min(24, dy * .35 * dir));
      mg.style.transform = `translate3d(${(gx + 18).toFixed(1)}px,${(gy + 18).toFixed(1)}px,0)`; img.style.transform = `scaleX(${dir}) rotate(${tilt.toFixed(1)}deg)`;
      raf = (Math.abs(dx) + Math.abs(dy) > .6) ? requestAnimationFrame(loop) : 0; };
    addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' || !motionOn()) return; if (!mg.classList.contains('on')) { gx = mx = e.clientX; gy = my = e.clientY; mg.classList.add('on'); }
      mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(loop); }, { passive: true });
    document.addEventListener('mouseleave', () => mg.classList.remove('on'));
    const W2 = ['Kreisch!', 'Moin!', 'Fisch?', 'Hunger!', 'Möwe!', 'Hallo!'];
    addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || !motionOn()) return; say.textContent = W2[Math.floor(Math.random() * W2.length)]; mg.classList.add('talk'); clearTimeout(talkT); talkT = setTimeout(() => mg.classList.remove('talk'), 1000); });
  }

  /* ---------- Disziplinen-Panels ---------- */
  const pns = $$('.pn');
  if (pns.length) { const open = p => pns.forEach(x => x.classList.toggle('open', x === p)); pns.forEach(p => { p.addEventListener('mouseenter', () => open(p)); p.addEventListener('focus', () => open(p)); }); }

  /* ---------- Postkarten-Haufen: ziehen ---------- */
  const pile = $('[data-pile]');
  if (pile) {
    let z = 10;
    $$('[data-drag-card]', pile).forEach(c => {
      let down = false, sx = 0, sy = 0, ox = 0, oy = 0;
      c.addEventListener('pointerdown', e => { if (innerWidth < 800 || e.target.closest('a')) return; down = true; sx = e.clientX; sy = e.clientY; ox = parseFloat(c.style.getPropertyValue('--dx')) || 0; oy = parseFloat(c.style.getPropertyValue('--dy')) || 0;
        c.style.zIndex = ++z; c.classList.add('drag'); c.setPointerCapture(e.pointerId); });
      c.addEventListener('pointermove', e => { if (!down) return; const pr = pile.getBoundingClientRect(), cr = c.getBoundingClientRect();
        let nx = ox + e.clientX - sx, ny = oy + e.clientY - sy;
        const bx = cr.left - (parseFloat(c.style.getPropertyValue('--dx')) || 0), by = cr.top - (parseFloat(c.style.getPropertyValue('--dy')) || 0);
        nx = Math.min(pr.right - cr.width * .35 - bx - 0, Math.max(pr.left - cr.width * .65 - bx, nx)); ny = Math.min(pr.bottom - cr.height * .35 - by, Math.max(pr.top - cr.height * .65 - by, ny));
        c.style.setProperty('--dx', nx + 'px'); c.style.setProperty('--dy', ny + 'px'); });
      const up = () => { down = false; c.classList.remove('drag'); };
      c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    });
  }

  /* ---------- Sammelkarten: antippen / Enter ---------- */
  $$('[data-flip]').forEach(c => { c.addEventListener('click', e => { if (e.target.closest('a')) return; c.classList.toggle('flip'); });
    c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.classList.toggle('flip'); } }); });

  /* ---------- Möwenalarm beim großen Knopf ---------- */
  $$('[data-burst]').forEach(b => b.addEventListener('click', () => { flock(14); showToast('Möwenalarm! Henning freut sich auf Ihren Anruf.', 3000); }));

  /* ---------- Chaos → Ordnung ---------- */
  const ch = $('[data-chaos]');
  if (ch) $$('[data-ba-set]', ch).forEach(b => b.addEventListener('click', () => { ch.dataset.chaos = b.dataset.baSet; $$('[data-ba-set]', ch).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
})();
