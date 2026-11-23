// Konzept 10 · SIGNAL – bold in Schwarz-Weiß, eine Akzentfarbe (Rettungsorange). Riesige Schrift, harte Kanten, wenig Dekoration.
import { page, logo, esc } from './lib.mjs';
import { C } from '../content.mjs';
import { header, footer, marken } from './lib2.mjs';

const stmt = 'Wir bauen digitale Vertriebssysteme für Unternehmen, die mehr vorhaben. Mit Menschen, die bleiben, wenn die Flaute kommt. Direkt, ehrlich und ohne Vertriebsfilter.';
const words = stmt.split(' ').map((w, i) => `<span class="sw" style="--i:${i}">${esc(w)}</span>`).join(' ');
const zahlen = [[C.zahlen.marken, '', 'Marken'], [C.zahlen.branchen, '', 'Branchen'], [C.jahre, '+', 'Jahre'], [C.zahlen.team, '', 'Menschen']];

function index() {
  const body = `<div id="top"></div><div class="cur" aria-hidden="true"><span></span></div>
${header([['#haltung', 'Haltung'], ['#leistung', 'Leistung'], ['#arbeit', 'Arbeit'], ['#kontakt', 'Kontakt']])}
<main id="main">
<section class="hero" aria-labelledby="h1">
  <p class="mono" data-reveal>NetzKombyse · Hamburg · Digitaler Commerce</p>
  <h1 id="h1"><span class="ln" data-reveal>Shops,</span><span class="ln" data-reveal style="--d:80ms">die sich</span><span class="ln acc" data-reveal style="--d:160ms">rechnen.</span></h1>
  <p class="cta" data-reveal style="--d:240ms"><a class="btn btn-a" href="#kontakt" data-cur="Los">Projekt besprechen</a><a class="btn btn-o" href="#arbeit" data-cur="Ansehen">Arbeiten ansehen</a></p>
</section>
<p class="tick" aria-label="Kunden"><span class="tick-t">${marken()}</span></p>

<section class="sec" id="haltung"><div class="wr"><p class="mono">01 · Haltung</p>
  <p class="fill" data-fill aria-label="${esc(stmt)}">${words}</p></div></section>

<section class="sec sec-b" id="leistung"><div class="wr"><p class="mono">02 · Leistung</p><h2 data-reveal>Drei Disziplinen. Ein Ziel.</h2>
  <ol class="stack">${C.disziplinen.map((d, i) => `<li style="--i:${i}"><a href="#kontakt" data-cur="Anfragen"><span class="big" aria-hidden="true">0${i + 1}</span><h3>${esc(d.t)}</h3><p>${esc(d.d)}</p></a></li>`).join('')}</ol>
  <ul class="pil">${C.saeulen.map(s => `<li data-reveal><b>${esc(s.t)}</b><span>${esc(s.d)}</span></li>`).join('')}</ul></div></section>

<section class="sec" id="lage"><div class="wr"><p class="mono">03 · Ausgangslage</p><h2 data-reveal>Woher Sie kommen.</h2>
  <ul class="lg">${C.lagen.map((l, i) => `<li data-reveal style="--d:${i * 80}ms"><b>${esc(l.t)}</b><span>${esc(l.d)}</span></li>`).join('')}</ul></div></section>

<section class="sec sec-b" id="zahlen"><div class="wr"><ul class="nums">${zahlen.map(([n, s, l]) => `<li data-reveal><b><span data-count="${n}" data-suffix="${s}">${n}${s}</span></b><span>${l}</span></li>`).join('')}</ul></div></section>

<section class="sec" id="arbeit"><div class="wr"><p class="mono">04 · Arbeit</p><h2 data-reveal>Ausgewählte Projekte.</h2>
  <ul class="rows">${C.cases.map(c => `<li data-reveal><span class="mono">${esc(c.typ)} · ${esc(c.branche)}</span><b data-cur="${c.featured ? 'Case: k1–k3' : 'Projekt'}">${esc(c.t)}</b></li>`).join('')}</ul>
  <div class="sm">${C.stimmen.map(s => `<figure data-reveal><blockquote>${esc(s.q)}</blockquote><figcaption>${esc(s.w)}, ${esc(s.f)}${s.hinweis ? ` (${esc(s.hinweis)})` : ''}</figcaption></figure>`).join('')}</div></div></section>

<section class="sec sec-a" id="kontakt"><div class="wr"><p class="mono">05 · Kontakt</p><h2 class="huge" data-reveal>Reden wir.</h2>
  <p class="lead" data-reveal>${C.ansprech.name}, ${C.ansprech.rolle}. Ihr Ansprechpartner von der ersten Frage an.</p>
  <p class="cta" data-reveal><a class="btn btn-k" href="${C.termin}" data-cur="Buchen">Termin buchen</a><a class="btn btn-w" href="${C.telHref}">${C.tel}</a></p></div></section>
</main>${footer()}`;
  return page({ k: 'k10', title: 'NetzKombyse · Konzept 10 Signal', desc: 'Konzept 10: Signal – bold in Schwarz-Weiß mit Rettungsorange.', theme: '#000000', body });
}
export const pages = () => ({ 'index.html': index() });
