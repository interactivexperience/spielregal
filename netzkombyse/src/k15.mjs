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
  { t: 'Technologie & Shop', href: `${W}/e-commerce`, items: ['Shopware & Shopify für B2B, B2C und Headless', 'Migration von Shopware 5, WooCommerce, OXID und Magento', 'ERP-, PIM- und CRM-Anbindung', 'KI-gestützte Suche und Prozessautomation', 'Barrierefreiheit nach WCAG und BFSG'] },
  { t: 'Kommunikation & Marke', href: `${W}/brand-ux-ui`, items: ['Positionierung und Markenstrategie', 'Corporate Design und UX/UI-Design', 'Wording und Brand Voice', 'Video, Foto und Social Content'] },
  { t: 'Marketing & Performance', href: `${W}/marketing`, items: ['Google Ads und META, gesteuert auf ROAS', 'Newsletter und E-Mail-Automation', 'SEO und AI-Sichtbarkeit', 'Tracking und Analytics mit GA4, GTM und Matomo'] },
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
  <ol class="acc">${leist.map((d, i) => `<li class="${i === 0 ? 'open' : ''}" data-reveal><button type="button" aria-expanded="${i === 0}" aria-controls="p${i}"><span class="n">[${pad(i + 1)}]</span><b>${esc(d.t).toUpperCase()}</b><i class="ar" aria-hidden="true">${ar}</i></button><div id="p${i}" class="pn" ${i === 0 ? '' : 'hidden'}><ul>${d.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul><a class="more" href="${d.href}" target="_blank" rel="noopener">Mehr zu ${esc(d.t)} ↗</a></div></li>`).join('')}</ol>
  <p class="now" data-reveal><span>Aktuell gefragt</span>${gefragt.map(([t, h]) => `<a href="${h}" target="_blank" rel="noopener">${t} ↗</a>`).join('')}</p></div></section>

<section class="sec fog" id="haltung"><div class="wr"><div class="head2"><p class="k">Ausgangslage</p><h2 data-reveal>WIR FORMEN AUS IHRER LAGE EINEN PLAN.</h2></div>
  <div class="cards">${lagen.map((l, i) => `<article class="cd ${i === 1 ? 'cw' : ''}" data-reveal style="--d:${i * 110}ms"><strong>${pad(i + 1)}</strong><h3>${esc(l.n.t)}</h3><p>${esc(l.n.d)}</p>
    <div class="ans"><span class="lab">Unsere Antwort</span>${l.a.map(a => `<div><b>${esc(a.t)}</b><p>${esc(a.d)}</p></div>`).join('')}</div></article>`).join('')}</div></div></section>

