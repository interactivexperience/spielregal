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
const PROPS = {
  henning: '<path d="M14 62c0-22 16-38 36-38s36 16 36 38z"/><path d="M8 62h84c0 8-8 12-18 12H26c-10 0-18-4-18-12z"/><circle cx="50" cy="44" r="6"/><path d="M50 36v-4M42 30l8-6 8 6"/>',
  patrick: '<circle cx="50" cy="20" r="7"/><path d="M50 27v58M34 40h32M20 62c0 14 13 24 30 24s30-10 30-24M14 66l6-6 6 8M86 66l-6-6-6 8"/>',
  heiko: '<circle cx="50" cy="50" r="34"/><circle cx="50" cy="50" r="15"/><path d="M50 16v19M50 65v19M16 50h19M65 50h19M26 26l13 13M61 61l13 13M74 26L61 39M39 61L26 74"/>',
  felix: '<path d="M12 50c14-22 40-28 62-14l14-8-4 22 4 22-14-8C52 78 26 72 12 50z"/><circle cx="64" cy="42" r="2.5"/><path d="M30 38c4 8 4 16 0 24"/>',
  inga: '<path d="M38 88h24l-3-52H41zM41 36l-3-8h24l-3 8M44 20h12v8H44zM50 8v12M26 12l12 6M74 12L62 18"/><path d="M41 54h18M42 70h16"/>',
  mi: '<path d="M50 10v62M50 14c18 10 28 30 28 54H50M50 24c-12 8-20 22-22 40h22"/><path d="M14 76h72c-4 10-12 16-22 16H36c-10 0-18-6-22-16z"/>',
  tim: '<circle cx="50" cy="50" r="22"/><circle cx="50" cy="50" r="7"/><path d="M50 8v20M50 72v20M8 50h20M72 50h20M20 20l14 14M66 66l14 14M80 20L66 34M34 66L20 80"/><circle cx="50" cy="8" r="4"/><circle cx="50" cy="92" r="4"/><circle cx="8" cy="50" r="4"/><circle cx="92" cy="50" r="4"/>',
  stefan: '<circle cx="50" cy="50" r="38"/><path d="M50 18l8 32-8 32-8-32z"/><path d="M50 12v6M50 82v6M12 50h6M82 50h6"/><circle cx="50" cy="50" r="3"/>',
  claude: '<path d="M18 36h46l10-8v44l-10-8H18z"/><path d="M74 28h10v44H74"/><path d="M26 36v28M38 36v28"/><path d="M84 40h8M84 60h8"/>',
};
const marken = ['Bio Planète', 'Tout Terrain', 'K-Idol', 'Craft & Caviar', 'Grizzly', 'Beisser', 'Timkid', 'Elektrosil', 'PremiumWheels', 'dgina', 'Pechkeks', 'HWT', 'Abelmann', 'Wurstladen', 'Marktpirat', 'Sabro', 'Wein-Bauer', 'Kaffeekontor'];
const branchen = [['Food & Gastronomie', 'Marke, Direktvertrieb, Gastronomie.'], ['Medizin & Gesundheit', 'Medizintechnik, Kliniken, Verbände.'], ['B2B & Industrie', 'B2B, Corporate, Händlerportale.'], ['Heimtier', 'Hundemöbel, Futter, Markenentwicklung.'], ['Musik & Entertainment', 'Instrumente, K-Pop, Fachhandel.'], ['Mobilität & Handwerk', 'Reifen, Fahrräder, SHK-Leads.']];
const awards = [['usability', 'Shop Usability Award'], ['topshop', 'Top Shop 2024 (Auto Bild)'], ['trendshop', 'Trend Shop 2025 (Computer Bild)'], ['iwb', 'Internet World Business Shop-Award, Shortlist'], ['', 'Carlsberg Preis']];
const integr = ['Pickware', 'JTL', 'Shopify', 'Mollie', 'Sendcloud', 'Hive', 'VARIO', 'xentral', 'Sage', 'HQS ProfiSoft', 'Haufe X360'];
const leist = [
  { t: 'Technologie & Shop', href: `${W}/e-commerce`, d: 'Ihr Shop als Wachstumsmaschine: skalierbar, integriert, zukunftsfähig.', c: ['Shopware & Shopify', 'Shop-Migration', 'ERP-, PIM- & CRM-Anbindung', 'Individuelle Module', 'Barrierefreiheit (BFSG)', 'KI-gestützte Suche'] },
  { t: 'Kommunikation & Marke', href: `${W}/brand-ux-ui`, d: 'Marke, UX und Content aus einem Guss: ein Gesicht über alle Kanäle.', c: ['Markenstrategie', 'UX / UI', 'Video & Content', 'Markenstimme & Wording', 'Social Media', 'Recruiting-Kampagnen'] },
  { t: 'Marketing & Performance', href: `${W}/marketing`, d: 'Sichtbarkeit, die sich rechnet: gemessen an Umsatz, nicht an Klicks.', c: ['SEO & AI-Sichtbarkeit', 'Google Ads & META', 'Newsletter', 'Tracking & Analytics', 'E-Mail-Automation', 'Dialogpost'] },
];
const faq = [
  { q: 'Welche Agentur in Hamburg baut Shops auf Shopware 6 für B2B und B2C?', a: 'Wir. Seit über 15 Jahren entwickeln wir Shops für den Mittelstand, von der Beratung über die Anbindung an ERP, PIM und CRM bis zum laufenden Betrieb. Ihre Ansprechperson kennt Ihr Geschäft und bleibt dieselbe.' },
  { q: 'Für wen sind wir der richtige Partner, für wen eher nicht?', a: 'Sehr gut passen wir, wenn E-Commerce für Ihr Wachstum zentral ist, Sie Systeme anbinden müssen und einen verlässlichen Partner auf Augenhöhe suchen. Weniger gut passen wir, wenn nur der günstigste Preis zählt, ein fertiges Template genügt oder niemand im Haus Entscheidungen treffen kann.' },
  { q: 'Was unterscheidet uns von anderen Shopware-Agenturen?', a: 'Wir denken in Architektur statt in Einzeltickets. Wir verbinden Technik, Performance-Marketing und Beratung. Wir sind auf Shopware 6 spezialisiert, sprechen direkt mit Ihnen und messen unsere Arbeit an Ergebnissen.' },
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
// Case-Kacheln „Tiefe“ (Mi-Wahl 25.11.2026): echte Screens als 3D-Ebenen, Motiv vorn, Chips mit Fakten; kippt mit dem Cursor.
// scr = hinterste Ebene (t = Hochformat), mid = UI-Ausschnitt [links, oben, Breite in %], cut = Motiv [links, unten, Breite in %], ch = Chips [Text, Zusatz, Plakette]
const kacheln = [
  { c: 1, img: 'tout', s: 'Ein Shop, so robust wie die Räder, die er verkauft.', mid: [52, 38, 38], cut: [-14, -6, 72], ch: [['Shop Usability Award', 'nominiert 2025', 'b1'], ['Shop Award 2020', '', 'b2']] },
  { c: 7, img: 'beisser', s: 'Feinste Fleischwaren, mit dem Daumen bestellt.', mid: [3, 58, 54], cut: [40, -6, 62], ch: [['Gutschein direkt im Warenkorb'], ['Gegründet 1836']] },
  { c: 0, img: 'premiumwheels', t: 1, s: 'Original-Felgen, die in drei Schritten zum Auto passen.', mid: [36, 30, 46], cut: [-12, -4, 66], ch: [['Top Shop 2024', 'Auto Bild', 'b1'], ['Trend Shop 2025', 'Computer Bild', 'b2']] },
  { c: 2, img: 'weinbauer', s: '50 Jahre Weinhandel, jetzt auf allen Kanälen.', mid: [5, 50, 40], cut: [58, -8, 34], ch: [['Shop, Social, Verkaufswagen'], ['50 Jahre Weinhandel']] },
  { c: 3, img: 'abelmann', s: 'Fangfrisch bestellt, gekühlt an der Haustür.', mid: [3, 40, 56], cut: [42, -6, 62], ch: [['Lieferstatus per SMS'], ['Gekühlt bis an die Haustür']] },
  { c: 6, img: 'sabro', s: 'Hundesofas, so gemütlich wie ihr Ruf.', mid: [6, 34, 30], cut: [42, -2, 60], ch: [['Empfohlen von Martin Rütter'], ['Geld-zurück-Garantie']] },
  { c: 4, img: 'truckline', s: 'Lightbars für Trucks, Schritt für Schritt konfiguriert.', mid: [50, 32, 46], cut: [-4, 2, 64], ch: [['Konfigurator in drei Schritten'], ['Alle großen Lkw-Marken']] },
  { c: 5, img: 'pechkeks', s: 'Fiese Kekse brauchen einen frechen Shop.', mid: [4, 52, 66], cut: [24, -4, 60], ch: [['Shop Usability Award', 'Top 2017', 'b1'], ['Shop Award 2016', 'Shortlist', 'b2']] },
];
const pc = a => a.map(v => v + '%');
const kachel = (k, i) => { const c = cases[k.c], m = pc(k.mid), u = pc(k.cut), M = `../media/kc/${k.img}`;
  const chip = (x, j) => `<span class="kc-ch kc-ch${j + 1}">${x[2] ? `<img src="${M}-${x[2]}.webp" alt="" loading="lazy">` : '<b aria-hidden="true"></b>'}${esc(x[0])}${x[1] ? ` <em>${esc(x[1])}</em>` : ''}</span>`;
  return `<li class="kc${i % 2 ? ' lo' : ''}" data-kc><a href="${W}/${c[4]}" target="_blank" rel="noopener" aria-label="${esc(c[1])}: ${esc(k.s)}">
  <div class="kc-st"><span class="kc-tag">${esc(c[3])}</span><div class="kc-sc">
    <img class="kc-ly kc-scr${k.t ? ' t' : ''}" src="${M}-scr.webp" alt="" loading="lazy" decoding="async" draggable="false">
    <img class="kc-ly kc-mid" src="${M}-mid.webp" alt="" loading="lazy" decoding="async" draggable="false" style="left:${m[0]};top:${m[1]};width:${m[2]}">
    <img class="kc-ly kc-cut" src="../media/cut/${k.img}.webp" alt="" loading="lazy" decoding="async" draggable="false" style="left:${u[0]};bottom:${u[1]};width:${u[2]}">
    ${k.ch.map(chip).join('')}</div></div>
  <h3 class="kc-s">${esc(k.s)}</h3>
  <p class="kc-d"><b>${esc(c[1])}</b><span>${esc(c[2])}</span></p><span class="kc-l">Projekt ansehen <i aria-hidden="true">${ar}</i></span></a></li>`; };
// Projektwand: [Projekt-Index, Breite, Höhe, x, y, Tiefe, Bildausschnitt]
const wallTiles = [
  [2, 520, 360, 120, 90, 1.15, '50% 40%'], [0, 380, 520, 700, 40, .85, '40% 50%'], [5, 440, 300, 1130, 150, 1.2, '50% 60%'], [1, 560, 380, 1620, 60, .9, '30% 50%'], [7, 380, 380, 2180, 130, 1.1, '60% 50%'],
  [3, 400, 280, 60, 560, .9, '20% 50%'], [4, 560, 400, 520, 520, 1.1, '50% 30%'], [6, 360, 500, 1140, 560, .8, '70% 50%'], [0, 520, 340, 1540, 600, 1.2, '50% 70%'], [2, 360, 260, 2100, 600, .95, '80% 30%'],
  [5, 420, 300, 140, 960, 1.05, '50% 20%'], [7, 520, 360, 720, 1000, .9, '40% 40%'],
];
const caseLink = (c, cls, inner) => `<a class="${cls}" href="${W}/${c[4]}" target="_blank" rel="noopener" aria-label="${esc(c[1])}: ${esc(c[2])}">${inner}</a>`;
const marq = ['Shopware', 'Shopify', 'Headless', 'Migration', 'Marke', 'UX / UI', 'SEO', 'AI-Sichtbarkeit', 'Performance', 'ERP · PIM · CRM'];
const logoOf = { 'Bio Planète': 'bioplanete.svg', 'Tout Terrain': 'touttterrain.svg', 'K-Idol': 'kidol.svg', 'Craft & Caviar': 'craftandcaviar.svg', 'Grizzly': 'grizzly.svg', 'Beisser': 'beisser.webp', 'Timkid': 'timkid.svg', 'Elektrosil': 'elektrosil.svg', 'PremiumWheels': 'premiumwheels.webp', 'dgina': 'dgina.svg', 'Pechkeks': 'pechkeks.webp', 'HWT': 'hwt.svg', 'Abelmann': 'abelmann.svg', 'Wurstladen': 'wurstladen.svg', 'Marktpirat': 'marktpirat.svg', 'Sabro': 'sabro.svg', 'Wein-Bauer': 'weinbauer.svg', 'Kaffeekontor': 'kaffeekontor.svg' };
const row = a => [...a, ...a].map(x => `<span class="bn">${esc(x)}</span><i aria-hidden="true">✦</i>`).join('');

const fragen = [
  { q: 'Verstehen Sie mein Geschäft?', a: 'Ja. Wir kommen aus dem Vertrieb.', d: 'Hennings Wurzeln liegen im klassischen Vertrieb, und das merken Sie. Wir fragen zuerst nach Ihren Kunden, Ihren Margen und Ihren Abläufen und erst danach nach der Technik. Sechs Branchen kennen wir von innen.', c: C.branchen, l: 'Referenzen ansehen', href: '#arbeit' },
  { q: 'Mit wem arbeite ich?', a: 'Mit Menschen, nicht mit Tickets.', d: 'Sie haben feste Ansprechpersonen, die entscheiden dürfen. Es gibt keinen Account-Manager dazwischen.', c: ['Strategie', 'Entwicklung', 'Marke', 'Marketing'], l: 'Das Team kennenlernen', href: '#menschen' },
  { q: 'Was können Sie für mich bauen?', a: 'Shops, die zu Ihren Systemen passen.', d: 'Wir entwickeln auf Shopware 6 und Shopify, binden ERP, PIM und CRM an und bauen, was Ihr Tagesgeschäft braucht. Über 100 individuelle Prozesslösungen laufen bei unseren Kunden.', c: ['Shopware & Shopify', 'Shop-Migration', 'ERP-, PIM- & CRM-Anbindung', 'Barrierefreiheit (BFSG)', 'KI-gestützte Suche'], l: 'Technologie & Shop', href: `${W}/e-commerce` },
  { q: 'Rechnet sich das?', a: 'Wir messen am Umsatz, nicht an Klicks.', d: 'Ein Shop ist erst gut, wenn er verkauft. Deshalb verantworten wir auch Sichtbarkeit und Kampagnen und zeigen Ihnen, was sie bringen, in Zahlen, die Sie nachprüfen können.', c: ['SEO & AI-Sichtbarkeit', 'Google Ads & META', 'Tracking & Analytics', 'Newsletter'], l: 'Marketing & Performance', href: `${W}/marketing` },
  { q: 'Arbeiten Sie mit KI?', a: 'Ja. KI beschleunigt, Menschen prüfen.', d: 'Wir setzen KI gezielt ein, um schneller und besser zu liefern: bei Recherche, Entwicklung, Content und Auswertung. Die Qualitätssicherung bleibt Menschensache. Jede Zeile Code, jedes Bild und jede Zahl prüft ein Mensch, bevor sie zu Ihnen kommt.', c: ['Qualitätssicherung durch Menschen'], l: 'Mehr zu Technologie & Shop', href: `${W}/e-commerce` },
  { q: 'Gibt es Zuschüsse?', a: 'Bis zu 80 % Zuschuss sind möglich.', d: 'Wir sind akkreditierter Partner für Förderprogramme des Bundes. Wir prüfen mit Ihnen, ob Sie förderfähig sind, wählen das passende Programm und begleiten den Antrag bis zum Nachweis.', l: 'Förderrechner öffnen', href: `${W}/foerderrechner` },
  { q: 'Wer vertraut Ihnen?', a: 'Wer uns kennt, bleibt.', d: 'Unsere längste Kundenbeziehung dauert 14 Jahre. Die Marken unten und die Stimmen zeigen, wie das aussieht.', l: 'Alle Referenzen', href: `${W}/references` },
  { q: 'Und wenn es mal brennt?', a: 'Dann sind wir erreichbar.', d: 'Sie rufen an, und es meldet sich jemand, der Ihr Projekt kennt. Nach dem Start bleiben wir an Ihrer Seite, mit Support, Betrieb und Weiterentwicklung.', l: 'Mit Henning sprechen', href: C.termin },
];
function index() {
  const body = `<div id="top"></div><div class="prog" aria-hidden="true"></div><div class="spot" aria-hidden="true"></div><div class="spot spot2" aria-hidden="true"></div><div class="spot spot3" aria-hidden="true"></div>
<header class="hd"><a class="hd-logo" href="index.html" aria-label="NetzKombyse – Startseite">${logo()}</a>
  <nav class="hd-nav" aria-label="Hauptnavigation"><a href="#fragen">Ihre Fragen</a><a href="#arbeit">Referenzen</a><a href="#menschen">Team</a><a href="#kontakt">Kontakt</a></nav>
  <div class="hd-r"><button class="mt lt" type="button" data-light aria-pressed="false" title="Lichtpunkt: ein warmer Lichtfleck folgt dem Zeiger"><span class="mt-i" aria-hidden="true"></span><span>Licht</span></button>
  <button class="mt" type="button" data-motion-toggle aria-pressed="true" title="Animationen ein- oder ausschalten"><span class="mt-i" aria-hidden="true"></span><span data-motion-label>Bewegung an</span></button></div></header>
<main id="main">
<section class="hero" aria-labelledby="h1">
  <div class="glow" aria-hidden="true"></div>
  <p class="k" data-reveal>Moin, wir sind die NetzKombyse aus Hamburg</p>
  <h1 id="h1" data-chars data-reveal>Ihr Onlineshop<br>in guten<br>Händen.</h1>
  <p class="s" data-reveal>Technik, Marke und Marketing aus einer Hand, von Menschen, die Sie persönlich kennen. KI macht uns schneller, jedes Ergebnis prüft ein Mensch.</p>
  <p class="ctas" data-reveal>${btn(C.termin, 'Termin buchen')}${btn('#fragen', 'Ihre Fragen', 'alt')}</p>
  <div class="gwrap" data-gull aria-hidden="true"><div class="gfl"></div><div class="gb"><img src="../media/moewe-cut-l.webp" alt="" width="832" height="1232" decoding="async"></div><div class="gw"><img src="../media/moewe-cut-l.webp" alt="" width="832" height="1232" decoding="async"></div><div class="gh"><img src="../media/moewe-cut-l.webp" alt="" width="832" height="1232" decoding="async"><i class="lid"></i></div></div>
</section>

<section class="facts" aria-label="Zahlen"><ul>
  <li data-reveal><strong data-dur="600" data-count="${C.jahre}" data-suffix="+">${C.jahre}+</strong><span>Jahre E-Commerce</span></li>
  <li data-reveal style="--d:90ms"><strong data-dur="600" data-count="14">14</strong><span>Jahre längste Kundenbeziehung</span></li>
  <li data-reveal style="--d:180ms"><strong data-dur="600" data-count="${C.zahlen.marken}">${C.zahlen.marken}</strong><span>Marken vertrauen uns</span></li></ul>
</section>

<section class="sec" id="fragen"><div class="wr"><p class="k kc">Ihre Fragen</p><div class="two"><h2 data-chars data-reveal>Was Sie wissen wollen, bevor Sie uns anrufen.</h2></div>
  <ol class="acc">${fragen.map((f, i) => `<li class="${i === 0 ? 'open' : ''}" data-reveal style="--d:${i * 70}ms"><button type="button" aria-expanded="${i === 0}" aria-controls="p${i}"><span class="n qn">${esc(f.q)}</span><b>${esc(f.a)}</b><i class="ar" aria-hidden="true"></i></button><div id="p${i}" class="pn" ${i === 0 ? '' : 'hidden'}><p>${esc(f.d)}</p>${f.c ? `<span class="chs">${f.c.map(x => `<span>${esc(x)}</span>`).join('')}</span>` : ''}<a class="more" href="${f.href}"${ext(f.href)}>${esc(f.l)} ${ar}</a></div></li>`).join('')}</ol></div></section>

<div class="mqs" role="group" aria-label="Marken, für die wir arbeiten"><p class="k mk">Diese Marken arbeiten mit uns.</p><p class="mq a" aria-hidden="true"><span class="mq-t" data-mq="-1">${row(marken.slice(0, 9))}</span></p><p class="mq b" aria-hidden="true"><span class="mq-t" data-mq="1">${row(marken.slice(9))}</span></p></div>

<section class="sec" id="arbeit"><div class="wr"><p class="k kc">Das haben wir gebaut</p><div class="two"><h2 data-chars data-reveal>Projekte, die bleiben.</h2><p class="side" data-reveal>Tippen Sie ein Projekt an und sehen Sie, wie wir vorgegangen sind.</p></div>
  <div class="gal" data-gal="kc"><ul class="kcs">${kacheln.map(kachel).join('')}</ul></div>
  <p class="all" data-reveal>${btn(`${W}/references`, 'Alle Referenzen', 'alt')}</p></div>
  <div class="pv" aria-hidden="true"><img alt="" width="1024" height="675"></div><span class="pc" aria-hidden="true">${ar}</span></section>

<section class="sec vs" id="stimmen" aria-label="Was Kunden sagen"><div class="wr"><p class="k">Das sagen Kunden</p>
  <div class="vs-g" data-voices>
    <div class="vn" role="tablist" aria-label="Stimme wählen">${stimmen.map((x, i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-i="${i}"><img src="../media/clients/${x.i}.webp" alt="" width="56" height="56" loading="lazy"><span><b>${esc(x.w)}</b><em>${esc(x.f)}</em></span><i aria-hidden="true"></i></button>`).join('')}</div>
    <div class="vq-w"><span class="qm" aria-hidden="true">„</span>${stimmen.map((x, i) => `<figure class="vq${i === 0 ? ' on' : ''}" data-i="${i}"><blockquote>${x.q.split(' ').map((w, j) => `<span style="--w:${j}">${esc(w)}</span>`).join(' ')}</blockquote><figcaption><b>${esc(x.w)}</b> · ${esc(x.r)}, ${esc(x.f)}</figcaption></figure>`).join('')}</div></div>
  <p class="rate" data-reveal><b>4,8</b> von 5 · 11 Google-Bewertungen · <a href="https://www.google.com/maps/search/?api=1&query=NetzKombyse&query_place_id=ChIJP2GS276FsUcRbSWqjQ9NfAE" target="_blank" rel="noopener">Bewertung lesen ↗</a></p></div></section>

