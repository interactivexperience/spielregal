// Konzept 14 · PILLE – nach Owner-Referenz „Clothy“, Darkmode: Typo als Zentrum des Heros, genau eine Möwe im Hero, Wörter in Pillen, Kapselkarten,
// Projekte mit großer Hover-Vorschau (awwwards-Prinzip), Henning im Kontakt. Inhalte und Links nach netzkombyse.de.
import { page, logo, esc } from './lib.mjs';
import { C } from '../content.mjs';

const W = 'https://netzkombyse.de';
const pad = n => String(n).padStart(2, '0');
const sq = `<svg class="sq" viewBox="0 0 300 12" preserveAspectRatio="none" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M2 6C25 0 40 12 62 6S100 0 124 6S162 12 186 6S224 0 248 6S280 10 298 6"/></svg>`;
const arrow = `<svg viewBox="0 0 60 16" aria-hidden="true"><path d="M2 8h52M46 2l8 6-8 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const blobSvg = `<svg viewBox="0 0 400 360" aria-hidden="true"><path d="M70 60C130 10 250 0 330 50C395 90 400 190 350 250C300 320 170 365 90 320C10 275 -10 120 70 60Z" fill="var(--c)"/></svg>`;
const lagen = [{ n: C.lagen[0], a: [C.saeulen[0], C.saeulen[1]] }, { n: C.lagen[1], a: [C.saeulen[2]] }, { n: C.lagen[2], a: [C.saeulen[3]] }];
// Vorschau-Format je Projekt (nach Bildinhalt): l = quer, q = fast quadratisch, h = hoch
const cases = [
  ['premiumwheels', 'PremiumWheels', 'Internationaler Reifenhandel', 'Mobilität', 'case-premiumwheels', 'l'],
  ['tout', 'Tout Terrain', 'Radmanufaktur für die härtesten Bike-Traveller', 'Outdoor', 'case-tout', 'q'],
  ['weinbauer', 'Wein-Bauer.de', '50 Jahre Multi-Channel Weinhandel', 'Food & Gastronomie', 'case-weinbauer', 'h'],
  ['abelmann', 'Abelmann.de', 'Markenrelaunch Fischmanufaktur', 'Food & Gastronomie', 'case-abelmann', 'l'],
  ['truckline', 'Lightfix · Truck-line', 'Blinded by the Light', 'Mobilität & Handwerk', 'case-truckline', 'q'],
  ['pechkeks', 'PECHKEKS', 'Fiese Kekse', 'Heimtier', 'case-pechkeks', 'h'],
  ['sabro', 'SABRO', 'Premium-Hersteller für Hundesofas', 'Heimtier', 'case-sabro', 'l'],
  ['beisser', 'BEISSER.DE', 'Das Fleisch ist willig', 'Food & Gastronomie', 'case-beisser', 'q'],
];
const hg = `<svg class="hs" viewBox="0 0 400 480" aria-hidden="true"><path d="M30 480c4-96 62-150 170-150s166 54 170 150z" fill="#17120F"/><rect x="170" y="268" width="60" height="70" rx="26" fill="#E9B48F"/><ellipse cx="200" cy="214" rx="66" ry="78" fill="#F1C4A1"/><path d="M128 196c2-60 34-96 72-96s70 36 72 96c-26-18-48-26-72-26s-46 8-72 26z" fill="#FF6B14"/><rect x="124" y="188" width="152" height="26" rx="13" fill="#E55A0B"/><circle cx="200" cy="96" r="20" fill="#FFC93C"/><circle cx="176" cy="226" r="6" fill="#17120F"/><circle cx="224" cy="226" r="6" fill="#17120F"/><path d="M178 258c14 14 30 14 44 0" stroke="#17120F" stroke-width="5" stroke-linecap="round" fill="none"/></svg>`;

function index() {
  const body = `<div id="top"></div><div class="prog" aria-hidden="true"></div>
<header class="hd"><div class="hd-in">
  <a class="hd-logo" href="index.html" aria-label="NetzKombyse – Startseite">${logo()}</a>
  <nav class="hd-nav" aria-label="Hauptnavigation"><a href="#leistung">Leistung</a><a href="#lage">Lage</a><a href="#arbeit">Arbeit</a><a href="#stimmen">Stimmen</a><a href="#kontakt">Kontakt</a></nav>
  <div class="hd-r"><a class="cart" href="${C.termin}" target="_blank" rel="noopener" data-mag>Termin <b>1</b></a><button class="mt" type="button" data-motion-toggle aria-pressed="true" title="Animationen ein- oder ausschalten"><span class="mt-i" aria-hidden="true"></span><span data-motion-label>Bewegung an</span></button></div>
