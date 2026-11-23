// Konzept 2 · MAGAZIN – Typografie vor Bild, Sektionen als Rubriken einer Ausgabe.
import { C } from '../content.mjs';
import { page, logo, mark, esc } from './lib.mjs';

const NR = 15; // „Ausgabe Nº 15“ = Jahre am Markt
const header = () => `<header class="hd">
  <a class="hd-logo" href="index.html" aria-label="NetzKombyse – Startseite">${logo()}</a>
  <p class="hd-issue" aria-hidden="true">Ausgabe Nº ${NR} <i></i> Hamburg <i></i> Digitaler Commerce</p>
  <div class="hd-r">
    <button class="mt" type="button" data-motion-toggle aria-pressed="true" title="Animationen ein- oder ausschalten"><span data-motion-label>Bewegung an</span><span class="sw" aria-hidden="true"><i></i></span></button>
    <button class="burger" type="button" data-menu-open aria-expanded="false" aria-controls="menu"><span>Inhalt</span><span class="bl" aria-hidden="true"><i></i><i></i></span></button>
  </div></header>
<p class="rail" aria-hidden="true"><span data-rail-n>01</span><i></i><span data-rail-t>Titel</span></p>`;

const menu = () => `<div id="menu" class="menu" role="dialog" aria-modal="true" aria-label="Inhaltsverzeichnis" aria-hidden="true">
  <div class="menu-in">
    <p class="menu-h">Inhalt <em>Ausgabe Nº ${NR}</em></p>
    <button class="menu-x" type="button" data-menu-close aria-label="Menü schließen"><span>Schließen</span><i aria-hidden="true"></i></button>
    <nav class="menu-nav" aria-label="Hauptnavigation"><ol>${C.menue.map((m, i) => `<li><a href="${m.href}"><span class="mn">${String(i + 1).padStart(2, '0')}</span><span class="mt2">${esc(m.t)}</span><span class="mp" aria-hidden="true">S. ${(i + 1) * 12 - 4}</span></a>
      <p class="ms">${m.sub.slice(0, 5).map(s => `<a href="${m.href}">${esc(s)}</a>`).join('')}</p></li>`).join('')}</ol></nav>
    <aside class="menu-side">
      <div class="cover" aria-hidden="true"><span>Nº ${NR}</span>${mark()}<b>Handel<br>mit <em>Haltung.</em></b></div>
      <p>Moin! Reden wir. Persönlich.</p>
      <a class="btn btn-ac" href="index.html#kontakt">Projekt anfragen</a>
      <a class="menu-tel" href="${C.telHref}">${C.tel}</a>
      <p class="menu-ad">${C.adresse.join(', ')}</p>
    </aside>
  </div></div>`;

const footer = () => `<footer class="ft"><div class="ft-in">
  <div><a class="ft-logo" href="index.html" aria-label="Startseite">${logo()}</a><p>${C.adresse.join(', ')}<br><a href="${C.telHref}">${C.tel}</a><br>Fax haben wir abgeschafft.</p></div>
  <div><p class="ft-k">Impressum der Redaktion</p><p>Chefredaktion: ${C.ansprech.name}, ${C.ansprech.rolle}.<br>${C.zahlen.team} Menschen, ${C.jahre}+ Jahre.</p></div>
  <div><p class="ft-k">Service</p><p><a href="#">Impressum</a> · <a href="#">Datenschutz</a><br><a href="../index.html">Konzept wechseln</a> · <a href="#top">Nach oben</a></p></div>
  <p class="ft-n">${C.hinweisBeispiel} Zitate sinngemäß bzw. Platzhalter.</p></div></footer>`;

