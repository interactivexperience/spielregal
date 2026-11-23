// Konzept 4 · GEZEITEN – Wattenmeer: Der Scroll ist die Tide. Wasser steigt und fällt, Inhalte tauchen bei Ebbe auf.
import { page, esc } from './lib.mjs';
import { header, lagen, saeulen, disz, cases, stimmen, kontakt, footer, marken, C } from './lib2.mjs';
import { welleLoop, fly } from './art.mjs';

const tide = `<div class="tide" aria-hidden="true"><div class="tide-w">${welleLoop('#3E7C94', 120, 'tw1', 540)}<div class="tide-b"></div></div></div>
<p class="gauge" aria-hidden="true"><span>Pegel Hamburg</span><b data-pegel>2,1</b><span>m ü. Kartennull</span></p>`;

function index() {
  const body = `<div id="top"></div>${tide}${header([['#flut', 'Flut'], ['#kurs', 'Kurs'], ['#watt', 'Watt'], ['#kontakt', 'Kontakt']])}
<main id="main">
<section class="hero" aria-labelledby="h1">
  <p class="kk" data-reveal>Digitaler Commerce · Hamburg · Elbe, Watt und Nordsee</p>
  <h1 id="h1" data-reveal>Wir wachsen mit der Tide. Ihr Shop auch.</h1>
  <p class="lead" data-reveal>Mal läuft das Geschäft auf, mal ab. Wir bauen Systeme, die beides aushalten – und bleiben, wenn das Wasser weg ist.</p>
  <p class="cta" data-reveal><a class="btn btn-p" href="#kontakt">Kurs besprechen</a><a class="btn btn-s" href="#flut">Scrollen. Der Pegel steigt.</a></p>
  <div class="hero-fl" aria-hidden="true">${fly('f1')}${fly('f2')}${fly('f3')}</div>
</section>

<section class="sec" id="flut"><div class="wr"><p class="kk" data-reveal>Flut · Ausgangslage</p><h2 data-reveal>Woher kommt das Wasser?</h2>
  <p class="sub" data-reveal>Wir begleiten Unternehmen, die E-Commerce als zentralen Teil ihrer Entwicklung sehen – nicht als Nebenschauplatz.</p>${lagen()}</div></section>

<section class="sec sec-d" id="kurs"><div class="wr"><p class="kk" data-reveal>Hochwasser · Kurs</p><h2 data-reveal>Drei Disziplinen, ein Ziel: digitaler Vertrieb, der sich rechnet.</h2>${disz()}${saeulen()}</div></section>

<section class="sec" id="watt"><div class="wr"><p class="kk" data-reveal>Ebbe · Was bleibt</p><h2 data-reveal>Ausgewählte Arbeiten.</h2>
  <p class="sub" data-reveal>${C.zahlen.marken} Marken, ${C.zahlen.branchen} Branchen, ${C.jahre}+ Jahre. Bei Ebbe zeigt sich, was trägt.</p>${cases()}
  <p class="band" aria-label="Kunden"><span class="band-t">${marken()}</span></p>${stimmen()}</div></section>

<section class="sec sec-d" id="kontakt"><div class="wr">${kontakt('Nächste Flut: gemeinsam.')}</div></section>
</main>${footer()}`;
  return page({ k: 'k4', title: 'NetzKombyse · Konzept 4 Gezeiten', desc: 'Konzept 4: Gezeiten – der Scroll ist die Tide.', theme: '#EFE6D3', body });
}
export const pages = () => ({ 'index.html': index() });
