/* Konzept 11 · Beton – Überschriften „decodieren“ beim Einblenden (Zeichen-Rauschen, Monospace-Breite bleibt stabil) */
(() => {
  const { $$, motionOn } = window.NK || {};
  if (!$$) return;
  const CH = '█▓▒░#/\\+-_<>=?%';
  const run = el => {
    const final = el.dataset.final; if (!motionOn()) { el.textContent = final; return; }
    const t0 = performance.now(), D = 650 + final.length * 22;
    const f = t => { const p = Math.min(1, (t - t0) / D), k = Math.floor(p * final.length);
      let s = ''; for (let i = 0; i < final.length; i++) s += (i < k || final[i] === ' ' || final[i] === '[' || final[i] === ']') ? final[i] : CH[(Math.random() * CH.length) | 0];
      el.textContent = s; if (p < 1) requestAnimationFrame(f); else el.textContent = final; };
    requestAnimationFrame(f);
  };
  const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; io.unobserve(e.target); run(e.target); }), { threshold: .3 });
  $$('[data-scr]').forEach(el => { el.dataset.final = el.textContent; el.setAttribute('aria-label', el.textContent); el.setAttribute('role', 'heading'); el.setAttribute('aria-level', '2'); io.observe(el); });
})();
