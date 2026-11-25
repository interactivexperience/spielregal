// Konzept 14 · PILLE – nach Owner-Referenz „Clothy“, Darkmode: Typo als Zentrum des Heros, genau eine Möwe im Hero, Wörter in Pillen, Kapselkarten,
// Projekte mit großer Hover-Vorschau (awwwards-Prinzip), Henning im Kontakt. Inhalte und Links nach netzkombyse.de.
import { page, logo, esc } from './lib.mjs';
import { C } from '../content.mjs';

const W = 'https://netzkombyse.de';
const team = [
  ['Henning Groß', 'Gründer & Strategie', 'henning', 'Vom Konzern-Einkäufer zur Entwicklung von Unternehmen. Weltreisender, Stratege. Privat mit Wärmepumpe, E-Auto, PV und Smart Home von Zukunftstechnologie begeistert.'],
  ['Patrick König', 'FullStack', 'patrick', 'Begeistert von komplexen Systemstrukturen und IT-Landschaften. Sorgt für Performance im Front- und Backend.'],
  ['Heiko Bee', 'FullStack', 'heiko', 'Schnittstellen sind sein Entwickler-Leben. Als FullStack verbindet er jedes System zur Effizienzsteigerung. Keine ERP, die nicht angebunden wird. Privat rettet er Vespas.'],
  ['Felix Augur', 'Marke & Kommunikation', 'felix', 'Marke und Kommunikation von der Pieke auf gelernt. Agentur- und Konzernerfahren. Er sorgt dafür, dass Ihre Botschaft ankommt. Privat angelt er gerne in Skandinavien.'],
  ['Inga von Kurnatowski', 'Video & Content', 'inga', 'Geschichten, die hängenbleiben – für Ihre Marke, Ihre Produkte, Ihre Kampagnen. Sympathie vor Pathos, Wirkung vor Ästhetik.'],
  ['Mi Dinh', 'UI & Design', 'mi', 'Form folgt Wirkung. User Interface-Design und User Experience, die konvertieren und begeistern, mit Liebe zum Detail.'],
  ['Tim Brettschneider', 'Fördermittel', 'tim', 'Kennt die Fördertöpfe, die Bedingungen und die Wege dorthin. Ihr Vorteil bei der Finanzierung von Digitalisierungsprojekten.'],
  ['Stefan Gutmann', 'SEO & AI-Sichtbarkeit', 'stefan', 'Sorgt dafür, dass Ihre Kunden Sie finden – in Suchmaschinen und KI-Antworten. Datengetriebene Strategien für organische Reichweite.'],
  ['Mr. Claude', 'AI Guy', 'claude', 'Der digitale Kollege im Team: recherchiert, prüft und baut mit, rund um die Uhr.'],
];
const LINE = ["<svg class=\"tc-art\" viewBox=\"0 0 300 380\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M-10 330 C 60 360, 30 210, 130 160 S 244 108 256 66\" fill=\"none\" stroke=\"#1B1210\" stroke-width=\"6\" stroke-linecap=\"round\"/><g transform=\"translate(256 66)\"><g stroke=\"#1B1210\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"4\"><path d=\"M-8 22V-24\" fill=\"none\"/><path d=\"M-8 -24L22 -13L-8 -2Z\" fill=\"#FF6B14\"/><circle cx=\"-8\" cy=\"24\" r=\"6\" fill=\"#FFF1DC\"/></g></g></svg>", "<svg class=\"tc-art\" viewBox=\"0 0 300 380\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M310 330 C 240 360, 270 210, 170 160 S 56 108 44 66\" fill=\"none\" stroke=\"#1B1210\" stroke-width=\"6\" stroke-linecap=\"round\"/><g transform=\"translate(44 66)\"><g stroke=\"#1B1210\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"4\"><rect x=\"-24\" y=\"-17\" width=\"48\" height=\"34\" rx=\"9\" fill=\"#FFF1DC\"/><path d=\"M-8 -7L-15 0L-8 7M8 -7L15 0L8 7M3 -9L-3 9\" fill=\"none\"/></g></g></svg>", "<svg class=\"tc-art\" viewBox=\"0 0 300 380\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M-10 330 C 60 360, 30 210, 130 160 S 244 108 256 66\" fill=\"none\" stroke=\"#1B1210\" stroke-width=\"6\" stroke-linecap=\"round\"/><g transform=\"translate(256 66)\"><g stroke=\"#1B1210\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"4\"><rect x=\"-15\" y=\"-6\" width=\"30\" height=\"26\" rx=\"7\" fill=\"#FFF1DC\"/><path d=\"M-7 -6V-20M7 -6V-20\" fill=\"none\" stroke-width=\"6\"/></g></g></svg>", "<svg class=\"tc-art\" viewBox=\"0 0 300 380\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M310 330 C 240 360, 270 210, 170 160 S 56 108 44 66\" fill=\"none\" stroke=\"#1B1210\" stroke-width=\"6\" stroke-linecap=\"round\"/><g transform=\"translate(44 66)\"><g stroke=\"#1B1210\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"4\"><path d=\"M-22 -16h44a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8H-6l-12 11V16h-4a8 8 0 0 1-8-8v-16a8 8 0 0 1 8-8z\" transform=\"scale(.9)\" fill=\"#FFF1DC\"/><g fill=\"#1B1210\" stroke=\"none\"><circle cx=\"-10\" cy=\"-1\" r=\"3\"/><circle cx=\"0\" cy=\"-1\" r=\"3\"/><circle cx=\"10\" cy=\"-1\" r=\"3\"/></g></g></g></svg>", "<svg class=\"tc-art\" viewBox=\"0 0 300 380\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M-10 330 C 60 360, 30 210, 130 160 S 244 108 256 66\" fill=\"none\" stroke=\"#1B1210\" stroke-width=\"6\" stroke-linecap=\"round\"/><g transform=\"translate(256 66)\"><g stroke=\"#1B1210\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"4\"><circle r=\"22\" fill=\"#FFF1DC\"/><path d=\"M-6 -10L11 0L-6 10Z\" fill=\"#1B1210\"/></g></g></svg>", "<svg class=\"tc-art\" viewBox=\"0 0 300 380\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M310 330 C 240 360, 270 210, 170 160 S 56 108 44 66\" fill=\"none\" stroke=\"#1B1210\" stroke-width=\"6\" stroke-linecap=\"round\"/><g transform=\"translate(44 66)\"><g stroke=\"#1B1210\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"3.5\"><path d=\"M-26 12L0 0L26 -12\" fill=\"none\"/><rect x=\"-9\" y=\"-9\" width=\"18\" height=\"18\" fill=\"#FFF1DC\"/><circle cx=\"-26\" cy=\"12\" r=\"5.5\" fill=\"#FF6B14\"/><circle cx=\"26\" cy=\"-12\" r=\"5.5\" fill=\"#FF6B14\"/></g></g></svg>", "<svg class=\"tc-art\" viewBox=\"0 0 300 380\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M-10 330 C 60 360, 30 210, 130 160 S 244 108 256 66\" fill=\"none\" stroke=\"#1B1210\" stroke-width=\"6\" stroke-linecap=\"round\"/><g transform=\"translate(256 66)\"><g stroke=\"#1B1210\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"4\"><circle r=\"22\" fill=\"#FFF1DC\"/><circle r=\"15\" fill=\"none\" stroke-width=\"2.5\"/><text x=\"0\" y=\"8\" text-anchor=\"middle\" font-family=\"Unbounded,Montserrat,sans-serif\" font-weight=\"800\" font-size=\"22\" fill=\"#1B1210\" stroke=\"none\">€</text></g></g></svg>", "<svg class=\"tc-art\" viewBox=\"0 0 300 380\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M310 330 C 240 360, 270 210, 170 160 S 56 108 44 66\" fill=\"none\" stroke=\"#1B1210\" stroke-width=\"6\" stroke-linecap=\"round\"/><g transform=\"translate(44 66)\"><g stroke=\"#1B1210\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"5\"><circle cx=\"-4\" cy=\"-4\" r=\"15\" fill=\"#FFF1DC\"/><path d=\"M8 8L22 22\" stroke-width=\"8\" fill=\"none\"/></g></g></svg>", "<svg class=\"tc-art\" viewBox=\"0 0 300 380\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M-10 330 C 60 360, 30 210, 130 160 S 244 108 256 66\" fill=\"none\" stroke=\"#1B1210\" stroke-width=\"6\" stroke-linecap=\"round\"/><g transform=\"translate(256 66)\"><g stroke=\"#1B1210\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"3\"><path d=\"M0 -24Q3 -4 24 0Q3 4 0 24Q-3 4 -24 0Q-3 -4 0 -24Z\" fill=\"#1B1210\"/><path d=\"M20 -22Q21 -16 27 -15Q21 -14 20 -8Q19 -14 13 -15Q19 -16 20 -22Z\" fill=\"#FF6B14\" stroke-width=\"2\"/></g></g></svg>"];
const TC_ROLE = { 1: 'FullStack-Entwicklung', 2: 'FullStack & Schnittstellen' };
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
const I = (d, extra = '') => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
const ico = {
  cal: I('<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8.5 14.5l2 2 4-4"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>'),
  mail: I('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
};
const hg = `<svg class="hs" viewBox="0 0 400 480" aria-hidden="true"><path d="M30 480c4-96 62-150 170-150s166 54 170 150z" fill="#17120F"/><rect x="170" y="268" width="60" height="70" rx="26" fill="#E9B48F"/><ellipse cx="200" cy="214" rx="66" ry="78" fill="#F1C4A1"/><path d="M128 196c2-60 34-96 72-96s70 36 72 96c-26-18-48-26-72-26s-46 8-72 26z" fill="#FF6B14"/><rect x="124" y="188" width="152" height="26" rx="13" fill="#E55A0B"/><circle cx="200" cy="96" r="20" fill="#FFC93C"/><circle cx="176" cy="226" r="6" fill="#17120F"/><circle cx="224" cy="226" r="6" fill="#17120F"/><path d="M178 258c14 14 30 14 44 0" stroke="#17120F" stroke-width="5" stroke-linecap="round" fill="none"/></svg>`;

function index() {
  const body = `<div id="top"></div><div class="prog" aria-hidden="true"></div>
<header class="hd"><div class="hd-in">
  <a class="hd-logo" href="index.html" aria-label="NetzKombyse – Startseite">${logo()}</a>
  <nav class="hd-nav" aria-label="Hauptnavigation"><a href="#leistung">Leistung</a><a href="#lage">Lage</a><a href="#arbeit">Arbeit</a><a href="#stimmen">Stimmen</a><a href="#team">Team</a><a href="#kontakt">Kontakt</a></nav>
  <div class="hd-r"><a class="cart" href="${C.termin}" target="_blank" rel="noopener" data-mag>Termin <b>1</b></a><button class="mt" type="button" data-motion-toggle aria-pressed="true" title="Animationen ein- oder ausschalten"><span class="mt-i" aria-hidden="true"></span><span data-motion-label>Bewegung an</span></button></div>
</div></header>
<main id="main">
<section class="hero" aria-labelledby="h1">
  <div class="meta"><span class="tag"><b>01</b></span><span class="tag">Shopware & E-Commerce Agentur</span><span class="tag mr">Hamburg · ${C.jahre}+ Jahre</span></div>
  <h1 id="h1" aria-label="Wir bauen Shops, die sich rechnen"><span class="r"><span class="pill" data-reveal>Wir bauen</span></span><span class="r"><span class="word" data-reveal style="--d:80ms">Shops</span> <a class="chip" data-reveal style="--d:120ms" href="${C.termin}" target="_blank" rel="noopener" aria-label="Termin buchen" title="Termin buchen" data-mag>${ico.cal}</a></span><span class="r"><span class="pill" data-reveal style="--d:200ms">die sich</span> <span class="word" data-reveal style="--d:260ms">rechnen</span>${sq}</span></h1>
  <div class="hero-b">
    <p class="lead" data-reveal>Digitaler Vertrieb für Mittelständler: Shopware & Shopify, Marke und Marketing aus einer Hand, mit festen Ansprechpartnern.</p>
    <p class="ib" data-reveal><a href="${C.termin}" target="_blank" rel="noopener" aria-label="Termin buchen" title="Termin buchen" data-mag>${ico.cal}</a><a href="${C.telHref}" aria-label="Anrufen: ${C.tel}" title="Anrufen" data-mag>${ico.phone}</a><a href="mailto:ahoi@netzkombyse.de" aria-label="E-Mail schreiben" title="E-Mail schreiben" data-mag>${ico.mail}</a></p>
  </div>
  <a class="scrl" href="#leistung" aria-label="Weiter zu den Leistungen"><i aria-hidden="true"></i></a>
  <div class="hg" data-gull aria-hidden="true"><div class="gfl"></div><div class="gb"><img src="../media/moewe-cut-l.webp" alt="" width="832" height="1232" decoding="async"></div><div class="gw"><img src="../media/moewe-cut-l.webp" alt="" width="832" height="1232" decoding="async"></div><div class="gh"><img src="../media/moewe-cut-l.webp" alt="" width="832" height="1232" decoding="async"><i class="lid"></i></div></div>
</section>

<p class="mq" aria-label="Kunden"><span class="mq-t">${[...C.marken, ...C.marken].map(m => `<span>${esc(m)}</span><i aria-hidden="true">✦</i>`).join('')}</span></p>

<section class="sec" id="leistung"><div class="wr"><p class="tag" data-reveal><b>02</b> Leistung</p><h2 data-reveal>Drei <span class="pill">Disziplinen</span>, ein Ziel.</h2>
  <ol class="caps">${[
    ['Technologie & Shop', 'Shopware und Shopify für B2B, B2C und Headless: Systeme, die in fünf Jahren noch tragen.', 'e-commerce', ['Shopware', 'Shopify', 'Headless', 'Migration', 'ERP · PIM · CRM']],
    ['Kommunikation & Marke', 'Markenstrategie, Design und Inhalte: ein Gesicht über alle Kanäle.', 'brand-ux-ui', ['Positionierung', 'Corporate Design', 'UX / UI', 'Content']],
    ['Marketing & Performance', 'Sichtbarkeit, gemessen an Umsatz und nicht an Klicks.', 'marketing', ['SEO', 'AI-Sichtbarkeit', 'Google Ads', 'Newsletter', 'Tracking']],
  ].map(([t, d, u, ch], i) => `<li class="c${i + 1}" style="--i:${i}"><button type="button" class="ch" aria-expanded="false" aria-controls="cp${i}"><span class="cn">${pad(i + 1)}</span><h3>${esc(t)}</h3><span class="pm" aria-hidden="true"></span></button><div id="cp${i}" class="cb" hidden><p>${esc(d)}</p><ul class="tg">${ch.map(x => `<li>${esc(x)}</li>`).join('')}</ul><a class="more2" href="${W}/${u}" target="_blank" rel="noopener">Mehr erfahren ${arrow}</a></div></li>`).join('')}</ol></div></section>

<section class="sec sec-l" id="lage"><div class="wr"><p class="tag" data-reveal><b>03</b> Ausgangslage</p><h2 data-reveal>Ihre <span class="pill">Lage</span>. Unsere Antwort.</h2>
  <ol class="pairs">${lagen.map((l, i) => `<li data-reveal style="--d:${i * 100}ms"><div class="pl"><span class="big" aria-hidden="true">${pad(i + 1)}</span><div><p class="lab">Ihre Lage</p><h3>${esc(l.n.t)}</h3><p>${esc(l.n.d)}</p></div></div><span class="px" aria-hidden="true">${arrow}</span><ul class="pa" aria-label="Unsere Antwort">${l.a.map(a => `<li><b>${esc(a.t)}</b><span>${esc(a.d)}</span></li>`).join('')}</ul></li>`).join('')}</ol></div></section>

<section class="sec" id="arbeit"><div class="wr"><p class="tag" data-reveal><b>04</b> Arbeit</p><h2 data-reveal>Ausgewählte <span class="pill">Projekte</span>.</h2>
  <ul class="work" data-work>${cases.map(([f, t, d, b, u]) => `<li data-reveal><a href="${W}/${u}" target="_blank" rel="noopener" data-src="../media/cases/${f}.jpg" aria-label="${esc(t)}: ${esc(d)}"><b>${esc(t)}</b><span class="d">${esc(d)}</span><span class="br">${esc(b)}</span><i class="wi" aria-hidden="true">${arrow}</i><img class="th" src="../media/cases/${f}.jpg" alt="" width="1024" height="675" loading="lazy" decoding="async"></a></li>`).join('')}</ul>
  <p class="all" data-reveal><a class="btn btn-o" href="${W}/references" target="_blank" rel="noopener">Alle Referenzen ↗</a></p></div>
  <div class="pv" aria-hidden="true"><img alt="" width="1024" height="675"></div><span class="pc" aria-hidden="true">${arrow}</span></section>

<section class="sec sec-s" id="stimmen"><div class="wr vx"><div class="vx-h"><p class="tag" data-reveal><b>05</b> Stimmen</p><h2 data-reveal>Was <span class="pill">Kunden</span> sagen.</h2>
  <p class="rate" data-reveal><b>4,8</b><span>von 5 · 11 Google-Bewertungen</span><a class="rl" href="https://www.google.com/maps/search/?api=1&query=NetzKombyse&query_place_id=ChIJP2GS276FsUcRbSWqjQ9NfAE" target="_blank" rel="noopener">Bewertungen lesen ↗</a></p></div>
  <div class="vox"><div class="vq-w">${C.stimmen.map((s, i) => `<figure class="vq${i === 0 ? ' on' : ''}" data-i="${i}"><blockquote>${s.q.split(' ').map((w, j) => `<span style="--w:${j}">${esc(w)}</span>`).join(' ')}</blockquote><figcaption><b>${esc(s.w)}</b><i>${esc(s.f)}${s.hinweis ? ` (${esc(s.hinweis)})` : ''}</i></figcaption></figure>`).join('')}</div>
    <div class="vsel" role="tablist" aria-label="Stimme wählen">${C.stimmen.map((s, i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-i="${i}"><span class="vn">${pad(i + 1)}</span><span><b>${esc(s.w)}</b><i>${esc(s.f)}</i></span></button>`).join('')}</div></div></div></section>

