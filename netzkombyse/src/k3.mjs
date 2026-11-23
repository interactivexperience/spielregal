// Konzept 3 · MÖWENSCHWARM – laut, bunt, überraschend: Physik-Buchstaben, Möwenjagd, Sammelkarten.
import { C } from '../content.mjs';
import { page, logo, mark, esc } from './lib.mjs';
import { gull, fly, fisch, korb, sonne, INK } from './art.mjs';

const QUIPS = ['Schnellster Telefonhörer nördlich der Elbe.', 'Sagt auch mal: „Das brauchen Sie nicht.“', 'Baut, bis die Flut kommt – und danach weiter.', 'Lädt Seiten schneller, als eine Möwe ein Fischbrötchen klaut.', 'Sieht Klickwege im Schlaf.', 'Hält Kurs, auch bei Windstärke 8.', 'Findet Kunden, bevor sie wissen, dass sie suchen.', 'Spricht fließend Google und Mensch.', 'Verbindet jedes System – notfalls mit Seemannsknoten.', 'Findet den Fehler, den niemand finden will.', 'Geht ran. Immer. Auch bei Nebel.'];
const TCOL = ['#FFD84A', '#7BDCC4', '#FFB3C7', '#9DB8FF', '#FF8A6B', '#C9F26B', '#FFD84A', '#7BDCC4', '#FFB3C7', '#9DB8FF', '#FF8A6B'];
const header = () => `<header class="hd">
  <a class="hd-logo" href="index.html" aria-label="NetzKombyse – Startseite">${logo()}</a>
  <p class="hd-g" data-gcount aria-live="polite" title="Möwen vertrieben"><span class="hg">${gull('hgi')}</span><b data-gn>0</b>/5<span class="hgl"> Möwen gescheucht</span></p>
  <div class="hd-r">
    <button class="mt" type="button" data-motion-toggle aria-pressed="true" title="Animationen ein- oder ausschalten"><span class="mt-i" aria-hidden="true"></span><span data-motion-label>Bewegung an</span></button>
    <button class="burger" type="button" data-menu-open aria-expanded="false" aria-controls="menu"><span>Menü</span><i aria-hidden="true"></i></button>
  </div></header>`;
const mcols = ['#FF5A45', '#2E6BF0', '#7BDCC4', '#FFB3C7', '#FFF8E6'];
const menu = () => `<div id="menu" class="menu" role="dialog" aria-modal="true" aria-label="Hauptmenü" aria-hidden="true">
  <div class="menu-bgt" aria-hidden="true"><div>${'MOIN MOIN MOIN MOIN MOIN '.repeat(4)}</div><div>${'MOIN MOIN MOIN MOIN MOIN '.repeat(4)}</div></div>
  <div class="menu-in">
    <nav aria-label="Hauptnavigation"><ol>${C.menue.map((m, i) => `<li style="--i:${i};--c:${mcols[i]};--r:${[-2.2, 1.6, -1.2, 2.2, -1.8][i]}deg"><a href="${m.href}"><span class="mn">${String(i + 1).padStart(2, '0')}</span><span class="mt2">${esc(m.t)}</span></a><p class="ms">${m.sub.slice(0, 4).map(s => `<a href="${m.href}">${esc(s)}</a>`).join('')}</p></li>`).join('')}</ol></nav>
    <div class="menu-f"><a class="btn btn-ink" href="index.html#kontakt">Moin sagen</a><a class="menu-tel" href="${C.telHref}">${C.tel}</a><span class="menu-gl" aria-hidden="true">${gull('mg')}</span></div>
  </div>
  <button class="menu-x" type="button" data-menu-close aria-label="Menü schließen">${sonne('mx-s')}<span aria-hidden="true">✕</span></button></div>`;
const pt = `<div class="pt" aria-hidden="true"><div class="pt-i"></div>${fly('pt-g')}</div>`;
const cursor = `<div class="mgull" aria-hidden="true">${gull('mgi')}<span class="say"></span></div><div class="toast" role="status" aria-live="polite" hidden></div>`;
const footer = () => `<footer class="ft"><div class="ft-in"><a class="ft-logo" href="index.html" aria-label="Startseite">${logo()}</a><p>${C.adresse.join(', ')} · <a href="${C.telHref}">${C.tel}</a> · Fax haben wir abgeschafft.</p>
  <p><a href="#">Impressum</a> · <a href="#">Datenschutz</a> · <a href="../index.html">Konzept wechseln</a> · <a href="#top">Nach oben</a></p><p class="ft-n">${C.hinweisBeispiel} Zitate, Kartentexte „Spezialfähigkeit“ sinngemäß bzw. Platzhalter.</p></div></footer>`;
