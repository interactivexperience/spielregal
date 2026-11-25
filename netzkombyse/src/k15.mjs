// Konzept 15 · GLUT – nach Owner-Referenz „Kontour“: Schwarz, Orange-Verlaufsnebel, Montserrat, Riesenwort hinter dem Motiv (Möwe im Studiolicht, mit Recraft erzeugt),
// Akkordeon-Leistungen, Lage-Karten mit zugehöriger Antwort, Projekt-Raster mit den Figma-Bildern. Inhalte und Links von netzkombyse.de (Stand Nov. 2026).
import { page, logo, esc } from './lib.mjs';
import { C } from '../content.mjs';

const W = 'https://netzkombyse.de';
const pad = n => String(n).padStart(2, '0');
const ar = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9l6-6M4 3h5v5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ext = (h) => (h.startsWith('http') ? ' target="_blank" rel="noopener"' : '');
const btn = (href, t, cls = '') => `<a class="pillb ${cls}" href="${href}"${ext(href)}><span>${t}</span><i aria-hidden="true">${ar}</i></a>`;

const leist = [
  { t: 'Technologie & Shop', s: 'Shopware, Shopify und die Systeme dahinter.', href: `${W}/e-commerce`, items: ['Shopware & Shopify für B2B, B2C und Headless', 'Migration von Shopware 5, WooCommerce, OXID und Magento', 'ERP-, PIM- und CRM-Anbindung', 'KI-gestützte Suche und Prozessautomation', 'Barrierefreiheit nach WCAG und BFSG'] },
  { t: 'Kommunikation & Marke', s: 'Marke, Design und Inhalte aus einem Guss.', href: `${W}/brand-ux-ui`, items: ['Positionierung und Markenstrategie', 'Corporate Design und UX/UI-Design', 'Wording und Brand Voice', 'Video, Foto und Social Content'] },
  { t: 'Marketing & Performance', s: 'Sichtbarkeit, die sich rechnet.', href: `${W}/marketing`, items: ['Google Ads und META, gesteuert auf ROAS', 'Newsletter und E-Mail-Automation', 'SEO und AI-Sichtbarkeit', 'Tracking und Analytics mit GA4, GTM und Matomo'] },
];
const gefragt = [['Shopware-Migration', `${W}/shopware-migration`], ['SEO & AI-Sichtbarkeit', `${W}/seo-agentur-hamburg`], ['Barrierefreiheit', `${W}/barrierefreiheit`]];
// Lage-Karte und die dazugehörige Antwort (Säule) stehen zusammen in einer Karte
const lagen = [
  { n: C.lagen[0], a: [C.saeulen[0], C.saeulen[1]] },
  { n: C.lagen[1], a: [C.saeulen[2]] },
  { n: C.lagen[2], a: [C.saeulen[3]] },
];
const cases = [
  ['premiumwheels', 'PremiumWheels', 'Internationaler Reifenhandel', 'Mobilität', 'case-premiumwheels'],
  ['tout', 'Tout Terrain', 'Radmanufaktur für die härtesten Bike-Traveller', 'Outdoor', 'case-tout'],
  ['weinbauer', 'Wein-Bauer.de', '50 Jahre Multi-Channel Weinhandel', 'Food & Gastronomie', 'case-weinbauer'],
  ['abelmann', 'Abelmann.de', 'Markenrelaunch Fischmanufaktur', 'Food & Gastronomie', 'case-abelmann'],
  ['truckline', 'Lightfix · Truck-line', 'Blinded by the Light', 'Mobilität & Handwerk', 'case-truckline'],
  ['pechkeks', 'PECHKEKS', 'Fiese Kekse', 'Heimtier', 'case-pechkeks'],
  ['sabro', 'SABRO', 'Premium-Hersteller für Hundesofas', 'Heimtier', 'case-sabro'],
  ['beisser', 'BEISSER.DE', 'Das Fleisch ist willig', 'Food & Gastronomie', 'case-beisser'],
];