<section class="sec" id="team"><div class="wr"><p class="tag" data-reveal><b>06</b> Team</p><h2 data-reveal>Die <span class="pill">Menschen</span> dahinter.</h2>
  <p class="lead tl" data-reveal>Jede Person hier ist Ihre direkte Ansprechpartnerin, Ihr direkter Ansprechpartner, vom ersten Gespräch bis zum Start. In keiner bestimmten Reihenfolge.</p></div>
  <div class="tc-row" data-trow tabindex="0" role="region" aria-label="Team, seitlich scrollbar">${team.map(([n, r, im, d], i) => `<article class="tc" style="--i:${i}" tabindex="0"><p class="tc-p">Präsentiert</p><h3 class="tc-n">${esc(n)}</h3><div class="tc-w bg${i}">${LINE[i] || ''}<img src="../media/team-cut/${im}.webp" alt="${esc(n)}" width="800" height="1000" loading="lazy" decoding="async" draggable="false"><div class="tc-d"><p>${esc(d)}</p></div></div><p class="tc-z">${i === 0 || i === 8 ? 'im Team als' : 'zuständig für'}</p><p class="tc-r">${esc(TC_ROLE[i] || r)}</p><span class="tc-i" aria-hidden="true">${pad(i + 1)}/${pad(team.length)}</span><span class="tc-m" aria-hidden="true">NK</span></article>`).join('')}</div></section>

