// Konzept 3 · WERKBANK – ein System aus Bausteinen: Bento-Raster, Diagramme, Command-Palette.
import { C } from '../content.mjs';
import { page, logo, mark, esc } from './lib.mjs';

const NODES = [
  ['Shop', 50, 9, 'Shop: Shopware 6 oder Shopify – das Schaufenster Ihres Sortiments.'],
  ['ERP', 13, 24, 'ERP: Bestände, Preise und Aufträge laufen ohne Handarbeit durch.'],
  ['PIM', 6, 55, 'PIM: Artikeldaten einmal pflegen, überall ausspielen.'],
  ['CRM', 18, 86, 'CRM: Kundenbeziehungen zusammenführen statt Excel pflegen.'],
  ['Marktplätze', 87, 24, 'Marktplätze: ein Sortiment, ein Bestand, mehrere Kanäle.'],
  ['Marke', 94, 55, 'Marke: UX, UI und Content – ein Gesicht über alle Kanäle.'],
  ['Marketing', 82, 86, 'Marketing: SEO, AI-Sichtbarkeit und Kampagnen, gemessen am Umsatz.'],
  ['Payment', 50, 93, 'Payment & Versand: reibungslos vom Warenkorb bis zur Haustür.'],
];
const graph = (h = 'graph') => `<div class="${h}" data-graph>
  <svg class="g-svg" aria-hidden="true"></svg>
  <div class="g-c" aria-hidden="true">${mark()}<span>Ihr Geschäft</span></div>
  ${NODES.map(([n, x, y, t]) => `<button type="button" class="gn" style="left:${x}%;top:${y}%" data-info="${esc(t)}">${n}</button>`).join('')}
  <p class="g-st" aria-live="polite"><span>›</span> <b data-gst>Alles verbunden. Nichts doppelt gepflegt.</b></p></div>`;

const kbd = (t) => `<kbd>${t}</kbd>`;
const header = () => `<header class="hd">
  <a class="hd-logo" href="index.html" aria-label="NetzKombyse – Startseite">${logo()}</a>
  <p class="hd-s" aria-hidden="true"><i></i>Alle Systeme laufen · Hamburg</p>
  <div class="hd-r">
    <button class="mt" type="button" data-motion-toggle aria-pressed="true" title="Animationen ein- oder ausschalten"><span class="tg" aria-hidden="true"></span><span data-motion-label>Bewegung an</span></button>
    <button class="burger" type="button" data-menu-open aria-expanded="false" aria-controls="menu"><span>Menü</span>${kbd('⌘K')}</button>
  </div></header>`;