</div></header>
<main id="main">
<section class="hero" aria-labelledby="h1">
  <div class="meta"><span class="tag"><b>01</b></span><span class="tag">Shopware & E-Commerce Agentur</span><span class="tag mr">Hamburg · ${C.jahre}+ Jahre</span></div>
  <h1 id="h1" aria-label="Wir bauen Shops, die sich rechnen"><span class="r"><span class="pill" data-reveal>Wir bauen</span></span><span class="r"><span class="word" data-reveal style="--d:80ms">Shops</span> <span class="chip" data-reveal style="--d:120ms">${arrow}</span></span><span class="r"><span class="pill" data-reveal style="--d:200ms">die sich</span> <span class="word" data-reveal style="--d:260ms">rechnen</span>${sq}</span></h1>
  <div class="hero-b">
    <p class="lead" data-reveal>Digitaler Vertrieb für Mittelständler: Shopware & Shopify, Marke und Marketing aus einer Hand, mit festen Ansprechpartnern.</p>
    <p class="acts" data-reveal><a class="btn" href="${C.termin}" target="_blank" rel="noopener" data-mag>Termin buchen</a><a class="more" href="#leistung">Mehr lesen ↗</a></p>
  </div>
  <div class="hg" aria-hidden="true"><img class="g" src="../media/moewe-hero.webp" alt="" width="832" height="1232" decoding="async"></div>
</section>

<p class="mq" aria-label="Kunden"><span class="mq-t">${[...C.marken, ...C.marken].map(m => `<span>${esc(m)}</span><i aria-hidden="true">✦</i>`).join('')}</span></p>

<section class="sec" id="leistung"><div class="wr"><p class="tag" data-reveal><b>02</b> Leistung</p><h2 data-reveal>Drei <span class="pill">Disziplinen</span>, ein Ziel.</h2>
  <ol class="caps">${[
    ['Technologie & Shop', 'Shopware und Shopify für B2B, B2C und Headless: Systeme, die in fünf Jahren noch tragen.', 'e-commerce', ['Shopware', 'Shopify', 'Headless', 'Migration', 'ERP · PIM · CRM']],
    ['Kommunikation & Marke', 'Markenstrategie, Design und Inhalte: ein Gesicht über alle Kanäle.', 'brand-ux-ui', ['Positionierung', 'Corporate Design', 'UX / UI', 'Content']],
    ['Marketing & Performance', 'Sichtbarkeit, gemessen an Umsatz und nicht an Klicks.', 'marketing', ['SEO', 'AI-Sichtbarkeit', 'Google Ads', 'Newsletter', 'Tracking']],
  ].map(([t, d, u, ch], i) => `<li class="c${i + 1}" style="--i:${i}"><a href="${W}/${u}" target="_blank" rel="noopener"><span class="cn" aria-hidden="true">${pad(i + 1)}</span><h3>${esc(t)}</h3><p>${esc(d)}</p><span class="chs">${ch.map(x => `<span class="pill">${esc(x)}</span>`).join('')}</span><span class="go" aria-hidden="true">${arrow}</span></a></li>`).join('')}</ol></div></section>

<section class="sec sec-l" id="lage"><div class="wr"><p class="tag" data-reveal><b>03</b> Ausgangslage</p><h2 data-reveal>Von Ihrer <span class="pill">Lage</span> zu unserem Plan.</h2>
  <ol class="pairs">${lagen.map((l, i) => `<li data-reveal style="--d:${i * 100}ms"><div class="pl"><span class="big" aria-hidden="true">${pad(i + 1)}</span><div><p class="lab">Ihre Lage</p><h3>${esc(l.n.t)}</h3><p>${esc(l.n.d)}</p></div></div><span class="px" aria-hidden="true">${arrow}</span><div class="pa"><p class="lab">Unsere Antwort</p>${l.a.map(a => `<div><b>${esc(a.t)}</b><span>${esc(a.d)}</span></div>`).join('')}</div></li>`).join('')}</ol></div></section>

