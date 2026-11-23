/* Gemeinsamer Kern: Bewegung an/aus, Reveal, Menü, Seitenübergang, Zähler, Wort-Split.
   Nur transform/opacity, IntersectionObserver, rAF – nichts davon blockiert den Main-Thread. */
(() => {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };
  const mq = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Bewegung an/aus ---------- */
  const saved = store.get('nk:motion');
  const setMotion = (on, persist) => {
    root.dataset.motion = on ? 'on' : 'off';
    $$('[data-motion-toggle]').forEach(b => {
      b.setAttribute('aria-pressed', String(on));
      const l = $('[data-motion-label]', b); if (l) l.textContent = on ? 'Bewegung an' : 'Bewegung aus';
    });
    if (persist) store.set('nk:motion', on ? 'on' : 'off');
    if (!on) $$('[data-reveal]').forEach(e => e.classList.add('in'));
    window.dispatchEvent(new CustomEvent('nk:motion', { detail: on }));
  };
  const motionOn = () => root.dataset.motion === 'on';
  window.NK = { motionOn, $, $$ };
  setMotion(saved ? saved === 'on' : !mq.matches, false);
  $$('[data-motion-toggle]').forEach(b => b.addEventListener('click', () => setMotion(!motionOn(), true)));
  mq.addEventListener?.('change', e => { if (!store.get('nk:motion')) setMotion(!e.matches, false); });

  /* ---------- Wort-Split (für Headline-Reveal) ---------- */
  $$('[data-split]').forEach(el => {
    const txt = el.textContent.trim();
    el.setAttribute('aria-label', txt);
    el.textContent = '';
    txt.split(/\s+/).forEach((w, i, a) => {
      const o = document.createElement('span'); o.className = 'w'; o.setAttribute('aria-hidden', 'true');
      const n = document.createElement('span'); n.textContent = w; n.style.setProperty('--i', i);
      o.appendChild(n); el.appendChild(o); if (i < a.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  /* ---------- Reveal + Zähler ---------- */
  const countUp = el => {
    const to = parseFloat(el.dataset.count), suf = el.dataset.suffix || '';
    if (!motionOn() || to === 0) { el.textContent = to + suf; return; }
    const t0 = performance.now(), d = 1100;
    const f = t => { const p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e) + suf; if (p < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  };
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    if (e.target.hasAttribute('data-count')) countUp(e.target);
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  $$('[data-reveal],[data-count],[data-split]').forEach(e => io.observe(e));
  $$('[data-count]').forEach(e => { e.textContent = '0' + (e.dataset.suffix || ''); });

  /* ---------- Menü ---------- */
  const menu = $('#menu'), openers = $$('[data-menu-open]'), closers = $$('[data-menu-close]');
  let lastFocus = null;
  const setMenu = open => {
    if (!menu) return;
    root.classList.toggle('menu-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menu.inert = !open;
    openers.forEach(b => b.setAttribute('aria-expanded', String(open)));
    if (open) { lastFocus = document.activeElement; setTimeout(() => ($('[data-menu-focus]', menu) || $('[data-menu-close]', menu))?.focus(), 60); }
    else if (lastFocus) lastFocus.focus?.();
    if (history.replaceState && (open || location.hash === '#menu'))
      history.replaceState(null, '', open ? '#menu' : location.pathname + location.search);
  };
  openers.forEach(b => b.addEventListener('click', () => setMenu(true)));
  closers.forEach(b => b.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && root.classList.contains('menu-open')) setMenu(false);
    if (e.key === 'Tab' && root.classList.contains('menu-open')) {
      const f = $$('a,button,input', menu).filter(x => !x.disabled && x.offsetParent !== null);
      if (!f.length) return; const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { z.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === z) { a.focus(); e.preventDefault(); }
    }
  });
  if (menu) { menu.inert = true; if (location.hash === '#menu') setTimeout(() => setMenu(true), 30); }
  addEventListener('hashchange', () => setMenu(location.hash === '#menu'));

  /* ---------- Seitenübergang ---------- */
  const leave = href => {
    root.classList.add('is-leaving');
    try { sessionStorage.setItem('nk:pt', '1'); } catch {}
    setTimeout(() => { location.href = href; }, 520);
  };
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]'); if (!a) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || a.target || e.metaKey || e.ctrlKey || e.shiftKey || a.hasAttribute('download')) return;
    if (u.pathname === location.pathname && u.hash) { setMenu(false); return; }
    if (!motionOn()) return;
    e.preventDefault(); leave(u.href);
  });
  if (root.classList.contains('is-entering')) setTimeout(() => {
    root.classList.remove('is-entering'); try { sessionStorage.removeItem('nk:pt'); } catch {}
  }, 900);
  addEventListener('pageshow', e => { if (e.persisted) root.classList.remove('is-leaving'); });

  /* ---------- Scroll-Fortschritt als CSS-Variable ---------- */
  let tick = false;
  const prog = () => { tick = false;
    const h = root.scrollHeight - innerHeight; root.style.setProperty('--sp', h > 0 ? (scrollY / h).toFixed(4) : 0); };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(prog); } }, { passive: true });
  prog();
  root.classList.add('js');
})();