<section class="sec awd" id="awards" aria-label="Auszeichnungen"><div class="wr">  <div class="aw2 aw3" data-reveal><p class="k">Unabhängig bestätigt</p><ul class="awl">${awards.map(([f, t], i) => `<li style="--i:${i}"><div class="awc" tabindex="0"><div class="awf">${f ? `<img src="../media/awards/${f}.webp" alt="${esc(t)}" loading="lazy" decoding="async">` : `<span class="awt">${esc(t)}</span>`}</div><div class="awb" aria-hidden="true"><b>${esc(t)}</b></div></div></li>`).join('')}</ul></div></div></section>

<section class="sec" id="menschen"><div class="wr"><p class="k kc">Das Team</p><div class="two"><h2 data-chars data-reveal>Sie arbeiten direkt mit uns.</h2><p class="side" data-reveal>Jede Person hier ist Ihre direkte Ansprechperson, vom ersten Gespräch bis zum Start. Mit Henning sind unsere Kunden ohnehin per Du: Sagen Sie einfach Henning.</p></div>
  <div class="ts-w" data-tcar><div class="ts" aria-live="polite">${team.map(([n, r, im, d], i) => `<article class="tsl${i === 0 ? ' on' : ''}" data-i="${i}"><span class="tsb" aria-hidden="true">${esc(n.split(' ')[0])}</span><span class="tsg" aria-hidden="true"></span><svg class="tsp" viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${PROPS[im] || ''}</svg><img src="../media/team-cut/${im}.webp" alt="${esc(n)}" width="800" height="1000" loading="lazy" decoding="async"><div class="tst"><p class="tsn">${pad(i + 1)} / ${pad(team.length)}</p><h3>${esc(n)}</h3><p class="tg-r">${esc(r)}</p><p class="tg-d">${esc(d)}</p></div></article>`).join('')}</div>
  <div class="tsr" role="tablist" aria-label="Team">${team.map(([n, r, im], i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-i="${i}" aria-label="${esc(n)}, ${esc(r)}"><img src="../media/team-cut/${im}.webp" alt="" width="200" height="250" loading="lazy"><span>${esc(n.split(' ')[0])}</span></button>`).join('')}</div></div>
  <p class="tm-f" data-reveal>Dazu ein fest eingebundenes Team für Performance Marketing und Entwicklung.</p></div></section>

<section class="sec end" id="kontakt"><div class="glow g2" aria-hidden="true"></div><div class="wr ctw"><div class="ctx"><p class="k">Der nächste Schritt</p><h2 class="b" data-chars data-reveal>Reden wir persönlich.</h2><p class="s" data-reveal>Ich bin Henning. Rufen Sie an, schreiben Sie mir oder buchen Sie einen Termin. Dann finden wir gemeinsam heraus, ob die Chemie stimmt.</p>
  <p class="who" data-reveal><b>${C.ansprech.name}</b> · ${C.ansprech.rolle}</p>
  <p class="ctas" data-reveal>${btn(C.termin, 'Termin buchen')}</p>
  <ul class="cl" data-reveal><li><i class="ci"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></i><span><em>Telefon</em><a href="${C.telHref}">${C.tel}</a></span></li><li><i class="ci"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 6l8.5 7 8.5-7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></i><span><em>E-Mail</em><a href="mailto:ahoi@netzkombyse.de">ahoi@netzkombyse.de</a></span></li><li><i class="ci"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></i><span><em>Videotermin</em><a href="${C.termin}" target="_blank" rel="noopener">30 Minuten, unverbindlich</a></span></li><li><i class="ci"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="9.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></i><span><em>Büro</em><a href="https://maps.google.com/?q=Harkortstraße+81,+22765+Hamburg" target="_blank" rel="noopener">${C.adresse[0]}, 22765 ${C.adresse[1]}</a></span></li></ul></div>
  <p class="moin">Moin aus Hamburg: Hier ist es gerade <b data-clock>–</b> Uhr. Moin sagt man hier zu jeder Uhrzeit.</p>
  <figure class="gk" data-reveal><img class="g" src="../media/henning-pose.webp" alt="Henning Groß, Geschäftsführer" width="928" height="1152" loading="lazy" decoding="async"></figure></div></section>
</main>
<footer class="ft"><a class="ft-logo" href="index.html" aria-label="Startseite">${logo()}</a>
  <nav aria-label="Wissen"><a href="${W}/logbuch" target="_blank" rel="noopener">Logbuch</a><a href="${W}/shopify-shopware-kostenvergleich" target="_blank" rel="noopener">Shopify vs. Shopware</a><a href="${W}/shopware-template-vs-headless" target="_blank" rel="noopener">Template vs. Headless</a></nav>
  <nav aria-label="Rechtliches"><a href="${W}/impressum" target="_blank" rel="noopener">Impressum</a><a href="${W}/datenschutz" target="_blank" rel="noopener">Datenschutz</a><a href="../index.html">Konzepte</a><a href="#top">Nach oben ↑</a></nav>
  <p class="ft-n">© NetzKombyse GmbH · Harkortstraße 81, Hamburg</p></footer>`;
  const html = page({ k: 'k18', title: 'NetzKombyse · Konzept 18 Glut für Kunden', desc: 'Konzept 18: Glut aus Kundensicht – acht Fragen, große Antworten, mehr per Klick. Glut – Schwarz mit Orange-Verlauf, Möwe mit Blick, Disziplinen als Riesenzeilen, drehende Lage-Karten, vier Projektan', theme: '#000000', body });
  return html
    .replace('</head>', `<link rel="preload" href="../fonts/bricolage.woff2" as="font" type="font/woff2" crossorigin>\n<link rel="preload" href="../fonts/sora.woff2" as="font" type="font/woff2" crossorigin>\n<link rel="preload" href="../media/moewe-cut-l.webp" as="image" fetchpriority="high">\n</head>`)
    .replace('</head>', `<script type="importmap">{"imports":{"three":"../shared/three/three.module.min.js","three/addons/":"../shared/three/addons/"}}</script>\n</head>`)
    .replace('</body>', `<script>if(location.search.indexOf('3d')>-1)import('./gull3d.js')</script>\n</body>`);
}
export const pages = () => ({ 'index.html': index() });