const pageLinks = [['Start', 'index.html'], ['Leistung: Shopware-Agentur', 'leistung.html'], ['Referenz: Wein-Bauer.de', 'case.html'], ['Präsentation', 'praesentation.html']];
const secLinks = [['Ausgangslage', 'index.html#aufgabe'], ['Leistungen', 'index.html#leistungen'], ['Referenzen', 'index.html#referenzen'], ['Team', 'index.html#team'], ['Fragen & Antworten', 'index.html#fragen'], ['Kontakt', 'index.html#kontakt']];
const menu = () => `<div id="menu" class="menu" role="dialog" aria-modal="true" aria-label="Menü" aria-hidden="true">
  <div class="menu-bg" data-menu-close></div>
  <div class="pal">
    <div class="pal-i"><span aria-hidden="true">›</span><input type="text" data-menu-focus data-filter placeholder="Wohin möchten Sie? (z. B. Referenzen)" aria-label="Menü durchsuchen" autocomplete="off" spellcheck="false">${kbd('esc')}</div>
    <div class="pal-l" role="menu">
      <p class="pal-g">Seiten</p>${pageLinks.map(([t, h], i) => `<a role="menuitem" href="${h}" data-it><i>${['S', 'L', 'R', 'P'][i]}</i><span>${esc(t)}</span><em>${['1', '2', '3', '4'][i]}</em></a>`).join('')}
      <p class="pal-g">Auf dieser Seite</p>${secLinks.map(([t, h]) => `<a role="menuitem" href="${h}" data-it><i>#</i><span>${esc(t)}</span><em>↵</em></a>`).join('')}
      <p class="pal-g">Wissen</p>${['Logbuch', 'Shopify vs. Shopware', 'Template vs. Headless', 'Fördermittel'].map(t => `<a role="menuitem" href="leistung.html#wissen" data-it><i>W</i><span>${esc(t)}</span><em>↵</em></a>`).join('')}
      <p class="pal-e" hidden>Nichts gefunden – fragen Sie uns einfach direkt.</p>
    </div>
    <div class="pal-f"><span>${kbd('↑')}${kbd('↓')} wählen</span><span>${kbd('↵')} öffnen</span><a href="${C.telHref}">${C.tel}</a><button type="button" class="pal-x" data-menu-close>Schließen</button></div>
  </div></div>`;

const tiles = Array.from({ length: 40 }, (_, i) => { const c = i % 8, r = Math.floor(i / 8); return `<i style="--d:${(c + r) * 32}ms"></i>`; }).join('');
const pt = `<div class="pt" aria-hidden="true">${tiles}</div>`;
const footer = () => `<footer class="ft"><div class="ft-in"><div><a class="ft-logo" href="index.html" aria-label="Startseite">${logo()}</a><p>${C.adresse.join(', ')}<br><a href="${C.telHref}">${C.tel}</a> · Fax haben wir abgeschafft.</p></div>
  <p><a href="#">Impressum</a> · <a href="#">Datenschutz</a> · <a href="../index.html">Konzept wechseln</a> · <a href="#top">Nach oben</a></p><p class="ft-n">${C.hinweisBeispiel} Zitate sinngemäß bzw. Platzhalter.</p></div></footer>`;
const shell = (b) => `<div id="top"></div>${header()}${menu()}${pt}<main id="main">${b}</main>${footer()}`;
const hd = (k, t, s = '') => `<header class="sh"><p class="tag" data-reveal>${esc(k)}</p><h2 data-split>${esc(t)}</h2>${s ? `<p class="sub" data-reveal>${esc(s)}</p>` : ''}</header>`;
const viz = (i) => { const hs = [[40, 70, 55, 90, 62, 100], [30, 48, 80, 66, 92, 74], [55, 38, 72, 96, 64, 88]][i % 3]; return `<svg viewBox="0 0 120 50" aria-hidden="true" preserveAspectRatio="none">${hs.map((h, k) => `<rect x="${k * 20 + 3}" y="${50 - h / 2.2}" width="14" height="${h / 2.2}" rx="2" fill="${k === 5 ? 'var(--lime)' : 'var(--line2)'}"/>`).join('')}</svg>`; };

function index() {
  const body = `
<section class="hero" aria-labelledby="h1">
  <div class="hero-t">
    <p class="tag" data-reveal><i></i>Digitaler Commerce · Hamburg · Mittelstand</p>
    <h1 id="h1" data-split>Systeme, die zusammenspielen. Menschen, die bleiben.</h1>
    <p class="lead" data-reveal>Wir verbinden Shop, ERP, PIM und Marke zu einem Vertrieb, der sich rechnet – und bleiben danach Ihr Ansprechpartner, nicht nur Ihr Dienstleister.</p>
    <div class="cta" data-reveal><a class="btn btn-lime" href="#kontakt">Projekt besprechen</a><a class="btn btn-o" href="case.html">Fallstudie ansehen</a></div>
  </div>
  ${graph()}
</section>

<section class="stats" aria-label="Zahlen"><ul>
  <li data-reveal><b data-count="${C.jahre}" data-suffix="+">${C.jahre}+</b><span>Jahre Erfahrung</span></li>
  <li data-reveal><b data-count="${C.zahlen.marken}">${C.zahlen.marken}</b><span>Kundenmarken</span></li>
  <li data-reveal><b data-count="${C.prozessloesungen}" data-suffix="+">${C.prozessloesungen}+</b><span>individuelle Prozesslösungen</span></li>
  <li data-reveal><b>${C.bewertung.wert}<small>/5</small></b><span>${C.bewertung.anzahl} Google-Bewertungen</span></li></ul></section>

