/* Konzept 15 · Glut – Akkordeon der Leistungen; ein Eintrag offen */
(() => {
  const { $$ } = window.NK || {};
  if (!$$) return;
  const items = $$('.acc li');
  items.forEach(li => $$('button', li).forEach(b => b.addEventListener('click', () => {
    const open = li.classList.contains('open');
    items.forEach(x => { x.classList.remove('open'); $$('button', x)[0].setAttribute('aria-expanded', 'false'); $$('.pn', x)[0].hidden = true; });
    if (!open) { li.classList.add('open'); b.setAttribute('aria-expanded', 'true'); $$('.pn', li)[0].hidden = false; }
  })));
})();
