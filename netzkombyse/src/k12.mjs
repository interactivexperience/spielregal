// Konzept 12 · LOGBUCH – nach Owner-Vorlage (dunkel, Orange, Weiß, ultra-schmale Versalien, angeschnittene Riesenschrift).
// Statt Fotos steht die Möwe als Schwarz-Weiß-Ausschnitt vor der Schrift. Kapitel = Vollbild-Seiten, links Navigation + Kapitelleiste.
import { page, esc } from './lib.mjs';
import { C } from '../content.mjs';
import { gull } from './art.mjs';
import { marken } from './lib2.mjs';

const cut = (cls) => `<div class="cut ${cls}" aria-hidden="true">${gull('cg')}</div>`;
const nav = [['s1', 'Start'], ['s2', 'Zahlen'], ['s3', 'Leistung'], ['s4', 'Lage'], ['s5', 'Arbeit'], ['s6', 'Kontakt']];
const lines = (arr) => arr.map((t, i) => `<span class="ln" style="--i:${i}">${esc(t)}</span>`).join('');

function index() {
  const body = `<div id="top"></div>
<aside class="rail" aria-label="Navigation">
  <a class="rail-logo" href="index.html" aria-label="NetzKombyse – Startseite">NETZ<br>KOMBYSE</a>
  <nav class="rail-nav" aria-label="Kapitel"><ol>${nav.map(([id, t], i) => `<li><a href="#${id}" data-nav="${id}"><i aria-hidden="true"></i>${esc(t)}</a></li>`).join('')}</ol></nav>
  <ol class="rail-idx" aria-hidden="true">${nav.map((_, i) => `<li data-idx="${i}">${String(i + 1).padStart(2, '0')}</li>`).join('')}</ol>
  <button class="mt" type="button" data-motion-toggle aria-pressed="true" title="Animationen ein- oder ausschalten"><span class="mt-i" aria-hidden="true"></span><span data-motion-label>Bewegung an</span></button>
</aside>
<main id="main">

<section class="sl s1" id="s1" data-sl aria-labelledby="h1">
  <div class="bigw" aria-hidden="true"><span>NETZ</span><span>KOMBYSE</span></div>
  ${cut('c1')}
  <h1 id="h1" class="q"><span class="qm" aria-hidden="true">“</span>${lines(['Wir bauen', 'den Shop,', 'der sich', 'rechnet.'])}</h1>
  <p class="sm">Digitaler Commerce aus Hamburg für Mittelständler. Von Menschen, die bleiben, wenn die Flaute kommt.</p>
</section>

<section class="sl s2" id="s2" data-sl aria-label="Zahlen">
  <div class="bigw n" aria-hidden="true"><span data-count="${C.jahre}">${C.jahre}</span></div>
  ${cut('c2')}
  <p class="orl">${lines(['Jahre', 'Erfahrung'])}</p>
  <ul class="stats">${[[C.zahlen.marken, '', 'Marken'], [C.zahlen.branchen, '', 'Branchen'], [C.zahlen.team, '', 'Menschen']].map(([n, s, l]) => `<li><b><span data-count="${n}" data-suffix="${s}">${n}${s}</span></b><span>${l}</span></li>`).join('')}</ul>
</section>

<section class="sl s3 org" id="s3" data-sl aria-label="Leistung">
  <div class="bigw w" aria-hidden="true"><span>3 MAL</span><span>DISZIPLIN</span></div>
  ${cut('c3')}
  <ol class="dz">${C.disziplinen.map((d, i) => `<li><b>${esc(d.t)}</b><span>${esc(d.d)}</span></li>`).join('')}</ol>
</section>

<section class="sl s4" id="s4" data-sl aria-label="Ausgangslage">
  <div class="cols"><p><span class="drop" aria-hidden="true">${esc(C.lagen[0].t[0])}</span>${esc(C.lagen[0].t.slice(1))}. ${esc(C.lagen[0].d)} ${esc(C.lagen[1].t)}: ${esc(C.lagen[1].d)}</p>
    <p>${esc(C.lagen[2].t)}. ${esc(C.lagen[2].d)} ${esc(C.saeulen[0].t)}: ${esc(C.saeulen[0].d)} ${esc(C.saeulen[3].t)}: ${esc(C.saeulen[3].d)}</p></div>
  <p class="date">/Ausgangslage<br>${esc(C.firma)}</p>
  <a class="ring" href="${C.termin}" aria-label="Termin buchen"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 5"/></svg><span>Termin<br>buchen</span></a>
</section>

<section class="sl s5" id="s5" data-sl aria-label="Arbeit">
  <h2 class="stack">${lines(['Projekte von', 'PremiumWheels', 'bis PECHKEKS'])}</h2>
  <ul class="cases">${C.cases.map(c => `<li><b>${esc(c.t)}</b><span>${esc(c.typ)} · ${esc(c.branche)}</span></li>`).join('')}</ul>
  <p class="sm sm-r">„${esc(C.stimmen[0].q)}“<br><i>${esc(C.stimmen[0].w)}, ${esc(C.stimmen[0].f)}</i></p>
</section>

<section class="sl s6" id="s6" data-sl aria-label="Kontakt">
  <div class="bigw k" aria-hidden="true"><span>REDEN</span><span>WIR.</span></div>
  ${cut('c6')}
  <div class="ct"><p class="sm">${C.ansprech.name}, ${C.ansprech.rolle}. Ihr Ansprechpartner von der ersten Frage an.</p>
    <p class="acts"><a class="btn btn-o" href="${C.termin}">Termin buchen</a><a class="btn" href="${C.telHref}">${C.tel}</a></p>
    <p class="fine">${C.adresse.join(', ')} · <a href="#">Impressum</a> · <a href="#">Datenschutz</a> · <a href="../index.html">Konzept wechseln</a></p>
    <p class="fine">${C.hinweisBeispiel} Zitate sinngemäß bzw. Platzhalter. Dieses Konzept ist nur als Startseite ausgearbeitet.</p></div>
</section>
</main>`;
  return page({ k: 'k12', title: 'NetzKombyse · Konzept 12 Logbuch', desc: 'Konzept 12: Logbuch – dunkel, Orange, angeschnittene Riesenschrift, Möwe als Schwarz-Weiß-Ausschnitt.', theme: '#1B1918', body });
}
export const pages = () => ({ 'index.html': index() });