<section class="sec" id="aufgabe">
  ${hd('01 / Aufgabe', 'Welche Aufgabe haben Sie?', 'Wählen Sie Ihre Ausgangslage – wir zeigen, wie wir typischerweise vorgehen.')}
  <div class="seg" role="tablist" aria-label="Ausgangslage">${C.lagen.map((l, i) => `<button type="button" role="tab" id="t${i}" aria-controls="p${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><span>0${i + 1}</span>${esc(l.t)}</button>`).join('')}</div>
  ${C.lagen.map((l, i) => `<div class="pan" role="tabpanel" id="p${i}" aria-labelledby="t${i}" ${i ? 'hidden' : ''}>
    <div><h3>${esc(l.t)}</h3><p>${esc(l.d)}</p><a class="btn btn-o" href="#kontakt">Das kennen wir. Reden wir.</a></div>
    <ol class="pipe">${[['Analyse', 'Prozesse, Systeme, Datenqualität'], ['Architektur', 'Zielbild und Reihenfolge'], ['Umsetzung', 'In Etappen, messbar'], ['Betrieb', 'Monitoring & Wachstum']].map(([a, b], k) => `<li style="--k:${k}"><i>${k + 1}</i><b>${a}</b><span>${b}</span></li>`).join('')}</ol></div>`).join('')}
</section>

<section class="sec" id="leistungen">
  ${hd('02 / Leistungen', 'Drei Disziplinen, ein Ziel: digitaler Vertrieb, der sich rechnet.')}
  <div class="bento">
    <a class="bt b7 big" href="leistung.html" data-spot data-reveal><p class="tag">01 · Technologie & Shop</p><h3>Shopware, Shopify, Migration, Anbindung.</h3><p>${esc(C.disziplinen[0].d)}</p>
      <div class="chain" aria-hidden="true"><span>Shop</span><i></i><span>ERP</span><i></i><span>PIM</span><i></i><span>CRM</span></div></a>
    <a class="bt b5" href="leistung.html" data-spot data-reveal style="--d:80ms"><p class="tag">02 · Kommunikation & Marke</p><h3>Ein Gesicht über alle Kanäle.</h3><p>${esc(C.disziplinen[1].d)}</p><div class="swatch" aria-hidden="true"><b>Aa</b><i style="background:var(--lime)"></i><i style="background:var(--vio)"></i><i style="background:var(--cy)"></i></div></a>
    <a class="bt b5" href="leistung.html" data-spot data-reveal><p class="tag">03 · Marketing & Performance</p><h3>Gemessen an Umsatz, nicht an Klicks.</h3><p>${esc(C.disziplinen[2].d)}</p><div class="bars" aria-hidden="true">${[38, 52, 46, 68, 60, 84, 100].map(h => `<i style="--h:${h}%"></i>`).join('')}</div></a>
    <div class="bt b7 cols4" data-spot data-reveal style="--d:80ms">${C.saeulen.map(s => `<div><h4>${esc(s.t)}</h4><p>${esc(s.d)}</p></div>`).join('')}</div>
  </div>
</section>

<section class="pin" id="referenzen" style="--n:${C.cases.length}" aria-label="Referenzen">
  <div class="pin-in">
    <div class="pin-h">${hd('03 / Referenzen', 'Ausgewählte Arbeiten.')}<p class="pin-p" aria-hidden="true"><span data-pin-cur>01</span> / ${String(C.cases.length).padStart(2, '0')}<i><b></b></i></p></div>
    <div class="track" data-track tabindex="0" aria-label="Referenzen">${C.cases.map((c, i) => `<a class="dc ${c.featured ? 'dc-f' : ''}" href="${c.featured ? 'case.html' : '#referenzen'}" ${c.featured ? '' : 'aria-disabled="true"'} data-spot>
      <p class="dc-s"><i></i>live <span>${String(i + 1).padStart(2, '0')}</span></p><div class="dc-v">${viz(i)}</div><h3>${esc(c.t)}</h3>
      <p class="dc-t"><span>${esc(c.typ)}</span><span>${esc(c.branche)}</span></p><p class="dc-go">${c.featured ? 'Fallstudie öffnen →' : 'Im Prototyp nicht ausgebaut'}</p></a>`).join('')}</div>
  </div>
</section>