const shell = (b) => `<div id="top"></div>${header()}${menu()}${pt}<main id="main">${b}</main>${footer()}${cursor}`;
const perch = (id, cls = '') => `<button type="button" class="perch ${cls}" data-gull="${id}" aria-label="Möwe verscheuchen (${id} von 5)">${gull('pg')}<span class="bub-s" aria-hidden="true">Moin?</span></button>`;
const hd = (k, t) => `<header class="sh"><p class="pill" data-reveal>${esc(k)}</p><h2 data-split>${esc(t)}</h2></header>`;

function index() {
  const letters = ['M', 'O', 'I', 'N', '!'], lc = ['#2E6BF0', '#FF5A45', '#FFF8E6', '#7BDCC4', '#FFB3C7'];
  const body = `
<section class="hero" aria-labelledby="h1">
  <h1 id="h1" class="sr">Moin! Wir sind NetzKombyse – digitaler Commerce aus Hamburg für den Mittelstand.</h1>
  <p class="pill pill-w" data-reveal>Hamburger Agentur für digitalen Commerce</p>
  <div class="play" data-play aria-hidden="true">
    ${letters.map((l, i) => `<span class="bd bd-l" data-b="l" style="--c:${lc[i]}">${l}</span>`).join('')}
    <span class="bd" data-b="o">${fisch()}</span><span class="bd" data-b="o">${fisch()}</span><span class="bd" data-b="o">${korb('#FF5A45')}</span><span class="bd" data-b="o">${gull('bg')}</span>
    <p class="play-h">Ziehen, schubsen, werfen – die Buchstaben gehören Ihnen.</p>
  </div>
  <div class="hero-b">
    <p class="lead" data-reveal>Wir sind die NetzKombyse: digitaler Commerce für Unternehmen, die mehr vorhaben – und für Menschen, die nach dem Launch nicht verschwinden.</p>
    <div class="cta" data-reveal><a class="btn btn-ink" href="#kontakt">Moin sagen</a><a class="btn btn-wh" href="case.html">Wein-Bauer.de ansehen</a></div>
  </div>
  ${perch(1, 'p1')}
</section>

<div class="tick-w"><section class="tick" aria-label="Kunden"><div class="tick-t"><div>${[...C.marken, ...C.marken].map(m => `<span>${esc(m)}</span>${fisch('tf')}`).join('')}</div><div aria-hidden="true">${[...C.marken, ...C.marken].map(m => `<span>${esc(m)}</span>${fisch('tf')}`).join('')}</div></div></section></div>

<section class="sec" id="aufgabe">
  ${hd('Was Sie zu uns führt', 'Kommt Ihnen das bekannt vor?')}
  <div class="stks">${C.lagen.map((l, i) => `<article class="stk" style="--c:${['#FFB3C7', '#7BDCC4', '#FFD84A'][i]};--r:${[-2.4, 1.8, -1.4][i]}deg" data-reveal><span class="stk-n" aria-hidden="true">${i + 1}</span><h3>${esc(l.t)}</h3><p>${esc(l.d)}</p></article>`).join('')}</div>
  <ul class="tix" aria-label="Unsere Säulen">${C.saeulen.map((s, i) => `<li data-reveal style="--d:${i * 70}ms" data-info="${esc(s.d)}"><b>${esc(s.t)}</b><span>${esc(s.d)}</span></li>`).join('')}</ul>
  ${perch(2, 'p2')}
</section>

<section class="sec sec-b" id="leistungen">
  ${hd('Was wir tun', 'Drei Disziplinen, ein Ziel: digitaler Vertrieb, der sich rechnet.')}
  <div class="panels" data-panels>${C.disziplinen.map((d, i) => `<a class="pn ${i === 0 ? 'open' : ''}" href="${d.href}" style="--c:${['#FF5A45', '#FFD84A', '#7BDCC4'][i]}"><span class="pn-n" aria-hidden="true">0${i + 1}</span><span class="pn-v" aria-hidden="true">${[fisch(), korb('#2E6BF0'), gull('pg2')][i]}</span><h3>${esc(d.t)}</h3><p>${esc(d.d)}</p><span class="pn-g">Mehr erfahren →</span></a>`).join('')}</div>
  ${perch(3, 'p3')}
</section>

<section class="sec sec-pile" id="referenzen">
  ${hd('Postkarten-Haufen', 'Ausgewählte Arbeiten.')}
  <p class="pile-h" data-reveal>Karten per Hand verschieben. Wein-Bauer.de lässt sich aufschlagen.</p>
  <div class="pile" data-pile>${C.cases.map((c, i) => { const pos = [[2, 6, -6], [27, 22, 4], [50, 2, -3], [70, 30, 7], [8, 50, 5], [38, 56, -5], [64, 62, 3]][i]; return `<article class="pk ${c.featured ? 'pk-f' : ''}" style="--x:${pos[0]}%;--y:${pos[1]}%;--r:${pos[2]}deg;--c:${['#FFB3C7', '#9DB8FF', '#FFD84A', '#7BDCC4', '#FF8A6B', '#FFF8E6', '#C9F26B'][i]}" data-drag-card><span class="pk-s" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><p class="pk-t">${esc(c.typ)} · ${esc(c.branche)}</p><h3>${esc(c.t)}</h3>${c.featured ? `<a class="pk-a" href="case.html">Case aufschlagen →</a>` : `<span class="pk-n">Im Prototyp nicht ausgebaut</span>`}</article>`; }).join('')}</div>
  ${perch(4, 'p4')}
</section>

<section class="sec" id="team">
  ${hd('Sammelkarten', 'Sie arbeiten direkt mit uns.')}
  <p class="pile-h" data-reveal>${C.zahlen.team} Menschen – antippen oder drüberfahren, um die Spezialfähigkeit zu sehen.</p>
  <ul class="deck3">${C.rollen.map((r, i) => `<li class="tc ${i === 0 ? 'tc-gold' : ''}" tabindex="0" data-flip data-reveal style="--c:${TCOL[i]};--r:${[-2, 1.5, -1, 2, -1.6, 1.2, -2, 1.4, -1, 1.8, -1.4][i]}deg;--d:${(i % 4) * 50}ms"><div class="tc-i"><div class="tc-f"><span class="tc-nr">#${String(i + 1).padStart(2, '0')}/${C.rollen.length}</span><span class="tc-ic" aria-hidden="true">${[gull('tcg'), fisch(), korb('#2E6BF0'), gull('tcg'), fisch(), korb('#FF5A45'), gull('tcg'), fisch(), korb('#7BDCC4'), gull('tcg'), fisch()][i]}</span><b>${esc(r)}</b>${i === 0 ? `<em>${C.ansprech.name}</em>` : ''}</div>
    <div class="tc-b"><span class="tc-k">Spezialfähigkeit</span><p>${esc(QUIPS[i])}</p>${i === 0 ? `<p class="tc-c"><a class="btn btn-ink" href="${C.telHref}">Anrufen</a><a class="btn btn-wh" href="${C.termin}">Termin</a></p>` : ''}</div></div></li>`).join('')}</ul>
</section>

<section class="sec sec-y" id="zahlen">
  ${hd('Ganz schön viel Wind', 'Zahlen, die sich sehen lassen können.')}
  <div class="blobs">
    <div class="bl" style="--c:#FF5A45" data-reveal><b data-count="${C.jahre}" data-suffix="+">${C.jahre}+</b><span>Jahre Erfahrung</span></div>
    <div class="bl" style="--c:#2E6BF0;color:#fff;--d:70ms" data-reveal><b data-count="${C.zahlen.marken}">${C.zahlen.marken}</b><span>Kundenmarken</span></div>
    <div class="bl" style="--c:#7BDCC4" data-reveal><b data-count="${C.prozessloesungen}" data-suffix="+">${C.prozessloesungen}+</b><span>Prozesslösungen</span></div>
    <div class="bl" style="--c:#FFB3C7" data-reveal><b>${C.bewertung.wert}</b><span>${C.bewertung.anzahl} Google-Bewertungen</span></div>
    <div class="burst" data-reveal><b data-count="${C.foerderung}" data-suffix=" %">${C.foerderung} %</b><span>Zuschuss<br>möglich</span></div>
  </div>
  <ul class="orden" aria-label="Auszeichnungen">${C.awards.map((a, i) => `<li data-reveal style="--d:${i * 60}ms;--r:${[-3, 2, -2, 3, -1][i]}deg">★ ${esc(a)}</li>`).join('')}</ul>
  <p class="chips-l" data-reveal>Branchen: ${C.branchen.map(b => `<span>${esc(b)}</span>`).join('')}</p>
  <p class="chips-l" data-reveal>Angebunden an: ${C.integrationen.map(b => `<span>${esc(b)}</span>`).join('')}</p>
  ${perch(5, 'p5')}
</section>

<section class="sec" id="stimmen">
  ${hd('Was man so hört', 'Kunden-Kreisch. Aber nett.')}
  <div class="says">${C.stimmen.map((s, i) => `<figure class="sy sy${i}" style="--c:${['#FFF8E6', '#FFB3C7', '#7BDCC4'][i]}" data-reveal><blockquote>„${esc(s.q)}“</blockquote><figcaption><b>${esc(s.w)}</b>${esc(s.f)}</figcaption></figure>`).join('')}</div>
</section>

<section class="sec" id="fragen">
  <div class="two"><div>${hd('Fragen', 'Was Entscheider wissen wollen.')}<aside class="note" data-reveal><b>Übrigens:</b> Bis zu ${C.foerderung} % Zuschuss für Ihr Digitalprojekt sind möglich. Wir prüfen, ob Sie förderfähig sind.</aside></div>
  <div class="faq">${C.faq.map(f => `<details data-reveal><summary>${esc(f.q)}<i aria-hidden="true"></i></summary><p>${esc(f.a)}</p></details>`).join('')}</div></div>
</section>

<section class="end" id="kontakt" aria-labelledby="dk">
  <p class="pill pill-w">Letzte Chance, Moin zu sagen</p>
  <h2 id="dk" data-split>Moin! Reden wir. Persönlich.</h2>
  <p class="lead">Moin sagt man hier übrigens zu jeder Uhrzeit. 30 Minuten, kein Verkaufsdruck – nur Menschen mit Meerblick im Kopf.</p>
  <div class="cta"><a class="btn btn-big" href="${C.termin}" target="_blank" rel="noopener" data-burst>Moin sagen!</a><a class="btn btn-wh" href="${C.telHref}">${C.tel}</a></div>
</section>`;
  return page({ k: 3, title: 'NetzKombyse · Konzept 3 – Möwenschwarm', desc: 'Hamburger Agentur für digitalen Commerce im Mittelstand. Konzept 3: Möwenschwarm.', theme: '#FFD84A', body: shell(body) });
}