const pt = `<div class="pt" aria-hidden="true"><i></i><i></i></div>`;
const shell = (b, extra = '') => `<div id="top"></div>${header()}${menu()}${pt}<main id="main">${b}</main>${extra}${footer()}`;
const split = (t, tag = 'h2', cls = '') => `<${tag} class="${cls}" data-split>${esc(t)}</${tag}>`;
const sh = (n, k, t) => `<header class="rb"><p class="rb-k" data-reveal><span>${n}</span>${esc(k)}</p>${split(t)}</header>`;
const art = (i) => { const c = ['#B8421F', '#15110E', '#D9A441', '#6F7B62', '#C9886B', '#2F4A5C', '#8A3B52'][i % 7];
  const shapes = [`<circle cx="100" cy="100" r="70" fill="${c}"/>`, `<path d="M30 190V90a70 70 0 0 1 140 0v100z" fill="${c}"/>`, `<rect x="30" y="30" width="140" height="140" fill="${c}" transform="rotate(12 100 100)"/>`, `<path d="M100 20L180 180H20z" fill="${c}"/>`, `<g fill="${c}"><circle cx="60" cy="100" r="40"/><circle cx="140" cy="100" r="40"/></g>`, `<path d="M20 100a80 80 0 0 1 160 0z" fill="${c}"/><path d="M20 110h160v70H20z" fill="${c}" opacity=".5"/>`, `<g stroke="${c}" stroke-width="14" fill="none"><path d="M30 60h140M30 100h140M30 140h140"/></g>`][i % 7];
  return `<svg viewBox="0 0 200 200" aria-hidden="true">${shapes}</svg>`; };