<section class="sec" id="arbeit"><div class="wr"><p class="tag" data-reveal><b>04</b> Arbeit</p><h2 data-reveal>Ausgewählte <span class="pill">Projekte</span>.</h2>
  <ul class="work" data-work>${cases.map(([f, t, d, b, u]) => `<li data-reveal><a href="${W}/${u}" target="_blank" rel="noopener" data-src="../media/cases/${f}.jpg" aria-label="${esc(t)}: ${esc(d)}"><b>${esc(t)}</b><span class="d">${esc(d)}</span><span class="br">${esc(b)}</span><i class="wi" aria-hidden="true">${arrow}</i><img class="th" src="../media/cases/${f}.jpg" alt="" width="1024" height="675" loading="lazy" decoding="async"></a></li>`).join('')}</ul>
  <p class="all" data-reveal><a class="btn btn-o" href="${W}/references" target="_blank" rel="noopener">Alle Referenzen ↗</a></p></div>
  <div class="pv" aria-hidden="true"><img alt="" width="1024" height="675"></div><span class="pc" aria-hidden="true">${arrow}</span></section>

<section class="sec sec-s" id="stimmen"><div class="wr vx"><div class="vx-h"><p class="tag" data-reveal><b>05</b> Stimmen</p><h2 data-reveal>Was <span class="pill">Kunden</span> sagen.</h2>
  <p class="rate" data-reveal><b>4,8</b><span>von 5 · 11 Google-Bewertungen</span><a href="https://www.google.com/maps/search/?api=1&query=NetzKombyse&query_place_id=ChIJP2GS276FsUcRbSWqjQ9NfAE" target="_blank" rel="noopener">Bewertungen lesen ↗</a></p></div>
  <div class="vox"><div class="vq-w">${C.stimmen.map((s, i) => `<figure class="vq${i === 0 ? ' on' : ''}" data-i="${i}"><blockquote>${s.q.split(' ').map((w, j) => `<span style="--w:${j}">${esc(w)}</span>`).join(' ')}</blockquote><figcaption><b>${esc(s.w)}</b><i>${esc(s.f)}${s.hinweis ? ` (${esc(s.hinweis)})` : ''}</i></figcaption></figure>`).join('')}</div>
    <div class="vsel" role="tablist" aria-label="Stimme wählen">${C.stimmen.map((s, i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-i="${i}"><span class="av" aria-hidden="true">${esc((w => (w[0][0] + w[w.length - 1][0]))(s.w.split(' ').filter(x => /^[A-ZÄÖÜ]/.test(x) && !x.endsWith('.'))))}</span><span><b>${esc(s.w)}</b><i>${esc(s.f)}</i></span></button>`).join('')}</div></div></div></section>

<section class="sec" id="kontakt"><div class="wr ct"><div class="ct-t"><p class="tag" data-reveal><b>06</b> Kontakt</p><h2 data-reveal>Reden wir <span class="pill">persönlich</span>.</h2>
  <p class="lead" data-reveal>${C.ansprech.name}, ${C.ansprech.rolle}, ist Ihr Ansprechpartner von der ersten Frage an, ohne Account-Manager dazwischen.</p>
  <p class="acts" data-reveal><a class="btn" href="${C.termin}" target="_blank" rel="noopener" data-mag>Termin buchen</a></p>
  <ul class="cl" data-reveal><li><a href="${C.telHref}">${C.tel}</a></li><li><a href="mailto:ahoi@netzkombyse.de">ahoi@netzkombyse.de</a></li><li>${C.adresse[0]}, 22765 ${C.adresse[1]} · <a href="https://maps.google.com/?q=Harkortstraße+81,+22765+Hamburg" target="_blank" rel="noopener">Route ↗</a></li></ul></div>
  <figure class="hen" data-reveal><img src="../media/henning.webp" alt="Henning Groß, Geschäftsführer" width="928" height="1152" loading="lazy" decoding="async"><figcaption>${C.ansprech.name}<span>${C.ansprech.rolle}</span></figcaption></figure></div></section>
</main>
<footer class="ft"><a class="ft-logo" href="index.html" aria-label="Startseite">${logo()}</a>
  <nav aria-label="Rechtliches"><a href="${W}/impressum" target="_blank" rel="noopener">Impressum</a><a href="${W}/datenschutz" target="_blank" rel="noopener">Datenschutz</a><a href="../index.html">Konzepte</a><a href="#top">Nach oben ↑</a></nav>
  <p class="ft-n">© NetzKombyse GmbH · Hamburg · Beispielwerte und Zitate sind Platzhalter.</p></footer>`;
  return page({ k: 'k14', title: 'NetzKombyse · Konzept 14 Pille', desc: 'Konzept 14: Pille – Darkmode, Typo im Zentrum, Projekt-Vorschau beim Hover, Henning im Kontakt.', theme: '#000000', body });
}
export const pages = () => ({ 'index.html': index() });