function leistung() {
  const w = C.caseWB;
  const body = `
<section class="phero"><p class="pill pill-w" data-reveal>Leistungen · Technologie & Shop</p><h1 data-split>Shopware? Klar. Mit Brise im Segel.</h1>
  <p class="lead" data-reveal>Shopware-Agentur aus Hamburg. Architektur statt Einzeltickets: Shops, die in fünf Jahren noch tragen – und sich an Ihre Systeme anschließen, statt sie zu ersetzen.</p>${fly('pf1')}${fly('pf2')}</section>
<section class="sec">${hd('Warum', 'Wann sich Shopware 6 lohnt.')}
  <div class="stks four">${[['Viele Kanäle', 'Shop, Marktplätze, Außendienst – eine Datenbasis statt drei Excel-Listen.', '#FFB3C7'], ['Eigene Preislogik', 'Kundengruppen, Staffeln, Rahmenverträge: abbildbar statt umgangen.', '#7BDCC4'], ['Offene Architektur', 'Headless, API-first, ohne Abhängigkeit von einem einzigen Anbieter.', '#FFD84A'], ['Wachstum', 'Ein System, das mitwächst, statt bei der nächsten Idee zu klemmen.', '#9DB8FF']].map(([t, d, c], i) => `<article class="stk" style="--c:${c};--r:${[-2, 1.6, -1.2, 2][i]}deg" data-reveal><span class="stk-n" aria-hidden="true">${i + 1}</span><h3>${t}</h3><p>${d}</p></article>`).join('')}</div></section>
<section class="sec sec-y">${hd('Die Leiter', 'Vier Sprossen bis zum Ziel.')}
  <ol class="rungs">${w.schritte.map((s, i) => `<li data-reveal style="--c:${['#FF5A45', '#FFF8E6', '#7BDCC4', '#FFB3C7'][i]};--r:${[-1.2, 1, -.8, 1.2][i]}deg"><b>${i + 1}</b><div><h3>${s.t}</h3><p>${s.d}</p></div></li>`).join('')}</ol></section>
<section class="sec" id="wissen">${hd('Wissen', 'Shopware, Shopify oder Headless?')}
  <div class="tw" data-reveal><table><thead><tr><th></th><th>Shopware 6</th><th>Shopify</th><th>Headless</th></tr></thead><tbody>
  <tr><th>Stärke</th><td>Tiefe, Unabhängigkeit</td><td>Tempo, einfacher Start</td><td>Freiheit im Frontend</td></tr>
  <tr><th>Passt zu</th><td>Komplexen Prozessen</td><td>Klaren Standardfällen</td><td>Markenerlebnis ohne Grenzen</td></tr>
  <tr><th>Aufwand</th><td>Mittel</td><td>Gering</td><td>Höher</td></tr></tbody></table></div><p class="fn">Orientierung, keine Pauschalaussage – wir rechnen es für Sie durch.</p></section>
<section class="end" id="kontakt"><p class="pill pill-w">Nächster Schritt</p><h2 data-split>Jetzt wird’s konkret.</h2><div class="cta"><a class="btn btn-big" href="case.html">Fallstudie lesen</a><a class="btn btn-wh" href="${C.termin}">Termin buchen</a></div></section>`;
  return page({ k: 3, title: 'Shopware-Agentur · Konzept 3 – Möwenschwarm', desc: 'Leistungsseite Technologie & Shop.', theme: '#FFD84A', body: shell(body) });
}

