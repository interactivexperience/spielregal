// Konzept 9 · FUNKSPRUCH – mobile-first als Chat mit Möwe Mia: Antwort-Chips in der Daumenzone führen zu passenden Inhalten.
import { page, logo, esc } from './lib.mjs';
import { C } from '../content.mjs';
import { gull } from './art.mjs';

// Gesprächsskript als Daten; app.js spielt es ab. Jeder Knoten: Nachrichten (bot) + Antwort-Chips (to = nächster Knoten).
const D = C.disziplinen, L = C.lagen;
const feat = C.cases.find(c => c.featured);
const flow = {
  start: { bot: ['Moin! Ich bin Mia, die Möwe vom Funkfeuer der NetzKombyse.', 'Wir bauen digitalen Vertrieb für Mittelständler. Was liegt bei Ihnen gerade im Argen?'],
    chips: [...L.map((l, i) => [l.t, 'lage' + i]), ['Ich schaue nur mal', 'schauen']] },
  ...Object.fromEntries(L.map((l, i) => ['lage' + i, { you: l.t, bot: [l.d, 'Das kennen wir gut. So gehen wir es an:'], card: { t: D[i].t, d: D[i].d }, chips: [['Zeigt mir Arbeiten', 'arbeiten'], ['Wer steckt dahinter?', 'team'], ['Termin vereinbaren', 'termin']] }])),
  schauen: { you: 'Ich schaue nur mal', bot: ['Gern. Hier die Kurzfassung in vier Punkten:'], list: C.saeulen.map(s => [s.t, s.d]), chips: [['Zeigt mir Arbeiten', 'arbeiten'], ['Termin vereinbaren', 'termin']] },
  arbeiten: { you: 'Zeigt mir Arbeiten', bot: [`${C.zahlen.marken} Marken in ${C.zahlen.branchen} Branchen, zum Beispiel:`], cases: C.cases.map(c => [c.t, `${c.typ} · ${c.branche}`]), bot2: [`„${C.stimmen[0].q}“ (${C.stimmen[0].w}, ${C.stimmen[0].f})`], chips: [['Wer steckt dahinter?', 'team'], ['Termin vereinbaren', 'termin']] },
  team: { you: 'Wer steckt dahinter?', bot: [`${C.zahlen.team} Menschen und mehr als ${C.jahre} Jahre Erfahrung. Ihr Ansprechpartner ist ${C.ansprech.name}, ${C.ansprech.rolle}.`, 'Kein Vertriebsfilter: Sie sprechen von der ersten Frage an mit denen, die bauen.'], chips: [['Termin vereinbaren', 'termin'], ['Noch einmal von vorn', 'start']] },
  termin: { you: 'Termin vereinbaren', bot: ['Prima! Suchen Sie sich einen Termin aus oder rufen Sie einfach an.'], acts: true, chips: [['Noch einmal von vorn', 'start']] },
};
const mia = gull('mia');
function index() {
  const body = `<div id="top"></div>
<div class="app">
<header class="bar"><a class="bar-logo" href="index.html" aria-label="NetzKombyse – Startseite">${logo()}</a>
  <p class="who" aria-hidden="true"><span class="av">${mia}</span><span><b>Möwe Mia</b><i>Funkfeuer · online</i></span></p>
  <button class="mt" type="button" data-motion-toggle aria-pressed="true" title="Animationen ein- oder ausschalten"><span class="mt-i" aria-hidden="true"></span><span data-motion-label>Bewegung an</span></button></header>
<main id="main"><div class="log" data-log role="log" aria-live="polite" aria-label="Gespräch mit Möwe Mia"></div>
  <noscript><p class="ns">Dieses Konzept braucht JavaScript. Kontakt: ${C.ansprech.name}, <a href="${C.telHref}">${C.tel}</a>, <a href="${C.termin}">Termin buchen</a>.</p></noscript></main>
<footer class="foot"><div class="chips" data-chips aria-label="Antworten"></div>
  <p class="fine"><a href="#">Impressum</a> · <a href="#">Datenschutz</a> · <a href="../index.html">Konzept wechseln</a></p></footer>
</div>
<template data-mia>${mia}</template>
<script type="application/json" data-flow>${JSON.stringify({ flow, termin: C.termin, tel: C.tel, telHref: C.telHref, hinweis: C.hinweisBeispiel + ' Zitate sinngemäß bzw. Platzhalter.' }).replace(/</g, '\\u003c')}</script>`;
  return page({ k: 'k9', title: 'NetzKombyse · Konzept 9 Funkspruch', desc: 'Konzept 9: Funkspruch – mobile-first als Chat mit Möwe Mia.', theme: '#EAF6F4', body });
}
export const pages = () => ({ 'index.html': index() });