<section class="sec" id="stack">
  ${hd('04 / Stack', 'Angebunden an Ihre Systeme. Passend zu Ihrer Branche.')}
  <div class="two">
    <div class="bt" data-spot data-reveal><p class="tag">Integrationen</p><ul class="ports">${C.integrationen.map(x => `<li><i></i>${esc(x)}</li>`).join('')}</ul><p class="big">${C.prozessloesungen}+ <span>individuell entwickelte Prozesslösungen</span></p></div>
    <div class="bt" data-spot data-reveal style="--d:80ms"><p class="tag">Branchen</p><ul class="ind">${C.branchen.map((x, i) => `<li><span>0${i + 1}</span>${esc(x)}</li>`).join('')}</ul></div>
    <div class="bt wide" data-spot data-reveal><p class="tag">Unabhängig ausgezeichnet</p><ul class="aw">${C.awards.map(x => `<li><i>★</i>${esc(x)}</li>`).join('')}</ul></div>
  </div>
</section>

<section class="sec" id="team">
  ${hd('05 / Team', 'Sie arbeiten direkt mit uns.')}
  <div class="crew">
    <article class="bt me" data-spot data-reveal><div class="av" aria-hidden="true">HG</div><h3>${C.ansprech.name}</h3><p>${C.ansprech.rolle}. Ihr Ansprechpartner von der ersten Frage an.</p><p class="cta"><a class="btn btn-lime" href="${C.telHref}">Anrufen</a><a class="btn btn-o" href="${C.termin}">Termin buchen</a></p></article>
    ${C.rollen.slice(1).map((r, i) => `<div class="mb" data-reveal style="--d:${(i % 5) * 40}ms"><span aria-hidden="true">${r.split(/[ &/]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('')}</span><p>${esc(r)}</p></div>`).join('')}
  </div>
</section>

<section class="sec" id="stimmen">
  ${hd('06 / Stimmen', 'Was Kunden über die Zusammenarbeit sagen.')}
  <div class="qs">${C.stimmen.map((s, i) => `<figure class="bt ${i === 0 ? 'q-big' : ''}" data-spot data-reveal style="--d:${i * 70}ms"><blockquote>„${esc(s.q)}“</blockquote><figcaption><b>${esc(s.w)}</b>${esc(s.f)}</figcaption></figure>`).join('')}</div>
</section>

<section class="sec" id="fragen">
  <div class="two2"><div>${hd('07 / FAQ', 'Was Entscheider wissen wollen.')}
    <aside class="fund bt" data-spot data-reveal><b>${C.foerderung} %</b><p>Bis zu ${C.foerderung} % Zuschuss für Ihr Digitalprojekt – wir prüfen, ob Sie förderfähig sind.</p><a class="btn btn-o" href="#kontakt">Fördergespräch</a></aside></div>
    <div class="faq">${C.faq.map((f, i) => `<details data-reveal><summary><span>Q0${i + 1}</span>${esc(f.q)}<i aria-hidden="true"></i></summary><p>${esc(f.a)}</p></details>`).join('')}</div></div>
</section>

<section class="cta-s" id="kontakt">
  <p class="tag"><i></i>Bereit, wenn Sie es sind</p>
  <h2 data-split>Moin! Reden wir. Persönlich.</h2>
  <div class="cmd" data-reveal>
    <a href="${C.termin}"><span>›</span>Termin buchen<em>30 Minuten, kein Verkaufsdruck</em></a>
    <a href="${C.telHref}"><span>›</span>Anrufen<em>${C.tel}</em></a>
    <a href="index.html#kontakt"><span>›</span>Projekt anfragen<em>${C.ansprech.name} antwortet persönlich</em></a>
  </div>
</section>`;
  return page({ k: 3, title: 'NetzKombyse · Konzept 3 – Werkbank', desc: 'Hamburger Agentur für digitalen Commerce im Mittelstand. Konzept 3: Werkbank.', theme: '#0D0E10', body: shell(body) });
}

function leistung() {
  const w = C.caseWB;
  const body = `
<section class="phero"><p class="tag" data-reveal><i></i>Leistungen / Technologie & Shop</p><h1 data-split>Shopware-Agentur aus Hamburg.</h1>
  <p class="lead" data-reveal>Architektur statt Einzeltickets: Shops, die in fünf Jahren noch tragen – und sich an Ihre Systeme anschließen, statt sie zu ersetzen.</p>
  <div class="flow" data-reveal aria-label="Datenfluss"><span>Kanäle</span><i></i><span class="hl">Shopware 6</span><i></i><span>Middleware</span><i></i><span>ERP · PIM · CRM</span></div></section>