function caseP() {
  const w = C.caseWB;
  const items = [['Laden', '#FFB3C7'], ['Online-Shop', '#9DB8FF'], ['Marktplätze', '#7BDCC4'], ['Excel-Liste', '#FFF8E6'], ['Zettelwirtschaft', '#FFD84A'], ['Preisabgleich', '#FF8A6B']];
  const wine = `<svg class="wine" viewBox="0 0 220 260" aria-hidden="true"><g stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"><path d="M70 6h30v50c0 14 22 24 22 54v140H48V110c0-30 22-40 22-54z" fill="#2E6BF0"/><rect x="56" y="150" width="58" height="62" rx="6" fill="#FFF8E6"/><path d="M68 170h34M68 182h34M68 194h22" fill="none"/><path d="M140 100h64c0 48-14 78-32 78s-32-30-32-78z" fill="#FFB3C7"/><path d="M172 178v56M150 236h44" fill="none"/></g></svg>`;
  const body = `
<section class="phero phero-case"><div><p class="pill pill-w" data-reveal>Case · ${esc(w.typ)}</p><h1 data-split>${esc(w.titel)}</h1><p class="lead" data-reveal>${esc(w.kurz)}.</p>
  <ul class="tags" data-reveal><li>Food & Gastronomie</li><li>${w.jahr}</li><li>Shopware 6</li><li>Warenwirtschaft</li><li>Marktplätze</li></ul></div><div class="wine-w" data-reveal>${wine}${gull('wg')}</div></section>
<section class="sec">${hd('Chaos → Ordnung', 'Aus Zettelwirtschaft wird ein System.')}
  <div class="chaos" data-chaos="after"><div class="ba-bar" role="group" aria-label="Ansicht wählen"><button type="button" data-ba-set="before" aria-pressed="false">Vorher</button><button type="button" data-ba-set="after" aria-pressed="true">Nachher</button></div>
    <div class="chaos-d">${items.map(([n, c], i) => `<span class="ci" style="--c:${c};--i:${i};--r:${[-8, 6, -4, 9, -7, 5][i]}deg;--x:${[6, 38, 66, 20, 52, 76][i]}%;--y:${[8, 52, 14, 62, 30, 66][i]}%">${n}</span>`).join('')}<span class="ci-h" aria-hidden="true">= ein Bestand</span></div>
    <p class="ba-t"><b class="b-b">Vorher:</b> ${esc(w.ausgang)}</p><p class="ba-t"><b class="b-a">Nachher:</b> ${esc(w.loesung)}</p></div></section>
<section class="sec sec-y">${hd('Der Weg', 'Vier Etappen, ein Ziel.')}<ol class="rungs">${w.schritte.map((s, i) => `<li data-reveal style="--c:${['#FF5A45', '#FFF8E6', '#7BDCC4', '#FFB3C7'][i]};--r:${[-1.2, 1, -.8, 1.2][i]}deg"><b>${i + 1}</b><div><h3>${s.t}</h3><p>${s.d}</p></div></li>`).join('')}</ol></section>
<section class="sec">${hd('Ergebnis', 'Ein Sortiment, ein Bestand, eine Wahrheit.')}<p class="lead" data-reveal>${esc(w.ergebnis)}</p>
  <div class="blobs b3">${w.zahlen.map((z, i) => `<div class="bl" style="--c:${['#FF5A45', '#2E6BF0;color:#fff', '#7BDCC4'][i]}" data-reveal><b data-count="${z.n}" data-suffix="${z.s}">${z.n}${z.s}</b><span>${esc(z.l)}</span></div>`).join('')}</div><p class="fn">${C.hinweisBeispiel}</p>
  <figure class="sy sy1 big-sy" style="--c:#FFB3C7" data-reveal><blockquote>„${esc(w.stimme.q)}“</blockquote><figcaption><b>${w.stimme.w}</b>${w.stimme.f}</figcaption></figure></section>
<section class="end" id="kontakt"><p class="pill pill-w">Nächster Fall</p><h2 data-split>Ihr Geschäft könnte das nächste sein.</h2><div class="cta"><a class="btn btn-big" href="${C.termin}" target="_blank" rel="noopener" data-burst>Moin sagen!</a><a class="btn btn-wh" href="index.html#referenzen">Weitere Referenzen</a></div></section>`;
  return page({ k: 3, title: 'Case Wein-Bauer.de · Konzept 3 – Möwenschwarm', desc: 'Case: Multi-Channel-Handel mit Shopware 6.', theme: '#FFD84A', body: shell(body) });
}

