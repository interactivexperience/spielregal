/* Konzept 2 · Magazin – Textfüllung beim Scrollen, Kapitel-Rail, Vorschaukarte im Inhaltsverzeichnis */
(() => {
  const { $, $$, motionOn } = window.NK || {};
  if (!$) return;

  /* Manifest: Wörter füllen sich mit dem Scrollfortschritt */
  const m = $('[data-fill]');
  if (m) {
    const words = m.textContent.trim().split(/\s+/);
    m.setAttribute('aria-label', words.join(' ')); m.textContent = '';
    const els = words.map((w, i) => { const s = document.createElement('span'); s.className = 'f'; s.textContent = w; s.setAttribute('aria-hidden', 'true');
      m.appendChild(s); if (i < words.length - 1) m.appendChild(document.createTextNode(' ')); return s; });
    let tick = false, last = -1;
    const upd = () => { tick = false;
      const r = m.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight * .85 - r.top) / (r.height + innerHeight * .35)));
      const n = Math.round(p * els.length); if (n === last) return;
      els.forEach((e, i) => e.classList.toggle('lit', i < n)); last = n; };
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true }); upd();
  }

  /* Kapitel-Rail */
  const chs = $$('[data-ch]'), rn = $('[data-rail-n]'), rt = $('[data-rail-t]');
  if (chs.length && rn) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) {
      rn.textContent = String(chs.indexOf(e.target) + 1).padStart(2, '0'); rt.textContent = e.target.dataset.ch; } }), { rootMargin: '-45% 0px -50% 0px' });
    chs.forEach(c => io.observe(c));
  }

  /* Vorschaukarte folgt dem Zeiger */
  const peek = $('.peek'); if (!peek) return;
  let x = 0, y = 0, raf = 0;
  const draw = () => { raf = 0; peek.style.transform = `translate3d(${x + 28}px,${y - 120}px,0) scale(1)`; };
  $$('[data-peek]').forEach(a => {
    a.addEventListener('pointerenter', () => { if (!motionOn()) return; peek.dataset.v = a.dataset.peek; peek.classList.add('on'); });
    a.addEventListener('pointerleave', () => { peek.classList.remove('on'); peek.style.transform = `translate3d(${x + 28}px,${y - 120}px,0) scale(.85)`; });
    a.addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(draw); });
  });
})();