// Projektwand: [Projekt-Index, Breite, Höhe, x, y, Tiefe, Bildausschnitt]. Bilder sind die Figma-Exporte, bis eigene Motive vorliegen.
const wallTiles = [
  [2, 520, 360, 120, 90, 1.15, '50% 40%'], [0, 380, 520, 700, 40, .85, '40% 50%'], [5, 440, 300, 1130, 150, 1.2, '50% 60%'], [1, 560, 380, 1620, 60, .9, '30% 50%'], [7, 380, 380, 2180, 130, 1.1, '60% 50%'],
  [3, 400, 280, 60, 560, .9, '20% 50%'], [4, 560, 400, 520, 520, 1.1, '50% 30%'], [6, 360, 500, 1140, 560, .8, '70% 50%'], [0, 520, 340, 1540, 600, 1.2, '50% 70%'], [2, 360, 260, 2100, 600, .95, '80% 30%'],
  [5, 420, 300, 140, 960, 1.05, '50% 20%'], [7, 520, 360, 720, 1000, .9, '40% 40%'],
];
function index() {
  const body = `<div id="top"></div>
<header class="hd"><a class="hd-logo" href="index.html" aria-label="NetzKombyse – Startseite">${logo()}</a>
  <nav class="hd-nav" aria-label="Hauptnavigation"><a href="#leistung">Leistungen</a><a href="#haltung">Haltung</a><a href="#arbeit">Referenzen</a><a href="${W}/ueber-uns" target="_blank" rel="noopener">Über uns</a><a href="#kontakt">Kontakt</a></nav>
  <button class="mt" type="button" data-motion-toggle aria-pressed="true" title="Animationen ein- oder ausschalten"><span class="mt-i" aria-hidden="true"></span><span data-motion-label>Bewegung an</span></button></header>
<main id="main">
<section class="hero" aria-labelledby="h1">
  <div class="glow" aria-hidden="true"></div>
  <p class="k" data-reveal>Shopware & E-Commerce Agentur · Hamburg</p>
  <h1 id="h1" data-reveal>Machen.<br>Nicht Möwen<br>zählen.</h1>
  <p class="s" data-reveal>Ihr Onlineshop, Ihr Marketing, Ihre Strategie in erfahrenen Händen. Wir übernehmen die volle Verantwortung für Ihre digitale Wertschöpfungskette.</p>
  <p class="ctas" data-reveal>${btn(C.termin, 'Termin buchen')}${btn('#arbeit', 'Referenzen ansehen', 'ghost')}</p>
  <div class="gwrap" aria-hidden="true"><img class="g" src="../media/moewe-hero.webp" alt="" width="832" height="1232" decoding="async"></div>
  <p class="big" aria-hidden="true">NETZKOMBYSE</p>
</section>

<section class="facts" aria-label="Zahlen"><ul>
  <li data-reveal><strong data-count="${C.jahre}" data-suffix="+">${C.jahre}+</strong><span>Jahre E-Commerce-Expertise</span></li>
  <li data-reveal style="--d:80ms"><strong data-count="14">14</strong><span>Jahre längste Kundenbeziehung</span></li>
  <li data-reveal style="--d:160ms"><strong data-count="5">5</strong><span>Tage bis zum Onboarding</span></li>
  <li data-reveal style="--d:240ms"><strong data-count="1">1</strong><span>Tag bis zum ersten Lead</span></li></ul>
  <p class="badges" data-reveal><span>Umsetzung mit Shopware & Shopify</span><span>Akkreditierter Förderpartner für Bundesmittel</span><a href="${W}/foerdermittel" target="_blank" rel="noopener">Zuschüsse bis zu 80 % möglich ↗</a></p></section>

<section class="sec" id="leistung"><div class="wr"><div class="two"><h2 data-reveal>DREI DISZIPLINEN. EIN VORGEHEN.</h2><p class="side" data-reveal>Technologie, Marke und Marketing aus einer Hand, von Menschen, die bleiben, wenn die Flaute kommt.</p></div>
  <ol class="acc">${leist.map((d, i) => `<li class="${i === 0 ? 'open' : ''}" data-reveal style="--d:${i * 90}ms"><button type="button" aria-expanded="${i === 0}" aria-controls="p${i}"><span class="n">${pad(i + 1)}</span><b>${esc(d.t)}</b><span class="sd">${esc(d.s)}</span><i class="ar" aria-hidden="true">${ar}</i></button><div id="p${i}" class="pn" ${i === 0 ? '' : 'hidden'}><ul>${d.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul><a class="more" href="${d.href}" target="_blank" rel="noopener">Mehr zu ${esc(d.t)} ↗</a></div></li>`).join('')}</ol>
  <p class="now" data-reveal><span>Aktuell gefragt</span>${gefragt.map(([t, h]) => `<a href="${h}" target="_blank" rel="noopener">${t} ↗</a>`).join('')}</p></div></section>

<section class="sec fog" id="haltung"><div class="wr"><div class="head2"><p class="k">Ausgangslage</p><h2 data-reveal>WIR FORMEN AUS IHRER LAGE EINEN PLAN.</h2></div>
  <div class="cards">${lagen.map((l, i) => `<div class="cd ${i === 1 ? 'cw' : ''}" data-reveal style="--d:${i * 110}ms"><button type="button" class="flip" aria-pressed="false" aria-label="${esc(l.n.t)}: Karte drehen und mehr lesen"><span class="face fr"><strong>${pad(i + 1)}</strong><h3>${esc(l.n.t)}</h3><span class="hint">Mehr zeigen <i aria-hidden="true">${ar}</i></span></span><span class="face bk"><span class="lab">Die Lage</span><span class="tx">${esc(l.n.d)}</span><span class="lab">Unsere Antwort</span>${l.a.map(a => `<span class="an"><b>${esc(a.t)}</b><span>${esc(a.d)}</span></span>`).join('')}</span></button></div>`).join('')}</div></div></section>

<section class="sec" id="arbeit"><div class="wr"><div class="two"><h2 data-reveal>PROJEKTE, DIE BLEIBEN.</h2><p class="side" data-reveal>Vom Ein-Frau-Startup bis zum international aufgestellten Mittelstand. Eine Auswahl aus über 40 Projekten.</p></div>
  <div class="tabs" role="tablist" aria-label="Ansicht der Projekte"><button type="button" role="tab" aria-selected="true" data-tab="cf">Karussell</button><button type="button" role="tab" aria-selected="false" data-tab="wall">Wand</button><span class="tabs-h">Wand: ziehen und entdecken</span></div>
  <div class="gal" data-gal="cf"><div class="cf" data-cf role="region" aria-roledescription="Karussell" aria-label="Projekte, mit Pfeiltasten oder Wischen blättern">
    <ul class="cf-s">${cases.map(([f, t, d, b, u], i) => `<li class="cf-c" data-i="${i}"><a href="${W}/${u}" target="_blank" rel="noopener" aria-label="${esc(t)}: ${esc(d)}"><img src="../media/cases/${f}.jpg" alt="Projektbilder ${esc(t)}" width="1024" height="675" ${i < 3 ? '' : 'loading="lazy"'} decoding="async" draggable="false"><i class="sh" aria-hidden="true"></i></a></li>`).join('')}</ul>
    <div class="cf-i" aria-live="polite"><p class="cf-n"><b data-cur>01</b> / ${pad(cases.length)}</p><h3 data-t></h3><p class="cf-d" data-d></p><p class="cf-b" data-b></p><a class="pillb" data-l href="${W}/references" target="_blank" rel="noopener"><span>Projekt ansehen</span><i aria-hidden="true">${ar}</i></a></div>
    <div class="cf-ctl"><button type="button" data-prev aria-label="Vorheriges Projekt"><svg viewBox="0 0 60 16" aria-hidden="true"><path d="M58 8H6M14 2L6 8l8 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button><span class="cf-bar" aria-hidden="true"><i></i></span><button type="button" data-next aria-label="Nächstes Projekt"><svg viewBox="0 0 60 16" aria-hidden="true"><path d="M2 8h52M46 2l8 6-8 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
    <script type="application/json" data-meta>${JSON.stringify(cases.map(([f, t, d, b, u]) => ({ t, d, b, h: `${W}/${u}` })))}</script></div></div>
  <div class="gal" data-gal="wall" hidden><div class="wall" data-wall role="region" aria-label="Projektwand, ziehen zum Verschieben"><div class="wall-in">${wallTiles.map(([c, w, h, x, y, z, pos], i) => `<a class="wt" href="${W}/${cases[c][4]}" target="_blank" rel="noopener" data-z="${z}" style="--w:${w}px;--h:${h}px;left:${x}px;top:${y}px;--i:${i}" aria-label="${esc(cases[c][1])}: ${esc(cases[c][2])}"><img src="../media/cases/${cases[c][0]}.jpg" alt="" style="object-position:${pos}" width="1024" height="675" loading="lazy" draggable="false"><span class="wc"><b>${esc(cases[c][1])}</b><em>${esc(cases[c][3])}</em></span></a>`).join('')}</div><p class="wall-h" aria-hidden="true">← ziehen →</p></div></div>
  <p class="all" data-reveal>${btn(`${W}/references`, 'Alle Referenzen')}</p>
  </div></section>

<section class="sec vs" id="stimmen" aria-label="Was Kunden sagen"><div class="wr"><p class="k">Stimmen</p>
  <div class="vs-g" data-voices>
    <div class="vs-st" aria-hidden="true">${C.stimmen.map((s, i) => `<div class="vp" data-i="${i}"><span class="ph"><svg viewBox="0 0 100 120"><circle cx="50" cy="42" r="21"/><path d="M8 120c2-30 20-44 42-44s40 14 42 44z"/></svg></span><b>${esc(s.w.split(' ').filter(w => /^[A-ZÄÖÜ]/.test(w) && !w.endsWith('.')).map(w => w[0]).join('').slice(0, 2))}</b><em>${esc(s.f)}</em></div>`).join('')}</div>
    <div class="vs-tx"><div class="vq-w">${C.stimmen.map((s, i) => `<figure class="vq${i === 0 ? ' on' : ''}" data-i="${i}"><blockquote>${s.q.split(' ').map((w, j) => `<span style="--w:${j}">${esc(w)}</span>`).join(' ')}</blockquote><figcaption><b>${esc(s.w)}</b>${esc(s.f)}${s.hinweis ? ` · ${esc(s.hinweis)}` : ''}</figcaption></figure>`).join('')}</div>
    <div class="vs-n" role="tablist" aria-label="Stimme wählen">${C.stimmen.map((s, i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-i="${i}"><i></i><span>${esc(s.w)}</span></button>`).join('')}</div></div></div>
  <p class="rate" data-reveal><b>4,8</b> von 5 · 11 Google-Bewertungen · <a href="https://www.google.com/maps/search/?api=1&query=NetzKombyse&query_place_id=ChIJP2GS276FsUcRbSWqjQ9NfAE" target="_blank" rel="noopener">lesen ↗</a><span class="aw">${C.awards.join(' · ')}</span></p></div></section>

