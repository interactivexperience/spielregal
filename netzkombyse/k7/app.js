/* Konzept 7 · Seemannsgarn – Stories: Antippen rechts/links, Halten = Pause, Wischen, Pfeiltasten; Autoplay nur bei Bewegung an */
(() => {
  const { $, $$, motionOn } = window.NK || {};
  const app = $ && $('[data-stories]');
  if (!app) return;
  const root = document.documentElement;
  const stories = $$('.story', app), segs = $$('.seg', app), cur = $('[data-cur]', app);
  const N = stories.length;
  let i = 0, holdT = 0, held = false;
  const show = (n, dir) => {
    n = Math.max(0, Math.min(N - 1, n)); if (n === i && stories[n].classList.contains('on')) return;
    stories.forEach((s, k) => { const on = k === n;
      s.classList.toggle('from-l', dir < 0 && on); s.classList.toggle('on', on);
      s.setAttribute('aria-hidden', String(!on)); s.inert = !on; });
    segs.forEach((g, k) => { g.classList.remove('cur', 'done'); if (k < n) g.classList.add('done'); });
    void segs[n].offsetWidth; segs[n].classList.add('cur');
    i = n; cur.textContent = n + 1; app.classList.toggle('last', n === N - 1);
    $$('[data-prev]', app).forEach(b => { b.disabled = n === 0; });
    const fg = getComputedStyle(stories[n]).getPropertyValue('--fg'); app.style.setProperty('--bg', stories[n].style.getPropertyValue('--bg')); app.style.setProperty('--fg', fg);
    const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = stories[n].style.getPropertyValue('--bg');
  };
  const next = () => show(i + 1, 1), prev = () => show(i - 1, -1);
  segs.forEach((g, k) => { $('b', g).addEventListener('animationend', () => { if (k === i && i < N - 1 && motionOn()) next(); }); });

  /* Halten = Pause, kurzes Tippen = weiter/zurück */
  $$('.tz', app).forEach(z => {
    const fwd = z.hasAttribute('data-next');
    z.addEventListener('click', e => e.preventDefault());
    z.addEventListener('pointerdown', () => { held = false; clearTimeout(holdT); holdT = setTimeout(() => { held = true; app.classList.add('paused'); }, 220); });
    const end = () => { clearTimeout(holdT); if (held) { held = false; app.classList.remove('paused'); return false; } return true; };
    z.addEventListener('pointerup', () => { if (end()) fwd ? next() : prev(); });
    z.addEventListener('pointercancel', end); z.addEventListener('pointerleave', () => { clearTimeout(holdT); if (held) { held = false; app.classList.remove('paused'); } });
    z.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fwd ? next() : prev(); } });
  });
  /* Pfeil-Knöpfe im Dock (zählen nicht als Halten) */
  $$('.dock [data-next]', app).forEach(b => b.addEventListener('click', next));
  $$('.dock [data-prev]', app).forEach(b => b.addEventListener('click', prev));
  $$('[data-restart]', app).forEach(b => b.addEventListener('click', () => show(0, -1)));
  addEventListener('keydown', e => { if (e.key === 'ArrowRight') next(); else if (e.key === 'ArrowLeft') prev(); });

  /* Wischen */
  let sx = 0, sy = 0;
  app.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  app.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { dx < 0 ? next() : prev(); } }, { passive: true });
  addEventListener('nk:motion', () => { if (motionOn()) { const s = segs[i]; s.classList.remove('cur'); void s.offsetWidth; s.classList.add('cur'); } });
  stories[0].classList.remove('on'); show(0, 1);
})();
