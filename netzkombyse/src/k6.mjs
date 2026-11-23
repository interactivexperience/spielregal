// Konzept 6 · FISCHMARKT – Marktplakat: große Schrift, Ticker, Preisschilder, Wörter laufen mit dem Scroll.
import { page, esc } from './lib.mjs';
import { header, lagen, saeulen, cases, stimmen, kontakt, footer, marken, C } from './lib2.mjs';
import { fisch } from './art.mjs';

const rows = [['BERATEN', 1], ['BAUEN', -1], ['WACHSEN', 1]];
function index() {
  const body = `<div id="top"></div>${header([['#ware', 'Die Ware'], ['#angebot', 'Angebot'], ['#fang', 'Tagesfang'], ['#kontakt', 'Kontakt']])}
<main id="main">
<section class="hero" aria-labelledby="h1">
  <p class="stamp" aria-hidden="true">${C.jahre}+ Jahre · Hamburg</p>
  <h1 id="h1"><span class="r1" data-reveal>Tages</span><span class="r2" data-reveal style="--d:80ms">frischer</span><span class="r3" data-reveal style="--d:160ms">Commerce.</span></h1>
  <div class="hero-fish" aria-hidden="true">${fisch('hf1')}${fisch('hf2')}</div>
  <p class="lead" data-reveal>Digitaler Vertrieb für Mittelständler: kein Schnickschnack, ehrliche Preise, direkter Draht zu denen, die bauen.</p>
  <p class="cta" data-reveal><a class="btn btn-p" href="#kontakt">Jetzt zugreifen</a><a class="btn btn-s" href="#angebot">Unser Angebot</a></p>
</section>

<p class="ticker" aria-label="Kunden"><span class="ticker-t">${marken()}</span></p>

<section class="sec" id="ware"><div class="wr"><p class="kk" data-reveal>Die Ware</p><h2 data-reveal>Was bei uns über die Theke geht.</h2>
  <p class="sub" data-reveal>Wir begleiten Unternehmen, die E-Commerce als zentralen Teil ihrer Entwicklung sehen – nicht als Nebenschauplatz.</p>${lagen()}</div></section>

<section class="slide" id="angebot" aria-label="Angebot: Beraten, Bauen, Wachsen">
  ${rows.map(([w, d], i) => `<p class="row" data-slide="${d}" aria-hidden="${i ? 'true' : 'false'}"><span>${w}</span><span>${w}</span><span>${w}</span></p>`).join('')}
  <div class="wr slide-in">${saeulen()}</div>
</section>

<section class="sec" id="fang"><div class="wr"><p class="kk" data-reveal>Tagesfang</p><h2 data-reveal>Ausgewählte Arbeiten.</h2>
  <p class="sub" data-reveal>${C.zahlen.marken} Marken, ${C.zahlen.branchen} Branchen, ${C.jahre}+ Jahre.</p>${cases()}${stimmen()}</div></section>

<section class="sec sec-r" id="kontakt"><div class="wr">${kontakt('Komm vorbei. Wir packen ein.')}</div></section>
</main>${footer()}`;
  return page({ k: 'k6', title: 'NetzKombyse · Konzept 6 Fischmarkt', desc: 'Konzept 6: Fischmarkt – Marktplakat mit Ticker und Preisschildern.', theme: '#F6EFE0', body });
}
export const pages = () => ({ 'index.html': index() });
