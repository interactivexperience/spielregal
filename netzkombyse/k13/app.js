/* Konzept 13 · Federstrich – Strichillustration „zeichnet“ sich beim Einblenden (clip-path). Beobachtet wird der Hero-Abschnitt,
   weil ein per clip-path beschnittenes Element für den IntersectionObserver keine Fläche hat. */
(() => {
  const { $, $$ } = window.NK || {};
  const hero = $ && $('.hero');
  if (!hero) return;
  const draw = () => $$('[data-art]').forEach(a => a.classList.add('in'));
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { draw(); o.disconnect(); } }, { threshold: .1 }).observe(hero);
  window.addEventListener('nk:motion', draw);
})();