<section class="sec">${hd('01 / Warum', 'Wann sich Shopware 6 lohnt.')}
  <div class="bento">${[['Viele Kanäle', 'Shop, Marktplätze, Außendienst – eine Datenbasis statt drei Excel-Listen.', 'b7'], ['Eigene Preislogik', 'Kundengruppen, Staffeln, Rahmenverträge: abbildbar statt umgangen.', 'b5'], ['Offene Architektur', 'Headless, API-first, ohne Abhängigkeit von einem einzigen Anbieter.', 'b5'], ['Wachstum', 'Ein System, das mitwächst, statt bei der nächsten Idee zu klemmen.', 'b7']].map(([t, d, c], i) => `<div class="bt ${c}" data-spot data-reveal style="--d:${i * 50}ms"><p class="tag">0${i + 1}</p><h3>${t}</h3><p>${d}</p></div>`).join('')}</div></section>
<section class="sec">${hd('02 / Pipeline', 'So läuft ein Projekt bei uns.')}
  <ol class="pipe pipe-v">${w.schritte.map((s, i) => `<li data-reveal><i>${i + 1}</i><b>${s.t}</b><span>${s.d}</span></li>`).join('')}</ol></section>
<section class="sec" id="wissen">${hd('03 / Wissen', 'Shopware, Shopify oder Headless?')}
  <div class="tw bt" data-reveal><table><thead><tr><th></th><th>Shopware 6</th><th>Shopify</th><th>Headless</th></tr></thead><tbody>
  <tr><th>Stärke</th><td>Tiefe, Unabhängigkeit</td><td>Tempo, einfacher Start</td><td>Freiheit im Frontend</td></tr>
  <tr><th>Passt zu</th><td>Komplexen Prozessen</td><td>Klaren Standardfällen</td><td>Markenerlebnis ohne Grenzen</td></tr>
  <tr><th>Aufwand</th><td>Mittel</td><td>Gering</td><td>Höher</td></tr></tbody></table></div>
  <p class="fn">Orientierung, keine Pauschalaussage – wir rechnen es für Sie durch.</p></section>
<section class="cta-s" id="kontakt"><p class="tag"><i></i>Nächster Schritt</p><h2 data-split>Sehen Sie, wie das in der Praxis aussieht.</h2>
  <div class="cmd" data-reveal><a href="case.html"><span>›</span>Fallstudie öffnen<em>Wein-Bauer.de · Multi-Channel</em></a><a href="${C.termin}"><span>›</span>Termin buchen<em>30 Minuten</em></a></div></section>`;
  return page({ k: 3, title: 'Shopware-Agentur · Konzept 3 – Werkbank', desc: 'Leistungsseite Technologie & Shop.', theme: '#0D0E10', body: shell(body) });
}

function caseP() {
  const w = C.caseWB;
  const nodes = ['Laden', 'Shop', 'Marktplätze'];
  const body = `
<section class="phero"><p class="tag" data-reveal><i></i>Fallstudie / ${esc(w.typ)}</p><h1 data-split>${esc(w.titel)}</h1>
  <p class="lead" data-reveal>${esc(w.kurz)}.</p>
  <ul class="chipsr" data-reveal><li>Food & Gastronomie</li><li>${w.jahr}</li><li>Shopware 6</li><li>Warenwirtschaft</li><li>Marktplätze</li></ul></section>
<section class="sec">${hd('01 / Vorher – Nachher', 'Drei Welten werden ein System.')}
  <div class="ba bt" data-ba="after"><div class="ba-bar" role="group" aria-label="Ansicht wählen"><button type="button" data-ba-set="before" aria-pressed="false">Vorher</button><button type="button" data-ba-set="after" aria-pressed="true">Nachher</button></div>
    <div class="ba-d"><div class="ba-n">${nodes.map((n, i) => `<div class="bn" style="--i:${i}"><span>${n}</span></div>`).join('')}</div>
      <div class="ba-c"><span>Warenwirtschaft<br><small>ein Bestand</small></span></div>
      <svg class="ba-l" viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true"><path d="M108 11 C150 11 150 50 186 50"/><path d="M108 50 L186 50"/><path d="M108 89 C150 89 150 50 186 50"/></svg></div>
    <p class="ba-t"><b class="b-b">Vorher:</b> ${esc(w.ausgang)}</p><p class="ba-t"><b class="b-a">Nachher:</b> ${esc(w.loesung)}</p></div></section>