function praes() {
  const bg = ['#FFD84A', '#7BDCC4', '#FFB3C7', '#9DB8FF', '#FF8A6B', '#C9F26B'];
  const art = [() => gull('sg'), () => fisch('sf'), () => korb('#FF5A45', 'sk'), () => gull('sg'), () => fisch('sf'), () => korb('#2E6BF0', 'sk')];
  const slides = C.slides.map((s, i) => `<section class="sl ${i === 0 ? 'on' : ''}" style="--c:${bg[i]}" data-i="${i}" aria-roledescription="Folie" aria-label="Folie ${i + 1} von ${C.slides.length}" ${i ? 'aria-hidden="true"' : ''}>
    <span class="sl-n" aria-hidden="true">${i + 1}</span><span class="sl-a" aria-hidden="true">${art[i]()}</span>
    <div class="sl-in"><p class="pill pill-w">${esc(s.k)}</p><h2>${esc(s.t)}</h2><p class="sl-d">${esc(s.d)}</p></div></section>`).join('');
  const body = `<div id="top"></div>${header()}${menu()}${pt}<main id="main" class="deck">
  <div class="stage" id="stage" tabindex="0" aria-label="Präsentation. Mit Pfeiltasten blättern.">${slides}</div>
  <div class="deck-ui"><button type="button" class="dbtn" data-prev aria-label="Vorherige Folie">←</button><div class="dprog" aria-hidden="true"><i></i></div><span class="dcount" aria-live="polite"><b data-cur>01</b> / ${String(C.slides.length).padStart(2, '0')}</span><button type="button" class="dbtn" data-next aria-label="Nächste Folie">→</button><button type="button" class="dbtn" data-full aria-label="Vollbild">⤢</button></div>
  <p class="deck-h">← → blättern · F Vollbild · Esc Menü schließen</p></main>${cursor}`;
  return page({ k: 3, title: 'Präsentation · Konzept 3 – Möwenschwarm', desc: 'Präsentationsfolien im Stil des Möwenschwarms.', theme: '#FFD84A', body, cls: 'is-deck' });
}

export const pages = () => ({ 'index.html': index(), 'leistung.html': leistung(), 'case.html': caseP(), 'praesentation.html': praes() });
