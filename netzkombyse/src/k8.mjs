// Konzept 8 · FLASCHENPOST – mobile-first: Postkarten zum seitlichen Wischen (scroll-snap), Dock mit Punkten in der Daumenzone.
import { page, logo, esc } from './lib.mjs';
import { C } from '../content.mjs';
import { gull, fisch, korb, sonne, turm, welleLoop } from './art.mjs';

const bottle = (cls = '') => `<svg class="${cls}" viewBox="0 0 80 200" aria-hidden="true" focusable="false"><path d="M30 6h20v22c0 10 18 16 18 40v108a14 14 0 0 1-14 14H26a14 14 0 0 1-14-14V68c0-24 18-30 18-40z" fill="#BFE6E0" stroke="#10263A" stroke-width="4" stroke-linejoin="round"/><rect x="31" y="0" width="18" height="14" rx="3" fill="#C98B4B" stroke="#10263A" stroke-width="4"/><rect x="26" y="96" width="28" height="56" rx="3" fill="#FFF6DF" stroke="#10263A" stroke-width="3" transform="rotate(-4 40 124)"/><path d="M30 110h20M30 120h16M30 130h20" stroke="#E4482D" stroke-width="3" stroke-linecap="round" transform="rotate(-4 40 124)"/></svg>`;
const L = C.lagen, D = C.disziplinen, Sx = C.saeulen;
const cards = [
  { c: '#FFF6DF', k: 'Post aus Hamburg', h: 'Eine Flasche, ein Brief.', p: 'Wir bauen digitalen Vertrieb für Mittelständler und schicken Ihnen heute die Kurzfassung. Wischen Sie nach links.', art: bottle('ga ga-b') },
  ...L.map((l, i) => ({ c: ['#FFD84A', '#FFB3A1', '#BFE6E0'][i], k: `Ausgangslage ${i + 1} von 3`, h: l.t, p: l.d, art: [fisch('ga'), korb('#2E6BF0', 'ga'), sonne('ga')][i] })),
  ...D.map((d, i) => ({ c: ['#CFE0FF', '#FFE3B8', '#D8F0C8'][i], k: `Disziplin ${i + 1} von 3`, h: d.t, p: d.d, art: [turm('ga'), gull('ga'), korb('#FF5A45', 'ga')][i] })),
  { c: '#FFF6DF', k: 'Vier Säulen', h: 'Darauf bauen wir.', list: Sx.map(s => [s.t, s.d]) },
  { c: '#10263A', fg: '#FFF6DF', k: 'Referenzen', h: 'Hier sind wir eingelaufen.', chips: C.marken },
  { c: '#FFB3A1', k: 'Kundenstimme', quote: C.stimmen[0] },
  { c: '#FFD84A', k: `${C.ansprech.name}, ${C.ansprech.rolle}`, h: 'Antwort schicken?', p: 'Reden wir. Persönlich, von der ersten Frage an.', last: true, art: bottle('ga ga-b') },
];
const N = cards.length;
const card = (s, i) => `<article class="card" data-card style="--c:${s.c};--fg:${s.fg || '#10263A'};--r:${[-1.5, 1.2, -.8, 1.6][i % 4]}deg" aria-label="Karte ${i + 1} von ${N}">
  <span class="tape" aria-hidden="true"></span>
  ${s.art ? `<div class="art" aria-hidden="true">${s.art}</div>` : ''}
  <p class="k">${esc(s.k)} · ${i + 1}/${N}</p>${s.h ? `<h2>${esc(s.h)}</h2>` : ''}${s.p ? `<p class="p">${esc(s.p)}</p>` : ''}
  ${s.list ? `<ul class="li">${s.list.map(([t, d]) => `<li><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join('')}</ul>` : ''}
  ${s.chips ? `<ul class="chips">${s.chips.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
  ${s.quote ? `<blockquote>${esc(s.quote.q)}</blockquote><p class="who">${esc(s.quote.w)}, ${esc(s.quote.f)}</p>` : ''}
  ${s.last ? `<p class="acts"><a class="btn btn-p" href="${C.termin}">Termin buchen</a><a class="btn btn-s" href="${C.telHref}">${C.tel}</a></p>
  <p class="fine"><a href="#">Impressum</a> · <a href="#">Datenschutz</a> · <a href="../index.html">Konzept wechseln</a></p><p class="fine">${C.hinweisBeispiel} Zitate sinngemäß bzw. Platzhalter.</p>` : ''}
</article>`;

function index() {
  const body = `<div id="top"></div>
<div class="sea" aria-hidden="true"><div class="sea-w">${welleLoop('#9FD3E0', 120, 'sw1', 520)}</div><div class="sea-w sea-2">${welleLoop('#6FB6CE', 120, 'sw2', 400)}</div><span class="drift">${bottle('ga-d')}</span></div>
<header class="bar"><a class="bar-logo" href="index.html" aria-label="NetzKombyse – Startseite">${logo()}</a>
  <button class="mt" type="button" data-motion-toggle aria-pressed="true" title="Animationen ein- oder ausschalten"><span class="mt-i" aria-hidden="true"></span><span data-motion-label>Bewegung an</span></button></header>
<main id="main"><div class="deck" data-deck tabindex="0" aria-label="Karten, seitlich wischen oder Pfeiltasten benutzen">${cards.map(card).join('')}</div></main>
<nav class="dock" aria-label="Karten-Navigation">
  <button class="nb" type="button" data-prev aria-label="Vorherige Karte"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
  <ol class="dots">${cards.map((_, i) => `<li><button type="button" data-go="${i}" aria-label="Karte ${i + 1}"><i></i></button></li>`).join('')}</ol>
  <button class="nb" type="button" data-next aria-label="Nächste Karte"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
</nav>`;
  return page({ k: 'k8', title: 'NetzKombyse · Konzept 8 Flaschenpost', desc: 'Konzept 8: Flaschenpost – mobile-first, Karten zum seitlichen Wischen.', theme: '#CDEBF2', body });
}
export const pages = () => ({ 'index.html': index() });
