// Konzept 15 · GLUT – nach Owner-Referenz „Kontour“: Schwarz, Orange-Verlaufsnebel, Bricolage Grotesque für Headlines, Sora für Text.
// Möwe (Recraft) mit zweiteiligem Kopf: folgt dem Zeiger, im Leerlauf möwentypische Gesten. Disziplinen als Riesenzeilen, Lage-Karten drehen sich,
// Projekte in vier Ansichten, Stimmen rein typografisch, Henning freigestellt. Inhalte und Links von netzkombyse.de (Stand Nov. 2026).
import { page, logo, esc } from './lib.mjs';
import { C } from '../content.mjs';

const W = 'https://netzkombyse.de';
const pad = n => String(n).padStart(2, '0');
const ar = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9l6-6M4 3h5v5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ext = h => (h.startsWith('http') ? ' target="_blank" rel="noopener"' : '');
const btn = (href, t, cls = '') => `<a class="cta ${cls}" href="${href}"${ext(href)} data-mag><span>${t}</span><i aria-hidden="true">${ar}</i></a>`;

const stimmen = [
  { w: 'Martin Hense', r: 'Geschäftsführer', f: 'Martins Musikkiste', i: 'mh', q: 'Die NetzKombyse ist Motor und Ideengeber für Shopware 6 und unsere Marketing-Aktionen! Die Rundumversorgung ermöglicht uns, in einer schwierigen Branche in schwierigen Zeiten erfolgreich zu bleiben!' },
  { w: 'Dr. med. Barbara Hogan', r: 'Geschäftsführerin', f: 'MVZ an der Elbe', i: 'bh', q: 'Ich war sehr zufrieden mit der hochprofessionellen Arbeit, der Hilfsbereitschaft und der Freundlichkeit des gesamten Teams.' },
  { w: 'Matthias Kurzenberger', r: 'Geschäftsführer', f: 'Wein-Bauer GmbH', i: 'mk', q: 'Die umfassende Betreuung dieses Teams – von Infrastruktur bis Marketing – hat mich tief beeindruckt. Hier wird richtig Gas gegeben, die Kommunikation ist erstklassig und man bekommt alles, nur kein 08/15.' },
];
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
const marken = ['Bio Planète', 'Tout Terrain', 'K-Idol', 'Craft & Caviar', 'Grizzly', 'Beisser', 'Timkid', 'Elektrosil', 'PremiumWheels', 'dgina', 'Pechkeks', 'HWT', 'Abelmann', 'Wurstladen', 'Marktpirat', 'Sabro', 'Wein-Bauer', 'Kaffeekontor'];
const branchen = [['Food & Gastronomie', 'Marke, Direktvertrieb, Gastronomie.'], ['Medizin & Gesundheit', 'Medizintechnik, Kliniken, Verbände.'], ['B2B & Industrie', 'B2B, Corporate, Händlerportale.'], ['Heimtier', 'Hundemöbel, Futter, Markenentwicklung.'], ['Musik & Entertainment', 'Instrumente, K-Pop, Fachhandel.'], ['Mobilität & Handwerk', 'Reifen, Fahrräder, SHK-Leads.']];
const integr = ['Pickware', 'JTL', 'Shopify', 'Mollie', 'Sendcloud', 'Hive', 'VARIO', 'xentral', 'Sage', 'HQS ProfiSoft', 'Haufe X360'];
const leist = [
  { t: 'Technologie & Shop', href: `${W}/e-commerce`, d: 'Ihr Shop als Wachstumsmaschine: skalierbar, integriert, zukunftsfähig.', c: ['Shopware & Shopify', 'Shop-Migration', 'ERP-, PIM- & CRM-Anbindung'] },
  { t: 'Kommunikation & Marke', href: `${W}/brand-ux-ui`, d: 'Marke, UX und Content aus einem Guss: ein Gesicht über alle Kanäle.', c: ['Markenstrategie', 'UX / UI', 'Video & Content'] },
  { t: 'Marketing & Performance', href: `${W}/marketing`, d: 'Sichtbarkeit, die sich rechnet: gemessen an Umsatz, nicht an Klicks.', c: ['SEO & AI-Sichtbarkeit', 'Google Ads & META', 'Newsletter'] },
];
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
// Projektwand: [Projekt-Index, Breite, Höhe, x, y, Tiefe, Bildausschnitt]
const wallTiles = [
  [2, 520, 360, 120, 90, 1.15, '50% 40%'], [0, 380, 520, 700, 40, .85, '40% 50%'], [5, 440, 300, 1130, 150, 1.2, '50% 60%'], [1, 560, 380, 1620, 60, .9, '30% 50%'], [7, 380, 380, 2180, 130, 1.1, '60% 50%'],
  [3, 400, 280, 60, 560, .9, '20% 50%'], [4, 560, 400, 520, 520, 1.1, '50% 30%'], [6, 360, 500, 1140, 560, .8, '70% 50%'], [0, 520, 340, 1540, 600, 1.2, '50% 70%'], [2, 360, 260, 2100, 600, .95, '80% 30%'],
  [5, 420, 300, 140, 960, 1.05, '50% 20%'], [7, 520, 360, 720, 1000, .9, '40% 40%'],
];
const caseLink = (c, cls, inner) => `<a class="${cls}" href="${W}/${c[4]}" target="_blank" rel="noopener" aria-label="${esc(c[1])}: ${esc(c[2])}">${inner}</a>`;
const marq = ['Shopware', 'Shopify', 'Headless', 'Migration', 'Marke', 'UX / UI', 'SEO', 'AI-Sichtbarkeit', 'Performance', 'ERP · PIM · CRM'];
const logoOf = { 'Bio Planète': 'bioplanete.svg', 'Tout Terrain': 'touttterrain.svg', 'K-Idol': 'kidol.svg', 'Craft & Caviar': 'craftandcaviar.svg', 'Grizzly': 'grizzly.svg', 'Beisser': 'beisser.webp', 'Timkid': 'timkid.svg', 'Elektrosil': 'elektrosil.svg', 'PremiumWheels': 'premiumwheels.webp', 'dgina': 'dgina.svg', 'Pechkeks': 'pechkeks.webp', 'HWT': 'hwt.svg', 'Abelmann': 'abelmann.svg', 'Wurstladen': 'wurstladen.svg', 'Marktpirat': 'marktpirat.svg', 'Sabro': 'sabro.svg', 'Wein-Bauer': 'weinbauer.svg', 'Kaffeekontor': 'kaffeekontor.svg' };
const row = a => [...a, ...a].map(x => `<span class="bn">${esc(x)}${logoOf[x] ? `<span class="bl"><img src="../media/logos/${logoOf[x]}" alt="" loading="lazy" decoding="async"></span>` : ''}</span><i aria-hidden="true">✦</i>`).join('');