function index() {
  const manifest = 'Wir bauen keine Seiten. Wir bauen Systeme, die in fünf Jahren noch tragen – für Unternehmen, die mehr vorhaben, und für Inhaber, die einen Partner suchen statt eines Dienstleisters.';
  const body = `
<section class="cover-s" data-ch="Titel" aria-labelledby="h1">
  <div class="mast"><p>Das Magazin für Handel, der bleibt</p><p>Hamburg · seit mehr als ${C.jahre} Jahren</p></div>
  <h1 id="h1"><span class="l1" data-split>Handel mit</span><span class="l2" data-split><em>Haltung.</em></span></h1>
  <svg class="badge" viewBox="0 0 200 200" aria-hidden="true"><defs><path id="cir" d="M100 100m-78 0a78 78 0 1 1 156 0a78 78 0 1 1-156 0"/></defs><text><textPath href="#cir" startOffset="0">Digitaler Commerce · Für Unternehmen, die mehr vorhaben · Hamburg ·</textPath></text><g class="bm">${'<circle cx="100" cy="100" r="34"/>'}<path d="M100 74v52M74 100h52"/></g></svg>
  <div class="cover-g">
    <p class="standfirst" data-reveal>Digitaler Commerce für mittelständische, inhabergeführte Unternehmen. Strategische Beratung, Shop-Entwicklung, Marke und Performance – von Menschen, die Ihnen auch in drei Jahren noch ans Telefon gehen.</p>
    <nav class="inside" aria-label="In dieser Ausgabe" data-reveal><p>In dieser Ausgabe</p><ol><li><a href="#leitartikel"><b>04</b>Warum wir bleiben</a></li><li><a href="#inhalt"><b>12</b>Drei Disziplinen, ein Ziel</a></li><li><a href="#titel"><b>20</b>Titelgeschichten: Sieben Projekte</a></li><li><a href="#redaktion"><b>38</b>Wer hier arbeitet</a></li></ol></nav>
    <div class="cta" data-reveal><a class="btn btn-ink" href="#kontakt">Gespräch vereinbaren</a><a class="lnk" href="case.html">Titelstory lesen</a></div>
  </div>
</section>

<section class="marq" aria-label="Kunden"><div><span>${C.marken.map(m => esc(m)).join('</span><i>/</i><span>')}</span><i>/</i></div><div aria-hidden="true"><span>${C.marken.map(m => esc(m)).join('</span><i>/</i><span>')}</span><i>/</i></div></section>

<section class="lead-s" id="leitartikel" data-ch="Leitartikel">
  <div class="wrap">
    <p class="rb-k"><span>01</span>Leitartikel</p>
    <p class="manifest" data-fill>${esc(manifest)}</p>
    <div class="honest" data-reveal><p class="rb-k">Ehrlicherweise</p><p>Wenn „möglichst billig“ wichtiger ist als „langfristig sinnvoll“, sind wir die falsche Adresse. Wenn Sie einen Partner suchen, der mitdenkt und widerspricht, sollten wir reden.</p></div>
  </div>
</section>

<section class="toc" id="inhalt" data-ch="Inhalt"><div class="wrap">
  ${sh('02', 'Inhalt', 'Drei Disziplinen, ein Ziel: digitaler Vertrieb, der sich rechnet.')}
  <ol class="tocl">${C.disziplinen.map((d, i) => `<li data-reveal><a href="${d.href}" data-peek="${i}"><span class="tn">0${i + 1}</span><span class="tt">${esc(d.t)}</span><span class="td">${esc(d.d)}</span><span class="tp" aria-hidden="true">S. ${12 + i * 8}</span></a></li>`).join('')}</ol>
  <ul class="four">${C.saeulen.map(s => `<li data-reveal><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p></li>`).join('')}</ul>
</div></section>

<section class="sit" data-ch="Ausgangslage"><div class="wrap">
  ${sh('03', 'Ausgangslage', 'Drei Situationen, die wir kennen.')}
  <div class="sit-g">${C.lagen.map((l, i) => `<article data-reveal style="--d:${i * 90}ms"><span class="big-i" aria-hidden="true">${['I', 'II', 'III'][i]}</span><h3>${esc(l.t)}</h3><p>${esc(l.d)}</p></article>`).join('')}</div>
</div></section>

<section class="stories" id="titel" data-ch="Titelgeschichten"><div class="wrap">
  ${sh('04', 'Titelgeschichten', 'Sieben Projekte, die wir mit Stolz zeigen.')}</div>
  <div class="stack">${C.cases.map((c, i) => `<a class="card c${i % 5}" style="--i:${i}" href="${c.featured ? 'case.html' : '#titel'}" ${c.featured ? '' : 'aria-disabled="true"'}>
    <div class="card-t"><p class="card-m"><span>Nº ${String(i + 1).padStart(2, '0')}</span><span>${esc(c.typ)}</span><span>${esc(c.branche)}</span></p><h3>${esc(c.t)}</h3><p class="card-go">${c.featured ? 'Titelstory lesen' : 'Im Prototyp nicht ausgebaut'}<span aria-hidden="true">→</span></p></div>
    <div class="card-a">${art(i)}</div></a>`).join('')}</div>
</section>

<section class="nums" data-ch="In Zahlen"><div class="wrap"><ul>
  <li data-reveal><b data-count="${C.jahre}" data-suffix="+">${C.jahre}+</b><span>Jahre Erfahrung</span></li>
  <li data-reveal><b data-count="${C.zahlen.marken}">${C.zahlen.marken}</b><span>Kundenmarken</span></li>
  <li data-reveal><b data-count="${C.prozessloesungen}" data-suffix="+">${C.prozessloesungen}+</b><span>individuelle Prozesslösungen</span></li>
  <li data-reveal><b>${C.bewertung.wert}</b><span>bei ${C.bewertung.anzahl} Google-Bewertungen</span></li></ul></div></section>

<section class="letters" data-ch="Leserbriefe"><div class="wrap">
  ${sh('05', 'Leserbriefe', 'Was unsere Kunden schreiben.')}
  ${C.stimmen.map((s, i) => `<figure class="lt lt${i}" data-reveal><blockquote>${esc(s.q)}</blockquote><figcaption><b>${esc(s.w)}</b> · ${esc(s.f)}</figcaption></figure>`).join('')}
</div></section>

<section class="staff" id="redaktion" data-ch="Redaktion"><div class="wrap">
  ${sh('06', 'Redaktion', 'Sie arbeiten direkt mit uns.')}
  <div class="staff-g">
    <article class="chief" data-reveal><p class="rb-k">Chefredaktion</p><h3>${C.ansprech.name}</h3><p>${C.ansprech.rolle}. Ihr Ansprechpartner – von der ersten Frage bis zum Betrieb.</p><p class="cta"><a class="btn btn-ink" href="${C.telHref}">Anrufen</a><a class="btn btn-line" href="${C.termin}">Termin buchen</a></p></article>
    <ul class="roles">${C.rollen.slice(1).map((r, i) => `<li data-reveal style="--d:${(i % 5) * 40}ms"><span>Ressort</span>${esc(r)}</li>`).join('')}</ul>
  </div>
</div></section>

<section class="ress" data-ch="Ressorts" aria-label="Branchen und Integrationen">
  <div class="rowm"><div>${C.branchen.map(b => `<span>${esc(b)}</span>`).join('<i>✦</i>')}<i>✦</i></div><div aria-hidden="true">${C.branchen.map(b => `<span>${esc(b)}</span>`).join('<i>✦</i>')}<i>✦</i></div></div>
  <div class="rowm rev"><div>${C.integrationen.map(b => `<span class="o">${esc(b)}</span>`).join('<i>✦</i>')}<i>✦</i></div><div aria-hidden="true">${C.integrationen.map(b => `<span class="o">${esc(b)}</span>`).join('<i>✦</i>')}<i>✦</i></div></div>
  <div class="wrap aw"><p class="rb-k">Unabhängig ausgezeichnet</p><ul>${C.awards.map(a => `<li data-reveal>${esc(a)}</li>`).join('')}</ul></div>
</section>

<section class="service" data-ch="Leserservice"><div class="wrap two">
  <div class="stk">${sh('07', 'Leserservice', 'Was Entscheider wissen wollen.')}</div>
  <div><div class="faq">${C.faq.map(f => `<details data-reveal><summary>${esc(f.q)}<i aria-hidden="true"></i></summary><p>${esc(f.a)}</p></details>`).join('')}</div>
    <aside class="ad" data-reveal><p class="rb-k">Anzeige in eigener Sache</p><b>Bis zu ${C.foerderung} % Zuschuss</b><p>für Ihr Digitalprojekt. Wir prüfen, ob Sie förderfähig sind – und begleiten den Antrag.</p><a class="btn btn-ink" href="#kontakt">Fördergespräch</a></aside></div>
</div></section>

<section class="last" id="kontakt" data-ch="Letzte Seite"><div class="wrap">
  <p class="rb-k">Letzte Seite</p><h2 data-split>Moin! Reden wir. Persönlich.</h2>
  <p class="lead" data-reveal>Moin sagt man hier übrigens zu jeder Uhrzeit. Ein Gespräch dauert 30 Minuten – ohne Verkaufsdruck, mit offenem Ausgang.</p>
  <div class="cta" data-reveal><a class="btn btn-paper" href="${C.termin}">Termin buchen</a><a class="btn btn-line2" href="${C.telHref}">${C.tel}</a></div>
</div></section>
<div class="peek" aria-hidden="true"><div></div></div>`;
  return page({ k: 2, title: 'NetzKombyse · Konzept 2 – Magazin', desc: 'Hamburger Agentur für digitalen Commerce im Mittelstand. Konzept 2: Magazin.', theme: '#F2EDE4', body: shell(body) });
}