<section class="sec kx" id="kontakt" aria-labelledby="kxh">
  <div class="kx-glow" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="kx-top wr">
    <div class="kx-r"><p class="tag" data-reveal><b>07</b> Kontakt</p><h2 id="kxh" data-reveal>Reden wir <span class="pill">persönlich</span>.</h2>
      <p class="kx-n" data-reveal><b>${C.ansprech.name}</b> · ${C.ansprech.rolle}</p>
      <p class="kx-m" data-reveal><a href="mailto:ahoi@netzkombyse.de">ahoi@netzkombyse.de</a></p>
      <p class="kx-b" data-reveal><a class="kb kb-f" href="${C.termin}" target="_blank" rel="noopener" data-mag>Termin buchen</a><button class="kb" type="button" data-copy="ahoi@netzkombyse.de"><span data-copy-l>E-Mail kopieren</span><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button><span class="sr" role="status" aria-live="polite" data-copy-s></span></p></div>
    <div class="kx-s" aria-hidden="true"></div>
    <div class="kx-l">
      <ul class="kx-ln" data-reveal>
        <li><a href="${C.telHref}"><i>${ico.phone}</i><span>${C.tel}</span></a></li>
        <li><a href="${C.termin}" target="_blank" rel="noopener"><i>${ico.cal}</i><span>Videotermin, 30 Minuten</span></a></li>
        <li><a href="https://maps.google.com/?q=Harkortstraße+81,+22765+Hamburg" target="_blank" rel="noopener"><i>${ico.pin}</i><span>${C.adresse[0]}, ${C.adresse[1]}</span></a></li>
      </ul></div>
  </div>
  <figure class="kx-p"><img src="../media/henning-pose.webp" alt="${C.ansprech.name}, ${C.ansprech.rolle}" width="928" height="1152" loading="lazy" decoding="async"></figure>
  <div class="kx-ft wr"><span>© 2026 NetzKombyse GmbH</span><a href="${W}/datenschutz" target="_blank" rel="noopener">Datenschutz</a><a href="${W}/impressum" target="_blank" rel="noopener">Impressum</a><span class="kx-c">Moin aus Hamburg: Hier ist es gerade <b data-clock>–</b> Uhr.</span></div>
  <p class="kx-big" aria-hidden="true">Kontakt</p>
