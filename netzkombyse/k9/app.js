/* Konzept 9 · Funkspruch – spielt das Gespräch aus dem JSON-Skript ab; Chips sind die Antworten */
(() => {
  const { $, motionOn } = window.NK || {};
  const log = $ && $('[data-log]'), chips = $('[data-chips]'), raw = $('[data-flow]');
  if (!log || !raw) return;
  const S = JSON.parse(raw.textContent), F = S.flow;
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const scroll = () => { log.scrollTo({ top: log.scrollHeight, behavior: motionOn() ? 'smooth' : 'auto' }); };
  const wait = ms => new Promise(r => setTimeout(r, motionOn() ? ms : 0));
  let busy = false, first = true;

  const say = async (txt) => { const t = el('div', 'typing'); t.setAttribute('aria-hidden', 'true'); t.append(el('i'), el('i'), el('i')); log.append(t); scroll();
    await wait(500 + Math.min(700, txt.length * 9)); t.remove(); log.append(el('p', 'msg bot', txt)); scroll(); };
  const block = async (build) => { await wait(350); const m = el('div', 'msg bot wide'); build(m); log.append(m); scroll(); };

  const play = async key => {
    busy = true; chips.replaceChildren(); const n = F[key];
    if (n.you) { log.append(el('p', 'msg you', n.you)); scroll(); }
    for (const t of n.bot) await say(t);
    if (n.card) await block(m => { const k = el('div', 'kcard'); k.append(el('b', '', n.card.t), el('span', '', n.card.d)); m.append(k); });
    if (n.list) await block(m => { const u = el('ul', 'kl'); n.list.forEach(([t, d]) => { const li = el('li'); li.append(el('b', '', t), el('span', '', d)); u.append(li); }); m.append(u); });
    if (n.cases) await block(m => { const s = el('div', 'strip'); n.cases.forEach(([t, d]) => { const c = el('div'); c.append(el('b', '', t), el('small', '', d)); s.append(c); }); m.append(s); });
    if (n.bot2) for (const t of n.bot2) await say(t);
    if (n.acts) await block(m => { const a = el('a', 'btn btn-p', 'Termin buchen'); a.href = S.termin; const b = el('a', 'btn', S.tel); b.href = S.telHref; m.append(a, b); });
    if (key === 'termin') { const f = el('p', 'msg bot', S.hinweis); f.style.fontSize = '.78rem'; log.append(f); }
    n.chips.forEach(([label, to], i) => { const b = el('button', 'chip', label); b.type = 'button'; b.style.animationDelay = (i * 70) + 'ms';
      b.addEventListener('click', () => { if (!busy) play(to); }); chips.append(b); });
    scroll(); busy = false; if (!first) chips.querySelector('.chip')?.focus({ preventScroll: true }); first = false;
  };
  if (!motionOn()) log.classList.add('instant');
  play('start');
})();