function leistung() {
  const w = C.caseWB;
  const body = `
<section class="art-h" data-ch="Titel"><div class="wrap"><p class="rb-k"><span>Leistungen</span>Technologie & Shop</p>
  <h1 data-split>Shopware-Agentur aus Hamburg.</h1>
  <p class="standfirst" data-reveal>Architektur statt Einzeltickets: Wir bauen Shops, die in fünf Jahren noch tragen – und sich an Ihre Systeme anschließen, statt sie zu ersetzen.</p></div></section>
<section class="art-b" data-ch="Artikel"><div class="wrap art-g">
  <div class="cols"><p class="drop" data-reveal>Ein Onlineshop ist für viele Mittelständler längst kein Nebenprojekt mehr, sondern der zweite Verkaufsraum – oft der größere. Dann reicht es nicht, ein Template zu installieren. Es braucht eine Architektur, die Ihre Prozesse versteht: Preislogiken, Kundengruppen, Warenwirtschaft, Marktplätze.</p>
    <p data-reveal>Shopware 6 ist dafür unsere erste Wahl, weil es offen ist: API-first, erweiterbar, unabhängig. Wir kennen das System seit Jahren und bauen es dort aus, wo Standard aufhört – ob als klassischer Shop oder Headless.</p>
    <blockquote class="pull" data-reveal>„Wir denken in Architektur, nicht in Einzeltickets.“</blockquote>
    <p data-reveal>Das heißt für Sie: Wir beginnen mit einer Analyse, nicht mit einem Angebot. Wir zeigen, was Sie brauchen – und sagen ehrlich, was nicht. Erst dann wird gebaut, in Etappen, die Sie messen können.</p></div>
  <aside class="facts" data-reveal><p class="rb-k">Auf einen Blick</p><dl><dt>Schwerpunkt</dt><dd>Shopware 6, Shopify, Headless</dd><dt>Anbindungen</dt><dd>ERP, PIM, CRM, Marktplätze</dd><dt>Prozesslösungen</dt><dd>über ${C.prozessloesungen} individuell entwickelt</dd><dt>Ansprechpartner</dt><dd>${C.ansprech.name}</dd></dl><a class="btn btn-ink" href="${C.termin}">Termin buchen</a></aside>
</div></section>
<section class="steps" data-ch="In vier Schritten"><div class="wrap">${sh('02', 'In vier Schritten', 'So läuft ein Projekt bei uns.')}
  <ol>${w.schritte.map((s, i) => `<li data-reveal><span>${String(i + 1).padStart(2, '0')}</span><h3>${s.t}</h3><p>${s.d}</p></li>`).join('')}</ol></div></section>
<section class="cmp" id="wissen" data-ch="Wissen"><div class="wrap">${sh('03', 'Wissen', 'Shopware, Shopify oder Headless?')}
  <div class="tw" data-reveal><table><thead><tr><th></th><th>Shopware 6</th><th>Shopify</th><th>Headless</th></tr></thead><tbody>
  <tr><th>Stärke</th><td>Tiefe, Unabhängigkeit</td><td>Tempo, einfacher Start</td><td>Freiheit im Frontend</td></tr>
  <tr><th>Passt zu</th><td>Komplexen Prozessen</td><td>Klaren Standardfällen</td><td>Markenerlebnis ohne Grenzen</td></tr>
  <tr><th>Aufwand</th><td>Mittel</td><td>Gering</td><td>Höher</td></tr></tbody></table></div>
  <p class="fn">Orientierung, keine Pauschalaussage – wir rechnen es für Sie durch.</p></div></section>
<section class="last" id="kontakt" data-ch="Letzte Seite"><div class="wrap"><p class="rb-k">Weiterlesen</p><h2 data-split>Ein Projekt, das wir mit Stolz zeigen.</h2><div class="cta" data-reveal><a class="btn btn-paper" href="case.html">Titelstory lesen</a><a class="btn btn-line2" href="${C.termin}">Termin buchen</a></div></div></section>`;
  return page({ k: 2, title: 'Shopware-Agentur · Konzept 2 – Magazin', desc: 'Leistungsseite Technologie & Shop.', theme: '#F2EDE4', body: shell(body) });
}