function index() {
  const body = `<div id="top"></div><div class="prog" aria-hidden="true"></div><div class="spot" aria-hidden="true"></div>
<header class="hd"><a class="hd-logo" href="index.html" aria-label="NetzKombyse – Startseite">${logo()}</a>
  <nav class="hd-nav" aria-label="Hauptnavigation"><a href="#leistung">Leistungen</a><a href="#haltung">Haltung</a><a href="#arbeit">Referenzen</a><a href="${W}/ueber-uns" target="_blank" rel="noopener">Über uns</a><a href="#kontakt">Kontakt</a></nav>
  <div class="hd-r"><button class="mt lt" type="button" data-light aria-pressed="false" title="Lichtpunkt: ein warmer Lichtfleck folgt dem Zeiger"><span class="mt-i" aria-hidden="true"></span><span>Licht</span></button>
  <button class="mt" type="button" data-motion-toggle aria-pressed="true" title="Animationen ein- oder ausschalten"><span class="mt-i" aria-hidden="true"></span><span data-motion-label>Bewegung an</span></button></div></header>
<main id="main">
<section class="hero" aria-labelledby="h1">
  <div class="glow" aria-hidden="true"></div>
  <p class="k" data-reveal>Hamburger Agentur für digitalen Commerce · Mittelstand</p>
  <h1 id="h1" data-chars data-reveal>Machen.<br>Nicht Möwen<br>zählen.</h1>
  <p class="s" data-reveal>Strategische Beratung, komplexe Shop- und Systementwicklung, Markenkommunikation und Performance-Marketing zu einer ganzheitlichen Lösung, für Unternehmen, die mehr vorhaben.</p>
  <p class="ctas" data-reveal>${btn(C.termin, 'Termin buchen')}${btn('#arbeit', 'Referenzen', 'ln')}</p>
  <div class="gwrap" data-gull aria-hidden="true"><div class="gfl"></div><div class="gb"><img src="../media/moewe-cut-l.webp" alt="" width="832" height="1232" decoding="async"></div><div class="gw"><img src="../media/moewe-cut-l.webp" alt="" width="832" height="1232" decoding="async"></div><div class="gh"><img src="../media/moewe-cut-l.webp" alt="" width="832" height="1232" decoding="async"><i class="lid"></i></div></div>
</section>

<section class="facts" aria-label="Zahlen"><ul>
  <li data-reveal><strong data-count="${C.jahre}" data-suffix="+">${C.jahre}+</strong><span>Jahre E-Commerce</span></li>
  <li data-reveal style="--d:90ms"><strong data-count="${C.zahlen.marken}">${C.zahlen.marken}</strong><span>Marken im Portfolio</span></li>
  <li data-reveal style="--d:180ms"><strong data-count="${C.prozessloesungen}" data-suffix="+">${C.prozessloesungen}+</strong><span>Prozesslösungen</span></li></ul>
  <a class="fp" data-reveal href="${W}/foerdermittel" target="_blank" rel="noopener"><span class="fp-k">Akkreditierter Förderpartner</span><b>Zuschüsse bis zu 80 % möglich</b><i aria-hidden="true">${ar}</i></a></section>

<section class="sec" id="wen" aria-label="Wen wir begleiten"><div class="wr"><p class="k">Wen wir begleiten</p>
  <p class="lit" data-lit>Wir begleiten mittelständische Unternehmen, die E-Commerce als zentralen Bestandteil ihrer Unternehmensentwicklung verstehen.</p>
  <ol class="pil">${C.saeulen.map((p, i) => `<li data-reveal style="--d:${i * 90}ms"><span class="n">${pad(i + 1)}</span><b>${esc(p.t)}</b><span>${esc(p.d)}</span></li>`).join('')}</ol></div></section>

<div class="mqs" role="group" aria-label="Marken, für die wir arbeiten"><p class="k mk">Für diese Marken entwickeln wir Shops, Auftritte und Kampagnen, viele davon seit Jahren.</p><p class="mq a" aria-hidden="true"><span class="mq-t" data-mq="-1">${row(marken.slice(0, 9))}</span></p><p class="mq b" aria-hidden="true"><span class="mq-t" data-mq="1">${row(marken.slice(9))}</span></p></div>

<section class="sec" id="leistung"><div class="wr"><div class="two"><h2 data-chars data-reveal>Drei Disziplinen, ein Ziel.</h2><p class="side" data-reveal>Digitaler Vertrieb, der sich rechnet: individuelle Lösungen mit wirtschaftlicher Perspektive, persönlicher Verantwortung und messbaren Ergebnissen.</p></div>
  <ol class="acc">${leist.map((d, i) => `<li class="${i === 0 ? 'open' : ''}" data-reveal style="--d:${i * 90}ms"><button type="button" aria-expanded="${i === 0}" aria-controls="p${i}"><span class="n">[${pad(i + 1)}]</span><b>${esc(d.t)}</b><i class="ar" aria-hidden="true">${ar}</i></button><div id="p${i}" class="pn" ${i === 0 ? '' : 'hidden'}><p>${esc(d.d)}</p><span class="chs">${d.c.map(x => `<span>${esc(x)}</span>`).join('')}</span><a class="more" href="${d.href}" target="_blank" rel="noopener">Mehr erfahren ${ar}</a></div></li>`).join('')}</ol><p class="now" data-reveal><span>Aktuell gefragt</span><a href="${W}/shopware-migration" target="_blank" rel="noopener">Shopware-Migration ↗</a><a href="${W}/seo-agentur-hamburg" target="_blank" rel="noopener">SEO & AI-Sichtbarkeit ↗</a><a href="${W}/barrierefreiheit" target="_blank" rel="noopener">Barrierefreiheit ↗</a></p></div></section>

<section class="sec fog" id="haltung"><div class="wr"><div class="head2"><p class="k">Ausgangslage</p><h2 data-chars data-reveal>Wir formen aus Ihrer Lage einen Plan.</h2><p class="side" data-reveal>Karte antippen: Auf der Rückseite steht, wie wir antworten.</p></div>
  <div class="cards">${lagen.map((l, i) => `<div class="cd" data-reveal style="--d:${i * 110}ms"><div class="fcard" role="button" tabindex="0" aria-pressed="false" aria-label="${esc(l.n.t)}: Karte drehen"><div class="face fr"><span class="num" aria-hidden="true">${pad(i + 1)}</span><h3>${esc(l.n.t)}</h3><span class="hint"><i aria-hidden="true">↻</i> Drehen</span></div><div class="face bk"><p class="lab">Ihre Lage</p><p class="tx">${esc(l.n.d)}</p><p class="lab">Unsere Antwort</p>${l.a.map(a => `<p class="an"><b>${esc(a.t)}</b><span>${esc(a.d)}</span></p>`).join('')}</div></div></div>`).join('')}</div></div></section>

<section class="sec" id="arbeit"><div class="wr"><div class="two"><h2 data-chars data-reveal>Projekte, die bleiben.</h2><p class="side" data-reveal>Vom Ein-Frau-Startup bis zum international aufgestellten Mittelstand. Eine Auswahl aus über 40 Projekten.</p></div>
  <div class="tabs" role="tablist" aria-label="Ansicht der Projekte"><button type="button" role="tab" aria-selected="true" data-tab="cf">Karussell</button><button type="button" role="tab" aria-selected="false" data-tab="wall">Wand</button><button type="button" role="tab" aria-selected="false" data-tab="idx">Index</button><button type="button" role="tab" aria-selected="false" data-tab="deck">Stapel</button></div>
  <div class="gal" data-gal="cf"><div class="cf" data-cf role="region" aria-roledescription="Karussell" aria-label="Projekte, mit Pfeiltasten oder Wischen blättern">
    <ul class="cf-s">${cases.map((c, i) => `<li class="cf-c" data-i="${i}">${caseLink(c, '', `<img src="../media/cases/${c[0]}.jpg" alt="Projektbilder ${esc(c[1])}" width="1024" height="675" ${i < 3 ? '' : 'loading="lazy"'} decoding="async" draggable="false"><i class="sh" aria-hidden="true"></i>`)}</li>`).join('')}</ul>
    <div class="cf-i" aria-live="polite"><p class="cf-n"><b data-cur>01</b> / ${pad(cases.length)}</p><h3 data-t></h3><p class="cf-d" data-d></p><p class="cf-b" data-b></p>${btn(`${W}/references`, 'Projekt ansehen').replace('class="cta ', 'data-l class="cta ')}</div>
    <div class="cf-ctl"><button type="button" data-prev aria-label="Vorheriges Projekt"><svg viewBox="0 0 60 16" aria-hidden="true"><path d="M58 8H6M14 2L6 8l8 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button><span class="cf-bar" aria-hidden="true"><i></i></span><button type="button" data-next aria-label="Nächstes Projekt"><svg viewBox="0 0 60 16" aria-hidden="true"><path d="M2 8h52M46 2l8 6-8 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
    <script type="application/json" data-meta>${JSON.stringify(cases.map(c => ({ t: c[1], d: c[2], b: c[3], h: `${W}/${c[4]}` })))}</script></div></div>
  <div class="gal" data-gal="wall" hidden><div class="wall" data-wall role="region" aria-label="Projektwand, ziehen zum Verschieben"><div class="wall-in">${wallTiles.map(([c, w, h, x, y, z, pos], i) => caseLink(cases[c], 'wt', `<img src="../media/cases/${cases[c][0]}.jpg" alt="" style="object-position:${pos}" width="1024" height="675" loading="lazy" draggable="false"><span class="wc"><b>${esc(cases[c][1])}</b><em>${esc(cases[c][3])}</em></span>`).replace('class="wt"', `class="wt" data-z="${z}" style="--w:${w}px;--h:${h}px;left:${x}px;top:${y}px;--i:${i}"`)).join('')}</div><p class="wall-h" aria-hidden="true">← ziehen →</p></div></div>
  <div class="gal" data-gal="idx" hidden><ol class="idx" data-idx>${cases.map((c, i) => `<li>${caseLink(c, '', `<span class="in1">${pad(i + 1)}</span><b>${esc(c[1])}</b><span class="in2">${esc(c[2])}</span><span class="in3">${esc(c[3])}</span><img class="th" src="../media/cases/${c[0]}.jpg" alt="" width="1024" height="675" loading="lazy" draggable="false">`).replace('<a ', `<a data-src="../media/cases/${c[0]}.jpg" `)}</li>`).join('')}</ol></div>
  <div class="gal" data-gal="deck" hidden><div class="deck" data-deck role="region" aria-label="Projektstapel, ziehen oder tippen für das nächste Projekt"><div class="dk-s">${cases.map((c, i) => `<figure class="dk-c" data-i="${i}">${caseLink(c, '', `<img src="../media/cases/${c[0]}.jpg" alt="Projektbilder ${esc(c[1])}" width="1024" height="675" loading="lazy" draggable="false">`)}</figure>`).join('')}</div>
    <div class="dk-i" aria-live="polite"><h3 data-dt></h3><p data-dd></p></div><div class="dk-c2"><button type="button" data-dp aria-label="Zurück">←</button><span class="dk-n" data-dn>01 / ${pad(cases.length)}</span><button type="button" data-dx aria-label="Nächstes">→</button></div>
    <script type="application/json" data-dmeta>${JSON.stringify(cases.map(c => ({ t: c[1], d: c[2] })))}</script></div></div>
  <p class="all" data-reveal>${btn(`${W}/references`, 'Alle Referenzen')}</p></div>
  <div class="pv" aria-hidden="true"><img alt="" width="1024" height="675"></div><span class="pc" aria-hidden="true">${ar}</span></section>

<section class="sec vs" id="stimmen" aria-label="Was Kunden sagen"><div class="wr"><p class="k">Kundenstimmen</p>
  <div class="vs-g" data-voices>
    <div class="vn" role="tablist" aria-label="Stimme wählen">${stimmen.map((x, i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-i="${i}"><img src="../media/clients/${x.i}.webp" alt="" width="56" height="56" loading="lazy"><span><b>${esc(x.w)}</b><em>${esc(x.f)}</em></span><i aria-hidden="true"></i></button>`).join('')}</div>
    <div class="vq-w"><span class="qm" aria-hidden="true">„</span>${stimmen.map((x, i) => `<figure class="vq${i === 0 ? ' on' : ''}" data-i="${i}"><blockquote>${x.q.split(' ').map((w, j) => `<span style="--w:${j}">${esc(w)}</span>`).join(' ')}</blockquote><figcaption><b>${esc(x.w)}</b> · ${esc(x.r)}, ${esc(x.f)}</figcaption></figure>`).join('')}</div></div>
  <p class="rate" data-reveal><b>4,8</b> von 5 · 11 Google-Bewertungen · <a href="https://www.google.com/maps/search/?api=1&query=NetzKombyse&query_place_id=ChIJP2GS276FsUcRbSWqjQ9NfAE" target="_blank" rel="noopener">Bewertung lesen ↗</a></p></div></section>