</section>
</main>
<footer class="ft"><div class="ft-g">
  <div class="ft-a"><a class="ft-logo" href="index.html" aria-label="Startseite">${logo()}</a><p>Digitaler Commerce für Unternehmen, die mehr vorhaben.</p><p class="ft-ad">NetzKombyse GmbH<br>Harkortstraße 81, Hamburg<br><a href="${C.telHref}">${C.tel}</a><br><a href="mailto:ahoi@netzkombyse.de">ahoi@netzkombyse.de</a></p></div>
  <nav aria-label="Leistungen"><h4>Leistungen</h4><a href="${W}/e-commerce" target="_blank" rel="noopener">E-Commerce</a><a href="${W}/shopware-migration" target="_blank" rel="noopener">Shop-Migration</a><a href="${W}/marketing" target="_blank" rel="noopener">Marketing</a><a href="${W}/brand-ux-ui" target="_blank" rel="noopener">Kommunikation &amp; Marke</a><a href="${W}/seo-agentur-hamburg" target="_blank" rel="noopener">SEO &amp; AI-Sichtbarkeit</a><a href="${W}/barrierefreiheit" target="_blank" rel="noopener">Barrierefreiheit</a><a href="${W}/foerdermittel" target="_blank" rel="noopener">Fördermittel</a></nav>
  <nav aria-label="Referenzen"><h4>Referenzen</h4><a href="${W}/references" target="_blank" rel="noopener">Alle Referenzen</a>${['Food & Gastronomie', 'Medizin & Gesundheit', 'B2B & Industrie', 'Heimtier', 'Musik & Entertainment', 'Mobilität & Handwerk'].map(b => `<span>${esc(b)}</span>`).join('')}</nav>
  <nav aria-label="Unternehmen"><h4>Unternehmen</h4><a href="${W}/ueber-uns" target="_blank" rel="noopener">Über uns</a><a href="${W}/impressum" target="_blank" rel="noopener">Impressum</a><a href="${W}/datenschutz" target="_blank" rel="noopener">Datenschutz</a><a href="../index.html">Konzepte</a><a href="#top">Nach oben ↑</a></nav></div>
  <p class="ft-n">© NetzKombyse GmbH · Beispielwerte und Zitate sind Platzhalter.</p></footer>`;
  return page({ k: 'k14', title: 'NetzKombyse · Konzept 14 Pille', desc: 'Konzept 14: Pille – Darkmode, Typo im Zentrum, Projekt-Vorschau beim Hover, Henning im Kontakt.', theme: '#000000', body });
}
export const pages = () => ({ 'index.html': index() });