function caseP() {
  const w = C.caseWB;
  const bottle = `<svg class="wine" viewBox="0 0 400 300" aria-hidden="true"><rect width="400" height="300" fill="#B8421F"/><circle cx="215" cy="150" r="110" fill="#D9A441"/><g transform="translate(150 20)"><path d="M32 0h16v50c0 12 14 22 14 50v160H18V100c0-28 14-38 14-50z" fill="#15110E"/><rect x="26" y="150" width="28" height="60" rx="3" fill="#F2EDE4"/><rect x="34" y="165" width="12" height="3" fill="#15110E"/><rect x="34" y="173" width="12" height="3" fill="#15110E"/></g><g transform="translate(250 130)"><path d="M0 0h50c0 40-10 62-25 62S0 40 0 0z" fill="#F2EDE4"/><path d="M25 62v50M10 112h30" stroke="#F2EDE4" stroke-width="3" fill="none"/></g></svg>`;
  const body = `
<section class="art-h case-h" data-ch="Titel"><div class="wrap"><p class="rb-k"><span>Titelstory</span>${esc(w.typ)}</p>
  <h1 data-split>${esc(w.titel)}</h1><p class="standfirst" data-reveal>${esc(w.kurz)}.</p>
  <dl class="meta" data-reveal><div><dt>Branche</dt><dd>Food & Gastronomie</dd></div><div><dt>Jahr</dt><dd>${w.jahr}</dd></div><div><dt>Stack</dt><dd>Shopware 6, Warenwirtschaft, Marktplätze</dd></div></dl></div>
  <figure class="hero-art" data-reveal>${bottle}<figcaption>Abbildung: Prototyp-Illustration</figcaption></figure></section>
<section class="art-b" data-ch="Die Geschichte"><div class="wrap art-g">
  <div class="cols"><p class="rb-k">Ausgangslage</p><p class="drop" data-reveal>${esc(w.ausgang)}</p><p class="rb-k">Lösung</p><p data-reveal>${esc(w.loesung)}</p>
    <blockquote class="pull" data-reveal>„${esc(w.stimme.q)}“<cite>${w.stimme.w}, ${w.stimme.f}</cite></blockquote><p class="rb-k">Ergebnis</p><p data-reveal>${esc(w.ergebnis)}</p></div>
  <aside class="facts" data-reveal><p class="rb-k">Ergebnis in Zahlen</p><ul class="mini">${w.zahlen.map(z => `<li><b data-count="${z.n}" data-suffix="${z.s}">${z.n}${z.s}</b><span>${esc(z.l)}</span></li>`).join('')}</ul><p class="fn">${C.hinweisBeispiel}</p></aside></div></section>
<section class="steps" data-ch="Vorgehen"><div class="wrap">${sh('02', 'Vorgehen', 'Vier Etappen, ein Ziel.')}<ol>${w.schritte.map((s, i) => `<li data-reveal><span>${String(i + 1).padStart(2, '0')}</span><h3>${s.t}</h3><p>${s.d}</p></li>`).join('')}</ol></div></section>
<section class="last" id="kontakt" data-ch="Nächste Ausgabe"><div class="wrap"><p class="rb-k">Nächste Ausgabe</p><h2 data-split>Ihr Geschäft könnte das nächste sein.</h2><div class="cta" data-reveal><a class="btn btn-paper" href="${C.termin}">Termin buchen</a><a class="btn btn-line2" href="index.html#titel">Weitere Titelgeschichten</a></div></div></section>`;
  return page({ k: 2, title: 'Case Wein-Bauer.de · Konzept 2 – Magazin', desc: 'Titelstory: Multi-Channel-Handel mit Shopware 6.', theme: '#F2EDE4', body: shell(body) });
}