<section class="sec" id="menschen"><div class="wr"><div class="two"><h2 data-chars data-reveal>Sie arbeiten direkt mit uns.</h2><p class="side" data-reveal>Jede Person hier ist Ihre direkte Ansprechpartnerin, Ihr direkter Ansprechpartner, vom ersten Gespräch bis zum Start.</p></div>
  <div class="tm" data-team><div class="tm-p" aria-hidden="true">${team.map(([n, r, im], i) => `<img class="tp${i === 0 ? ' on' : ''}" src="../media/team/${im}.webp" alt="" width="800" height="1000" loading="lazy">`).join('')}</div>
    <div class="tm-l" role="tablist" aria-label="Team">${team.map(([n, r, im, d], i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-i="${i}"><b>${esc(n)}</b><span>${esc(r)}</span><p>${esc(d)}</p></button>`).join('')}</div></div>
  <p class="tm-f" data-reveal>Dazu ein fest eingebundenes Team für Performance Marketing und Entwicklung.</p></div></section>

<section class="sec br" id="branchen"><div class="wr"><div class="two"><h2 data-chars data-reveal>Wir kennen Ihren Markt.</h2><p class="side" data-reveal>Sechs Branchen, in denen wir seit Jahren Shops, Marken und Kampagnen verantworten.</p></div>
  <ul class="bl">${branchen.map(([t, d], i) => `<li data-reveal style="--d:${i * 70}ms"><span class="n">${pad(i + 1)}</span><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join('')}</ul>
  <div class="ig"><p class="k">Integrationen</p><p class="igt">ERP, Warenwirtschaft, Versand und Zahlung: über 100 individuell entwickelte Prozesslösungen, angebunden an Ihre Systeme.</p><p class="igl">${integr.map(x => `<span>${esc(x)}</span>`).join('')}</p></div></div></section>

<section class="sec fd" id="foerderung"><div class="wr fd-g"><div><p class="k">Förderung</p><p class="fd-n" data-count="80" data-suffix=" %">80 %</p></div><div class="fd-t"><h2 data-chars data-reveal>Bis zu 80 % Zuschuss für Ihr Digitalprojekt.</h2><p class="s" data-reveal>Wir prüfen die Förderfähigkeit, wählen das Programm und begleiten den Antrag, akkreditiert für Programme des Bundes.</p><p class="ctas" data-reveal>${btn(`${W}/foerdermittel`, 'Fördergespräch')}<a class="cta ln" href="${W}/foerderrechner" target="_blank" rel="noopener"><span>Förderrechner</span><i aria-hidden="true">${ar}</i></a></p></div></div>
  <p class="aw2" data-reveal aria-label="Auszeichnungen">Unabhängig ausgezeichnet: ${C.awards.join(' · ')}</p></section>

<section class="sec" id="faq"><div class="wr"><div class="two"><h2 data-chars data-reveal>Was Entscheider wissen wollen.</h2><p class="side" data-reveal>Fragen und Antworten zur Zusammenarbeit.</p></div>
  <div class="faq">${C.faq.map((q, i) => `<details data-reveal style="--d:${i * 60}ms"${i === 0 ? ' open' : ''}><summary><span>${esc(q.q)}</span><i aria-hidden="true"></i></summary><p>${esc(q.a)}</p></details>`).join('')}</div></div></section>

<section class="sec end" id="kontakt"><div class="glow g2" aria-hidden="true"></div><div class="wr ctw"><div class="ctx"><p class="k">Kontakt</p><h2 class="b" data-chars data-reveal>Reden wir persönlich.</h2><p class="s" data-reveal>Lassen Sie uns herausfinden, ob die Chemie stimmt. Sie erreichen mich direkt: per Nachricht, am Telefon oder im Videotermin.</p>
  <p class="ctas" data-reveal>${btn(C.termin, 'Termin buchen')}</p>
  <ul class="cl" data-reveal><li><a href="${C.telHref}">${C.tel}</a></li><li><a href="mailto:ahoi@netzkombyse.de">ahoi@netzkombyse.de</a></li><li>${C.adresse[0]}, 22765 ${C.adresse[1]} · <a href="https://maps.google.com/?q=Harkortstraße+81,+22765+Hamburg" target="_blank" rel="noopener">Route ↗</a></li></ul></div>
  <figure class="gk" data-reveal><img class="g" src="../media/henning-pose.webp" alt="Henning Groß, Geschäftsführer" width="928" height="1152" loading="lazy" decoding="async"><figcaption>${C.ansprech.name}<span>${C.ansprech.rolle}</span></figcaption></figure></div></section>
</main>
<footer class="ft"><a class="ft-logo" href="index.html" aria-label="Startseite">${logo()}</a>
  <nav aria-label="Rechtliches"><a href="${W}/impressum" target="_blank" rel="noopener">Impressum</a><a href="${W}/datenschutz" target="_blank" rel="noopener">Datenschutz</a><a href="../index.html">Konzepte</a><a href="#top">Nach oben ↑</a></nav>
  <p class="ft-n">© NetzKombyse GmbH · Harkortstraße 81, Hamburg · Moin aus Hamburg: Hier ist es gerade <b data-clock>–</b> Uhr. Moin sagt man hier zu jeder Uhrzeit.</p></footer>`;
  return page({ k: 'k15', title: 'NetzKombyse · Konzept 15 Glut', desc: 'Konzept 15: Glut – Schwarz mit Orange-Verlauf, Möwe mit Blick, Disziplinen als Riesenzeilen, drehende Lage-Karten, vier Projektansichten, typografische Stimmen.', theme: '#000000', body });
}
export const pages = () => ({ 'index.html': index() });
