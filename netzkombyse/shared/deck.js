/* Präsentations-Player (alle Konzepte): Pfeiltasten, Wischen, Klick, Vollbild */
(() => {
  const { $, $$ } = window.NK || {}; const stage = $ && $('#stage'); if (!stage) return;
  const root = document.documentElement, sl = $$('.sl', stage), cur = $('[data-cur]'); let i = 0;
  const go = n => {
    n = Math.max(0, Math.min(sl.length - 1, n)); if (n === i) return;
    sl.forEach((s, k) => { s.classList.toggle('on', k === n); s.classList.toggle('past', k < n); s.setAttribute('aria-hidden', String(k !== n)); });
    i = n; cur.textContent = String(i + 1).padStart(2, '0'); root.style.setProperty('--pp', ((i + 1) / sl.length).toFixed(4));
  };
  root.style.setProperty('--pp', (1 / sl.length).toFixed(4));
  $('[data-next]').addEventListener('click', () => go(i + 1));
  $('[data-prev]').addEventListener('click', () => go(i - 1));
  $('[data-full]').addEventListener('click', () => { document.fullscreenElement ? document.exitFullscreen() : stage.parentElement.requestFullscreen?.(); });
  addEventListener('keydown', e => {
    if (root.classList.contains('menu-open')) return;
    if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(i + 1); }
    if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(i - 1); }
    if (e.key === 'f' || e.key === 'F') $('[data-full]').click();
  });
  let x0 = null;
  stage.addEventListener('pointerdown', e => { x0 = e.clientX; });
  stage.addEventListener('pointerup', e => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; go(i + (Math.abs(dx) > 50 ? (dx < 0 ? 1 : -1) : 1)); });
})();
