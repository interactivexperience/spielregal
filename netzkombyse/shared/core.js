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
    root.style.setProperty('--px', e.clientX + 'px'); root.style.setProperty('--py', e.clientY + 'px');
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
  /* ---------- Weiches Trägheits-Scrollen (Lenis-artig, opt-in per <html data-smooth>) ----------
     Nur Mausrad, nur bei Bewegung an + feinem Zeiger. Tastatur, Touch, Scrollbar bleiben nativ. */
  if (root.hasAttribute('data-smooth') && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    let target = scrollY, cur = scrollY, raf = 0;
    const max = () => root.scrollHeight - innerHeight;
    const active = () => motionOn() && !root.classList.contains('menu-open');
    const loop = () => {
      cur += (target - cur) * 0.085;
      if (Math.abs(target - cur) < 0.4) { cur = target; raf = 0; } else raf = requestAnimationFrame(loop);
      scrollTo(0, cur);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    addEventListener('wheel', e => {
      if (!active() || e.ctrlKey || e.target.closest?.('[data-no-smooth],.menu,.track,.cards-x')) return;
      if (e.deltaMode === 0 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      target = Math.min(max(), Math.max(0, target + e.deltaY * (e.deltaMode === 1 ? 32 : 1)));
      kick();
    }, { passive: false });
    addEventListener('scroll', () => { if (!raf) { target = cur = scrollY; } }, { passive: true });
    addEventListener('resize', () => { target = Math.min(target, max()); });
    root.classList.add('smooth-on');
    window.NK.scrollTo = y => { target = Math.min(max(), Math.max(0, y)); kick(); };
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]'); if (!a || !active()) return;
      const el = a.hash.length > 1 && document.querySelector(a.hash); if (!el) return;
      e.preventDefault(); window.NK.scrollTo(el.getBoundingClientRect().top + scrollY - 70);
      history.replaceState(null, '', a.hash);
    });
  }

  /* ---------- Zurück zur Übersicht (alle Konzepte): fester Knopf, Tippfläche 44 px ---------- */
  if (document.body.dataset.k) {
    const st = document.createElement('style');
    st.textContent = '.nk-back{position:fixed;z-index:500;left:max(10px,env(safe-area-inset-left));bottom:max(10px,env(safe-area-inset-bottom));display:inline-flex;align-items:center;gap:.35em;min-height:44px;padding:0 1em 0 .8em;border-radius:99px;background:#fff;color:#111;border:2px solid #111;font:700 .8rem/1 system-ui,sans-serif;letter-spacing:.02em;text-decoration:none;box-shadow:0 3px 14px rgba(0,0,0,.28)}'
      + '.nk-back:hover{background:#111;color:#fff}.nk-back:focus-visible{outline:3px solid #FF5A45;outline-offset:3px}'
      + 'body[data-k=k7] .nk-back,body[data-k=k8] .nk-back{left:50%;bottom:auto;top:max(84px,calc(env(safe-area-inset-top) + 84px));transform:translateX(-50%)}'
      + 'body[data-k=k9] .nk-back{bottom:auto;top:max(70px,calc(env(safe-area-inset-top) + 70px))}'
      + 'body[data-k=k12] .nk-back{left:max(10px,env(safe-area-inset-left));bottom:auto;top:max(72px,calc(env(safe-area-inset-top) + 66px))}'
      + '@media(min-width:901px){body[data-k=k12] .nk-back{top:auto;bottom:max(10px,env(safe-area-inset-bottom));left:calc(250px + 20px)}}'
      + '@media(max-width:560px){.nk-back{font-size:.78rem}}@media print{.nk-back{display:none}}';
    document.head.appendChild(st);
    const a = document.createElement('a'); a.className = 'nk-back'; a.href = '../index.html'; a.textContent = '‹ Übersicht'; a.setAttribute('aria-label', 'Zurück zur Konzept-Übersicht');
    document.body.appendChild(a);
  }
  root.classList.add('js');
})();
