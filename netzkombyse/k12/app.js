/* Konzept 12 · Logbuch – aktives Kapitel (Navigation, Kapitelleiste, Einblenden) und versetzte Parallaxe aus der Scrollposition */
(() => {
  const { $, $$, motionOn } = window.NK || {};
  const sls = $ && $$('[data-sl]');
  if (!sls || !sls.length) return;
  const links = $$('[data-nav]'), idx = $$('[data-idx]');
  const setActive = i => {
    sls.forEach((s, k) => s.classList.toggle('act', k === i));
    links.forEach((a, k) => { if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    idx.forEach((e, k) => e.classList.toggle('on', k === i));
    window.dispatchEvent(new CustomEvent('k12:section', { detail: i }));
    const a = links[i]; if (a && a.scrollIntoView && matchMedia('(max-width:900px)').matches) { const nav = a.closest('.rail-nav'); nav.scrollTo({ left: a.offsetLeft - 12, behavior: 'auto' }); }
  };
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setActive(sls.indexOf(e.target)); }), { threshold: .55 });
  sls.forEach(s => io.observe(s));
  setActive(0);

  /* Parallaxe: --p reicht von −1 (Kapitel unterhalb) über 0 (mittig) bis 1 (oberhalb) */
  let tick = false;
  const upd = () => { tick = false;
    const on = motionOn();
    sls.forEach(s => { const r = s.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      s.style.setProperty('--p', on ? Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / innerHeight)).toFixed(3) : 0); }); };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  addEventListener('resize', upd); addEventListener('nk:motion', upd); upd();
})();
