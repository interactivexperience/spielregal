// Konzept 7 · SEEMANNSGARN – mobile-first im Stories-Format: Vollbild-Karten, Antippen rechts/links, Fortschrittsbalken, Daumenzone unten.
import { page, logo, esc } from './lib.mjs';
import { C } from '../content.mjs';
import { gull, fisch, korb, sonne, turm, wolke } from './art.mjs';

const ink = '#10263A';
const st = (o) => ({ fg: ink, dur: 8, ...o });
const S = [
  st({ bg: '#2E6BF0', fg: '#fff', art: gull('ga'), k: 'Digitaler Commerce · Hamburg', h: 'Moin. Wir sind NetzKombyse.', p: 'Wir bauen Shops und Systeme für Mittelständler. Tippen Sie rechts, wenn es weitergehen soll.', dur: 7 }),
  ...C.lagen.map((l, i) => st({ bg: ['#FFD84A', '#FF5A45', '#7BDCC4'][i], fg: i === 1 ? '#fff' : ink, art: [fisch('ga'), korb('#2E6BF0', 'ga'), sonne('ga')][i], k: `Ausgangslage ${i + 1} von 3`, h: l.t, p: l.d, dur: 7 })),
  st({ bg: '#1A2B5F', fg: '#fff', art: turm('ga'), k: 'Unsere Disziplinen', h: 'Drei Disziplinen, ein Ziel.', list: C.disziplinen.map(d => [d.t, d.d]), dur: 10 }),
  st({ bg: '#F4EDE0', k: 'Vier Säulen', h: 'Darauf bauen wir.', list: C.saeulen.map(s => [s.t, s.d]), art: wolke('ga'), dur: 11 }),
  st({ bg: '#FF9F6E', k: 'Zahlen aus 15+ Jahren', h: 'Wir bleiben.', nums: [[C.zahlen.marken, 'Marken'], [C.zahlen.branchen, 'Branchen'], [C.jahre + '+', 'Jahre'], [C.zahlen.team, 'Menschen']], dur: 7 }),
  st({ bg: '#0B2540', fg: '#EFE6D2', k: 'Referenzen', h: 'Hier sind wir eingelaufen.', chips: C.marken, art: gull('ga'), dur: 8 }),
  st({ bg: '#BCD9EA', k: 'Kundenstimme', h: '', quote: C.stimmen[0], dur: 8 }),
  st({ bg: '#FFD84A', k: `${C.ansprech.name}, ${C.ansprech.rolle}`, h: 'Reden wir. Persönlich.', p: 'Von der ersten Frage an direkt bei uns, ohne Vertriebsfilter.', last: true }),
];
const seg = S.map((s, i) => `<i class="seg" style="--dur:${s.dur}s"><b></b></i>`).join('');
const card = (s, i) => `<section class="story${i === 0 ? ' on' : ''}" data-i="${i}" style="--bg:${s.bg};--fg:${s.fg}" aria-label="Seite ${i + 1} von ${S.length}" ${i ? 'aria-hidden="true" inert' : ''}>
  ${s.art ? `<div class="art" aria-hidden="true">${s.art}</div>` : ''}
  <div class="txt"><p class="k">${esc(s.k)}</p>${s.h ? `<h2>${esc(s.h)}</h2>` : ''}${s.p ? `<p class="p">${esc(s.p)}</p>` : ''}
  ${s.list ? `<ul class="li">${s.list.map(([t, d]) => `<li><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join('')}</ul>` : ''}
  ${s.nums ? `<ul class="nums">${s.nums.map(([n, l]) => `<li><b>${n}</b><span>${l}</span></li>`).join('')}</ul>` : ''}
  ${s.chips ? `<ul class="chips">${s.chips.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
  ${s.quote ? `<blockquote>${esc(s.quote.q)}</blockquote><p class="who">${esc(s.quote.w)}, ${esc(s.quote.f)}</p>` : ''}
  ${s.last ? `<p class="acts"><a class="btn btn-p" href="${C.termin}">Termin buchen</a><a class="btn btn-s" href="${C.telHref}">${C.tel}</a></p>
  <p class="fine"><a href="#">Impressum</a> · <a href="#">Datenschutz</a> · <a href="../index.html">Konzept wechseln</a> · <button type="button" data-restart>Von vorn</button></p><p class="fine">${C.hinweisBeispiel} Zitate sinngemäß bzw. Platzhalter.</p>` : ''}</div>
</section>`;

function index() {
  const body = `<div id="top"></div>
<main id="main" class="app" data-stories aria-label="Seemannsgarn, Geschichten von NetzKombyse">
  <div class="bars" aria-hidden="true">${seg}</div>
  <header class="bar"><a class="bar-logo" href="index.html" aria-label="NetzKombyse – Startseite">${logo()}</a>
    <button class="mt" type="button" data-motion-toggle aria-pressed="true" title="Animationen ein- oder ausschalten"><span class="mt-i" aria-hidden="true"></span><span data-motion-label>Bewegung an</span></button></header>
  <button class="tz tz-l" type="button" data-prev aria-label="Zurück"></button><button class="tz tz-r" type="button" data-next aria-label="Weiter"></button>
  ${S.map(card).join('')}
  <nav class="dock" aria-label="Navigation"><button class="nb" type="button" data-prev aria-label="Zurück"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    <a class="btn btn-p dock-cta" href="${C.termin}">Termin buchen</a>
    <button class="nb" type="button" data-next aria-label="Weiter"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></button></nav>
  <p class="count" aria-live="polite"><span data-cur>1</span>/${S.length}</p>
</main>`;
  return page({ k: 'k7', title: 'NetzKombyse · Konzept 7 Seemannsgarn', desc: 'Konzept 7: Seemannsgarn – mobile-first im Stories-Format.', theme: '#2E6BF0', body });
}
export const pages = () => ({ 'index.html': index() });