<section class="sec end" id="kontakt"><div class="glow g2" aria-hidden="true"></div><div class="wr ctw"><div class="ctx"><p class="k">Kontakt</p><h2 class="b" data-reveal>REDEN WIR.<br>PERSÖNLICH.</h2><p class="s" data-reveal>${C.ansprech.name}, ${C.ansprech.rolle}, ist Ihr Ansprechpartner von der ersten Frage an. Keine Account-Manager dazwischen.</p>
  <p class="ctas" data-reveal>${btn(C.termin, 'Termin buchen')}</p>
  <ul class="cl" data-reveal><li><a href="${C.telHref}">${C.tel}</a></li><li><a href="mailto:ahoi@netzkombyse.de">ahoi@netzkombyse.de</a></li><li>${C.adresse[0]}, 22765 ${C.adresse[1]} · <a href="https://maps.google.com/?q=Harkortstraße+81,+22765+Hamburg" target="_blank" rel="noopener">Route ↗</a></li></ul></div>
  <figure class="gk" data-reveal><img class="g" src="../media/henning.webp" alt="Henning Groß, Geschäftsführer (Platzhalterbild)" width="912" height="1140" loading="lazy" decoding="async"><figcaption>${C.ansprech.name}<span>${C.ansprech.rolle}</span></figcaption></figure></div></section>
</main>
<footer class="ft"><a class="ft-logo" href="index.html" aria-label="Startseite">${logo()}</a>
  <nav aria-label="Rechtliches"><a href="${W}/impressum" target="_blank" rel="noopener">Impressum</a><a href="${W}/datenschutz" target="_blank" rel="noopener">Datenschutz</a><a href="../index.html">Konzepte</a><a href="#top">Nach oben ↑</a></nav>
  <p class="ft-n">© NetzKombyse GmbH · Hamburg · Beispielwerte und Zitate sind Platzhalter, Bilder von Henning und den Stimmen werden ersetzt.</p></footer>`;
  return page({ k: 'k15', title: 'NetzKombyse · Konzept 15 Glut', desc: 'Konzept 15: Glut – Schwarz mit Orange-Verlauf, Riesenwort hinter der Möwe, Projekte als Bildraster.', theme: '#000000', body });
}
export const pages = () => ({ 'index.html': index() });