function praes() {
  const th = ['paper', 'terra', 'ink', 'paper', 'sand', 'terra'];
  const slides = C.slides.map((s, i) => `<section class="sl ${th[i]} ${i === 0 ? 'on' : ''}" data-i="${i}" aria-roledescription="Folie" aria-label="Folie ${i + 1} von ${C.slides.length}" ${i ? 'aria-hidden="true"' : ''}>
    <p class="sl-k"><span>${String(i + 1).padStart(2, '0')}</span>${esc(s.k)}</p><h2>${esc(s.t)}</h2><p class="sl-d">${esc(s.d)}</p><span class="sl-pg" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span class="sl-art" aria-hidden="true">${art(i)}</span></section>`).join('');
  const body = `<div id="top"></div>${header()}${menu()}${pt}<main id="main" class="deck">
  <div class="stage" id="stage" tabindex="0" aria-label="Präsentation. Mit Pfeiltasten blättern.">${slides}</div>
  <div class="deck-ui"><button type="button" class="dbtn" data-prev aria-label="Vorherige Folie">←</button><div class="dprog" aria-hidden="true"><i></i></div><span class="dcount" aria-live="polite"><b data-cur>01</b> / ${String(C.slides.length).padStart(2, '0')}</span><button type="button" class="dbtn" data-next aria-label="Nächste Folie">→</button><button type="button" class="dbtn" data-full aria-label="Vollbild">⤢</button></div>
  <p class="deck-h">← → blättern · F Vollbild · Esc Menü schließen</p></main>`;
  return page({ k: 2, title: 'Präsentation · Konzept 2 – Magazin', desc: 'Präsentationsfolien im Magazin-Stil.', theme: '#F2EDE4', body, cls: 'is-deck' });
}

export const pages = () => ({ 'index.html': index(), 'leistung.html': leistung(), 'case.html': caseP(), 'praesentation.html': praes() });
