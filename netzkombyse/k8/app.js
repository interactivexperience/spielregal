/* Konzept 8 · Flaschenpost – Karten neigen sich mit dem Abstand zur Mitte, Flasche treibt mit, Mausrad scrollt seitwärts */
(() => {
  const { $, $$, motionOn } = window.NK || {};
  const deck = $ && $('[data-deck]');
  if (!deck) return;
  const root = document.documentElement, cards = $$('[data-card]', deck), dots = $$('[data-go]'), prev = $('[data-prev]'), next = $('[data-next]');
  let tick = false, cur = -1;
  const upd = () => { tick = false;
    const c = deck.scrollLeft + deck.clientWidth / 2, on = motionOn();
    let best = 0, bd = 1e9;
    cards.forEach((el, i) => { const mid = el.offsetLeft + el.offsetWidth / 2, o = Math.max(-1.5, Math.min(1.5, (mid - c) / el.offsetWidth)), d = Math.abs(mid - c);
      if (d < bd) { bd = d; best = i; }
      if (on) { el.style.setProperty('--o', o.toFixed(3)); el.style.setProperty('--a', Math.abs(o).toFixed(3)); } });
    const max = deck.scrollWidth - deck.clientWidth; root.style.setProperty('--dp', on && max > 0 ? (deck.scrollLeft / max).toFixed(4) : 0);
    if (best !== cur) { cur = best; dots.forEach((d, i) => { if (i === best) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
      prev.disabled = best === 0; next.disabled = best === cards.length - 1; }
  };
  const go = i => { i = Math.max(0, Math.min(cards.length - 1, i)); const el = cards[i];
    deck.scrollTo({ left: el.offsetLeft + el.offsetWidth / 2 - deck.clientWidth / 2, behavior: motionOn() ? 'smooth' : 'auto' }); };
  deck.addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  addEventListener('resize', upd); addEventListener('nk:motion', () => { cards.forEach(el => { el.style.removeProperty('--o'); el.style.removeProperty('--a'); }); upd(); });
  prev.addEventListener('click', () => go(cur - 1)); next.addEventListener('click', () => go(cur + 1));
  dots.forEach(d => d.addEventListener('click', () => go(+d.dataset.go)));
  deck.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); } });
  /* Mausrad: senkrechtes Drehen scrollt die Karten seitwärts (nur Maus) */
  deck.addEventListener('wheel', e => { if (!matchMedia('(hover:hover) and (pointer:fine)').matches || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault(); deck.scrollBy({ left: e.deltaY, behavior: 'auto' }); }, { passive: false });
  upd();
})();