<section class="sec" id="arbeit"><div class="wr"><div class="two"><h2 data-reveal>PROJEKTE, DIE BLEIBEN.</h2><p class="side" data-reveal>Vom Ein-Frau-Startup bis zum international aufgestellten Mittelstand. Eine Auswahl aus über 40 Projekten.</p></div>
  <div class="cf" data-cf role="region" aria-roledescription="Karussell" aria-label="Projekte, mit Pfeiltasten oder Wischen blättern">
    <ul class="cf-s">${cases.map(([f, t, d, b, u], i) => `<li class="cf-c" data-i="${i}"><a href="${W}/${u}" target="_blank" rel="noopener" aria-label="${esc(t)}: ${esc(d)}"><img src="../media/cases/${f}.jpg" alt="Projektbilder ${esc(t)}" width="1024" height="675" ${i < 3 ? '' : 'loading="lazy"'} decoding="async" draggable="false"><i class="sh" aria-hidden="true"></i></a></li>`).join('')}</ul>
    <div class="cf-i" aria-live="polite"><p class="cf-n"><b data-cur>01</b> / ${pad(cases.length)}</p><h3 data-t></h3><p class="cf-d" data-d></p><p class="cf-b" data-b></p><a class="pillb" data-l href="${W}/references" target="_blank" rel="noopener"><span>Projekt ansehen</span><i aria-hidden="true">${ar}</i></a></div>
    <div class="cf-ctl"><button type="button" data-prev aria-label="Vorheriges Projekt"><svg viewBox="0 0 60 16" aria-hidden="true"><path d="M58 8H6M14 2L6 8l8 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button><span class="cf-bar" aria-hidden="true"><i></i></span><button type="button" data-next aria-label="Nächstes Projekt"><svg viewBox="0 0 60 16" aria-hidden="true"><path d="M2 8h52M46 2l8 6-8 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
    <script type="application/json" data-meta>${JSON.stringify(cases.map(([f, t, d, b, u]) => ({ t, d, b, h: `${W}/${u}` })))}</script></div>
  <p class="all" data-reveal>${btn(`${W}/references`, 'Alle Referenzen')}</p>
  <div class="sm">${C.stimmen.map((s, i) => `<figure data-reveal style="--d:${i * 90}ms"><blockquote>${esc(s.q)}</blockquote><figcaption>${esc(s.w)}, ${esc(s.f)}${s.hinweis ? ` (${esc(s.hinweis)})` : ''}</figcaption></figure>`).join('')}</div>
  <p class="rate" data-reveal><b>4,8</b> von 5 · 11 Google-Bewertungen · <a href="https://www.google.com/maps/search/?api=1&query=NetzKombyse&query_place_id=ChIJP2GS276FsUcRbSWqjQ9NfAE" target="_blank" rel="noopener">Bewertungen lesen ↗</a></p>
  <p class="awards" data-reveal aria-label="Auszeichnungen">${C.awards.map(a => `<span>${esc(a)}</span>`).join('')}</p></div></section>

<section class="sec end" id="kontakt"><div class="glow g2" aria-hidden="true"></div><div class="wr ctw"><div class="ctx"><p class="k">Kontakt</p><h2 class="b" data-reveal>MOIN!<br>REDEN WIR.<br>PERSÖNLICH.</h2><p class="s" data-reveal>${C.ansprech.name}, ${C.ansprech.rolle}, ist Ihr Ansprechpartner von der ersten Frage an. Keine Account-Manager dazwischen.</p>
  <p class="ctas" data-reveal>${btn(C.termin, 'Termin buchen')}${btn(C.telHref, C.tel, 'ghost')}${btn('mailto:ahoi@netzkombyse.de', 'ahoi@netzkombyse.de', 'ghost')}</p>
  <p class="adr" data-reveal>${C.adresse[0]}, 22765 ${C.adresse[1]} · <a href="https://maps.google.com/?q=Harkortstraße+81,+22765+Hamburg" target="_blank" rel="noopener">Route planen ↗</a></p></div>
  <div class="gk" aria-hidden="true"><img class="g" src="../media/moewe-kontakt.webp" alt="" width="912" height="1136" loading="lazy" decoding="async"></div></div><p class="big b2" aria-hidden="true">MOIN</p></section>
</main>
<footer class="ft"><a class="ft-logo" href="index.html" aria-label="Startseite">${logo()}</a><p>© NetzKombyse GmbH · Hamburg · 53° 33′ N, 9° 56′ O</p>
  <p><a href="${W}/impressum" target="_blank" rel="noopener">Impressum</a> · <a href="${W}/datenschutz" target="_blank" rel="noopener">Datenschutz</a> · <a href="../index.html">Konzept wechseln</a> · <a href="#top">Nach oben</a></p>
  <p class="ft-n">${C.hinweisBeispiel} Zitate sinngemäß bzw. Platzhalter. Inhalte und Verlinkungen nach netzkombyse.de (Stand November 2026). Dieses Konzept ist nur als Startseite ausgearbeitet.</p></footer>`;
  return page({ k: 'k15', title: 'NetzKombyse · Konzept 15 Glut', desc: 'Konzept 15: Glut – Schwarz mit Orange-Verlauf, Riesenwort hinter der Möwe, Projekte als Bildraster.', theme: '#000000', body });
}
export const pages = () => ({ 'index.html': index() });