<section class="sec">${hd('02 / Pipeline', 'Vier Etappen, ein Ziel.')}<ol class="pipe pipe-v">${w.schritte.map((s, i) => `<li data-reveal><i>${i + 1}</i><b>${s.t}</b><span>${s.d}</span></li>`).join('')}</ol></section>
<section class="sec">${hd('03 / Ergebnis', 'Ein Sortiment, ein Bestand, eine Wahrheit.', w.ergebnis)}
  <ul class="stats big-s"><li data-reveal>${''}<b data-count="${w.zahlen[0].n}">${w.zahlen[0].n}</b><span>${esc(w.zahlen[0].l)}</span></li><li data-reveal><b data-count="${w.zahlen[1].n}" data-suffix="${w.zahlen[1].s}">${w.zahlen[1].n}${w.zahlen[1].s}</b><span>${esc(w.zahlen[1].l)}</span></li><li data-reveal><b data-count="${w.zahlen[2].n}" data-suffix="${w.zahlen[2].s}">${w.zahlen[2].n}${w.zahlen[2].s}</b><span>${esc(w.zahlen[2].l)}</span></li></ul>
  <p class="fn">${C.hinweisBeispiel}</p>
  <figure class="bt bq" data-spot data-reveal><blockquote>„${esc(w.stimme.q)}“</blockquote><figcaption><b>${w.stimme.w}</b>${w.stimme.f}</figcaption></figure></section>
<section class="cta-s" id="kontakt"><p class="tag"><i></i>Nächste Fallstudie</p><h2 data-split>Ihr Geschäft könnte das nächste sein.</h2>
  <div class="cmd" data-reveal><a href="${C.termin}"><span>›</span>Termin buchen<em>30 Minuten</em></a><a href="index.html#referenzen"><span>›</span>Weitere Referenzen<em>7 Projekte</em></a></div></section>`;
  return page({ k: 3, title: 'Case Wein-Bauer.de · Konzept 3 – Werkbank', desc: 'Fallstudie: Multi-Channel-Handel mit Shopware 6.', theme: '#0D0E10', body: shell(body) });
}

function praes() {
  const slides = C.slides.map((s, i) => `<section class="sl ${i === 0 ? 'on' : ''}" data-i="${i}" aria-roledescription="Folie" aria-label="Folie ${i + 1} von ${C.slides.length}" ${i ? 'aria-hidden="true"' : ''}>
    <p class="tag"><i></i>${String(i + 1).padStart(2, '0')} / ${esc(s.k)}</p><h2>${esc(s.t)}</h2><p class="sl-d">${esc(s.d)}</p><div class="sl-v" aria-hidden="true">${viz(i)}</div></section>`).join('');
  const body = `<div id="top"></div>${header()}${menu()}${pt}<main id="main" class="deck">
  <div class="stage" id="stage" tabindex="0" aria-label="Präsentation. Mit Pfeiltasten blättern.">${slides}</div>
  <div class="deck-ui"><button type="button" class="dbtn" data-prev aria-label="Vorherige Folie">←</button><div class="dprog" aria-hidden="true"><i></i></div><span class="dcount" aria-live="polite"><b data-cur>01</b> / ${String(C.slides.length).padStart(2, '0')}</span><button type="button" class="dbtn" data-next aria-label="Nächste Folie">→</button><button type="button" class="dbtn" data-full aria-label="Vollbild">⤢</button></div>
  <p class="deck-h">← → blättern · F Vollbild · Esc Menü schließen</p></main>`;
  return page({ k: 3, title: 'Präsentation · Konzept 3 – Werkbank', desc: 'Präsentationsfolien im Werkbank-Stil.', theme: '#0D0E10', body, cls: 'is-deck' });
}

export const pages = () => ({ 'index.html': index(), 'leistung.html': leistung(), 'case.html': caseP(), 'praesentation.html': praes() });
