// Konzept 2 · BRISE – ein Küstentag: Von der Düne ins Meer, leicht, luftig, bewegt vom Wind.
import { C } from '../content.mjs';
import { page, logo, mark, esc } from './lib.mjs';
import { gull, fly, korb, wolke, turm, sonne, welle, welleLoop, INK } from './art.mjs';

const KORB = ['#F0735A', '#3F8FB5', '#F4B860', '#7FB89A', '#C97B9C', '#5B6FBF', '#F0735A', '#3F8FB5', '#F4B860', '#7FB89A'];
const header = () => `<header class="hd">
  <a class="hd-logo" href="index.html" aria-label="NetzKombyse – Startseite">${logo()}</a>
  <p class="hd-w" aria-hidden="true">${fly('hw')}<span>Wind aus West · 4 Bft · Moin</span></p>
  <div class="hd-r">
    <button class="mt" type="button" data-motion-toggle aria-pressed="true" title="Animationen ein- oder ausschalten"><span class="mt-i" aria-hidden="true"></span><span data-motion-label>Bewegung an</span></button>
    <button class="burger" type="button" data-menu-open aria-expanded="false" aria-controls="menu"><span>Menü</span><svg viewBox="0 0 28 14" aria-hidden="true"><path d="M1 4Q5 0 9 4T17 4T27 4M1 11Q5 7 9 11T17 11T27 11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button>
  </div></header>`;

const menu = () => `<div id="menu" class="menu" role="dialog" aria-modal="true" aria-label="Hauptmenü" aria-hidden="true">
  <div class="menu-p">
    <svg class="menu-e" viewBox="0 0 80 1000" preserveAspectRatio="none" aria-hidden="true"><path fill="var(--m-bg)" d="M80 0V1000H80Q30 950 50 900T50 800 30 700 50 600 30 500 50 400 30 300 50 200 30 100 50 0Z"/></svg>
    <div class="menu-sky" aria-hidden="true">${wolke('mc1')}${wolke('mc2')}${fly('mf1')}${fly('mf2')}${sonne('msun')}</div>
    <div class="menu-in">
      <p class="menu-k">Wohin soll die Reise gehen?</p>
      <nav class="menu-nav" aria-label="Hauptnavigation"><ol>${C.menue.map((m, i) => `<li style="--i:${i}"><a href="${m.href}"><span class="mn">${String(i + 1).padStart(2, '0')}</span><span class="mw" data-wave>${esc(m.t)}</span></a><p class="ms">${m.sub.slice(0, 5).map(s => `<a href="${m.href}">${esc(s)}</a>`).join('')}</p></li>`).join('')}</ol></nav>
      <div class="menu-f"><p>Moin! Reden wir. Persönlich.</p><a class="btn btn-co" href="index.html#kontakt">Projekt anfragen</a><a class="menu-tel" href="${C.telHref}">${C.tel}</a></div>
    </div>
    <button class="menu-x" type="button" data-menu-close aria-label="Menü schließen"><span></span><span></span></button>
  </div></div>`;

const pcs = [[8, 20, 70], [32, 70, 90], [58, 30, 80], [82, 75, 95], [18, 90, 70], [70, 8, 75], [92, 40, 80]]
  .map(([x, y, s]) => `<i style="left:${x}%;top:${y}%;--s:${s}vmax"></i>`).join('');
const pt = `<div class="pt" aria-hidden="true">${pcs}</div>`;
const footer = () => `<footer class="ft"><div class="ft-in"><a class="ft-logo" href="index.html" aria-label="Startseite">${logo()}</a>
  <p>${C.adresse.join(', ')} · <a href="${C.telHref}">${C.tel}</a> · Fax haben wir abgeschafft.</p>
  <p class="ft-s"><a href="#">Impressum</a> · <a href="#">Datenschutz</a> · <a href="../index.html">Konzept wechseln</a> · <a href="#top">Nach oben</a></p>
  <p class="ft-n">${C.hinweisBeispiel} Zitate sinngemäß bzw. Platzhalter.</p></div></footer>`;
const shell = (b) => `<div id="top"></div>${header()}${menu()}${pt}<main id="main">${b}</main>${footer()}`;
const hd = (k, t, s = '') => `<header class="sh"><p class="kk" data-reveal>${esc(k)}</p><h2 data-split>${esc(t)}</h2>${s ? `<p class="sub" data-reveal>${esc(s)}</p>` : ''}</header>`;
const sky = (n = 1) => `<div class="sky" aria-hidden="true">${sonne('sun')}${wolke('c1')}${wolke('c2')}${n > 1 ? wolke('c3') : ''}${fly('g1')}${fly('g2')}${fly('g3')}</div>`;
const flag = (c, i) => `<div class="fg" style="--i:${i};--c:${c}"><svg viewBox="0 0 70 80" aria-hidden="true"><path d="M5 0h60L35 78z" fill="${c}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/></svg></div>`;

function index() {
  const body = `
<section class="hero" aria-labelledby="h1">
  ${sky(2)}
  <div class="hero-in">
    <p class="kk" data-reveal>Hamburger Agentur für digitalen Commerce</p>
    <h1 id="h1" data-wind>Frischer Wind für Ihr Geschäft.</h1>
    <p class="lead" data-reveal>Digitaler Commerce für Unternehmen, die mehr vorhaben – von Menschen, die bleiben, wenn die Flaute kommt.</p>
    <div class="cta" data-reveal><a class="btn btn-co" href="#kontakt">Kurs besprechen</a><a class="btn btn-ln" href="case.html">Wein-Bauer.de ansehen</a></div>
  </div>
  <div class="hero-w" aria-hidden="true">${welleLoop('#EAF2F4', 90, 'w1', 480)}${welleLoop('#CFE3EE', 90, 'w2', 360)}</div>
</section>

<section class="s s-nebel" id="wind" data-sec>
  <div class="wr">${hd('01 · Windrichtung', 'Woher weht der Wind?', 'Wir begleiten mittelständische Unternehmen, die E-Commerce als zentralen Teil ihrer Entwicklung sehen.')}
  <div class="drift">${C.lagen.map((l, i) => `<article class="tr" data-reveal style="--d:${i * 90}ms;--b:${i * -1.3}s"><span class="tr-n" aria-hidden="true">${['N', 'O', 'W'][i]}</span><h3>${esc(l.t)}</h3><p>${esc(l.d)}</p></article>`).join('')}</div>
  <div class="bunting" data-reveal><svg viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 8Q250 56 500 28T1000 8" fill="none" stroke="${INK}" stroke-width="2.4"/></svg>
    <ul>${C.saeulen.map((s, i) => `<li>${flag(['#F0735A', '#3F8FB5', '#F4B860', '#7FB89A'][i], i)}<h3>${esc(s.t)}</h3><p>${esc(s.d)}</p></li>`).join('')}</ul></div></div>
</section>

<section class="s s-abend" id="leistungen" data-sec>
  <div class="wr">${hd('02 · Leuchtturm', 'Drei Disziplinen, ein Ziel: digitaler Vertrieb, der sich rechnet.')}
  <div class="lh" data-lh><div class="lh-t" data-f="1" aria-hidden="true"><div class="beam"></div>${turm()}</div>
    <div class="lh-f">${C.disziplinen.map((d, i) => `<article class="flr" data-floor="${i + 1}"><p class="kk">Etage ${i + 1}</p><h3>${esc(d.t)}</h3><p>${esc(d.d)}</p><a class="lnk" href="${d.href}">Mehr erfahren <span aria-hidden="true">→</span></a></article>`).join('')}</div></div></div>
  ${welle('#F1E4CE', 90, 'sw')}
</section>

<section class="s s-sand" id="referenzen" data-sec>
  <div class="wr">${hd('03 · Flaschenpost', 'Ausgewählte Arbeiten.', 'Grüße von Kunden – zum Durchblättern, Ziehen und Wischen.')}</div>
  <div class="cards-x" tabindex="0" aria-label="Referenzen als Postkarten, horizontal scrollbar" data-drag>${C.cases.map((c, i) => `<a class="pc ${c.featured ? 'pc-f' : ''}" style="--r:${[-2.4, 1.8, -1.2, 2.6, -2, 1.4, -1.6][i]}deg" href="${c.featured ? 'case.html' : '#referenzen'}" ${c.featured ? '' : 'aria-disabled="true"'} draggable="false">
    <span class="stamp" aria-hidden="true"><b>${String(i + 1).padStart(2, '0')}</b></span><span class="pm" aria-hidden="true">HAMBURG<br>${2019 + i}</span>
    <h3>${esc(c.t)}</h3><p class="pc-t">${esc(c.typ)} · ${esc(c.branche)}</p><p class="pc-g">${c.featured ? 'Postkarte lesen →' : 'Im Prototyp nicht ausgebaut'}</p></a>`).join('')}</div>
  ${welle('#E5EFEA', 90, 'sw')}
</section>

<section class="s s-gras" id="team" data-sec>
  <div class="wr">${hd('04 · Strandkorb-Reihe', 'Sie arbeiten direkt mit uns.', `${C.zahlen.team} Menschen, ${C.jahre}+ Jahre Erfahrung – und kein Vertriebsfilter dazwischen.`)}
  <div class="beach"><article class="chief" data-reveal><div class="chief-k">${korb('#F0735A', 'big')}</div><div><h3>${C.ansprech.name}</h3><p>${C.ansprech.rolle}. Ihr Ansprechpartner von der ersten Frage an.</p><p class="cta"><a class="btn btn-co" href="${C.telHref}">Anrufen</a><a class="btn btn-ln" href="${C.termin}">Termin buchen</a></p></div></article>
    <ul class="korbs">${C.rollen.slice(1).map((r, i) => `<li data-reveal style="--d:${(i % 5) * 50}ms">${korb(KORB[i])}<span>${esc(r)}</span></li>`).join('')}</ul></div></div>
  <div class="rib" aria-hidden="true"><div>${[...C.branchen, ...C.branchen].map((b, i) => `<span style="--i:${i}">${esc(b)}</span><i>~</i>`).join('')}</div></div>
</section>

<section class="s s-blau" id="rueckenwind" data-sec>
  <div class="wr">${hd('05 · Rückenwind', 'Windstärke 8: bis zu 80 % Zuschuss.', 'Für Ihr Digitalprojekt – wir prüfen gemeinsam, ob Sie förderfähig sind.')}
  <div class="rw"><div class="gauge" data-reveal><svg viewBox="0 0 200 120" aria-hidden="true"><path d="M20 100A80 80 0 0 1 180 100" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" opacity=".6"/><path class="g-v" d="M20 100A80 80 0 0 1 180 100" fill="none" stroke="#F0735A" stroke-width="16" stroke-linecap="round" pathLength="100" stroke-dasharray="100" style="--v:${C.foerderung}"/></svg><p><b data-count="${C.foerderung}" data-suffix=" %">${C.foerderung} %</b><span>Zuschuss möglich</span></p></div>
    <ul class="facts">
      <li data-reveal><b data-count="${C.jahre}" data-suffix="+">${C.jahre}+</b><span>Jahre auf See</span></li>
      <li data-reveal><b data-count="${C.zahlen.marken}">${C.zahlen.marken}</b><span>Kundenmarken</span></li>
      <li data-reveal><b data-count="${C.prozessloesungen}" data-suffix="+">${C.prozessloesungen}+</b><span>Prozesslösungen</span></li>
      <li data-reveal><b>${C.bewertung.wert}</b><span>${C.bewertung.anzahl} Google-Bewertungen</span></li></ul></div>
  <div class="aw" data-reveal><p class="kk">Unabhängig ausgezeichnet</p><ul>${C.awards.map(a => `<li>${esc(a)}</li>`).join('')}</ul></div></div>
</section>

<section class="s s-nebel" id="stimmen" data-sec>
  <div class="wr">${hd('06 · Seemannsgarn (stimmt aber)', 'Was Kunden über uns erzählen.')}
  <div class="bottles">${C.stimmen.map((s, i) => `<figure data-reveal style="--d:${i * 80}ms;--b:${i * -1.1}s"><blockquote>„${esc(s.q)}“</blockquote><figcaption><b>${esc(s.w)}</b>${esc(s.f)}</figcaption></figure>`).join('')}</div></div>
</section>

<section class="s s-nebel s-faq" id="fragen" data-sec>
  <div class="wr two"><div>${hd('07 · Fragen', 'Was Entscheider wissen wollen.')}</div>
  <div class="faq">${C.faq.map(f => `<details data-reveal><summary>${esc(f.q)}<i aria-hidden="true"></i></summary><p>${esc(f.a)}</p></details>`).join('')}</div></div>
</section>

<section class="deep" id="kontakt" aria-labelledby="dk">
  <div class="deep-w">${welle('#12354A', 90, 'sw')}</div>
  <div class="bub" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<i style="--x:${(i * 71) % 100}%;--s:${8 + (i * 7) % 22}px;--d:${(i * 1.7) % 9}s;--t:${7 + (i * 3) % 7}s"></i>`).join('')}</div>
  <div class="deep-in">
    <p class="kk">Hafen erreicht</p>
    <h2 id="dk"><span class="perch">${gull('pg')}</span><span data-split>Moin! Reden wir. Persönlich.</span></h2>
    <p class="lead" data-reveal>Moin sagt man hier übrigens zu jeder Uhrzeit. Ein Gespräch dauert 30 Minuten – ohne Verkaufsdruck, mit offenem Ausgang.</p>
    <div class="cta" data-reveal><a class="btn btn-co" href="${C.termin}">Termin buchen</a><a class="btn btn-lt" href="${C.telHref}">${C.tel}</a></div>
    <p class="hint" aria-hidden="true">Tipp: Die Möwe auf der Überschrift ist scheu.</p>
  </div>
</section>`;
  return page({ k: 2, title: 'NetzKombyse · Konzept 2 – Brise', desc: 'Hamburger Agentur für digitalen Commerce im Mittelstand. Konzept 2: Brise.', theme: '#BCD9EA', body: shell(body), attrs: 'data-smooth' });
}

function leistung() {
  const w = C.caseWB;
  const body = `
<section class="hero hero-s" aria-labelledby="h1">${sky()}<div class="hero-in"><p class="kk" data-reveal>Leistungen · Technologie & Shop</p>
  <h1 id="h1" data-wind>Frischer Wind für Ihren Shop.</h1>
  <p class="lead" data-reveal>Shopware-Agentur aus Hamburg. Architektur statt Einzeltickets: Shops, die in fünf Jahren noch tragen – und sich an Ihre Systeme anschließen, statt sie zu ersetzen.</p></div>
  <div class="hero-w" aria-hidden="true">${welleLoop('#EAF2F4', 90, 'w1', 480)}${welleLoop('#CFE3EE', 90, 'w2', 360)}</div></section>
<section class="s s-nebel"><div class="wr">${hd('01 · Windrichtungen', 'Wann sich Shopware 6 lohnt.')}
  <div class="drift four">${[['Viele Kanäle', 'Shop, Marktplätze, Außendienst – eine Datenbasis statt drei Excel-Listen.', 'N'], ['Eigene Preislogik', 'Kundengruppen, Staffeln, Rahmenverträge: abbildbar statt umgangen.', 'O'], ['Offene Architektur', 'Headless, API-first, ohne Abhängigkeit von einem einzigen Anbieter.', 'S'], ['Wachstum', 'Ein System, das mitwächst, statt bei der nächsten Idee zu klemmen.', 'W']].map(([t, d, r], i) => `<article class="tr" data-reveal style="--d:${i * 70}ms;--b:${i * -1.3}s"><span class="tr-n" aria-hidden="true">${r}</span><h3>${t}</h3><p>${d}</p></article>`).join('')}</div></div></section>
<section class="s s-sand"><div class="wr">${hd('02 · Törn', 'Der Kurs in vier Etappen.')}
  <ol class="legs">${w.schritte.map((s, i) => `<li data-reveal style="--d:${i * 80}ms;--b:${i * -.9}s"><span class="buoy" aria-hidden="true">${i + 1}</span><h3>${s.t}</h3><p>${s.d}</p></li>`).join('')}</ol></div>${welle('#EAF2F4', 90, 'sw')}</section>
<section class="s s-nebel" id="wissen"><div class="wr">${hd('03 · Seekarte lesen', 'Shopware, Shopify oder Headless?')}
  <div class="tw" data-reveal><table><thead><tr><th></th><th>Shopware 6</th><th>Shopify</th><th>Headless</th></tr></thead><tbody>
  <tr><th>Stärke</th><td>Tiefe, Unabhängigkeit</td><td>Tempo, einfacher Start</td><td>Freiheit im Frontend</td></tr>
  <tr><th>Passt zu</th><td>Komplexen Prozessen</td><td>Klaren Standardfällen</td><td>Markenerlebnis ohne Grenzen</td></tr>
  <tr><th>Aufwand</th><td>Mittel</td><td>Gering</td><td>Höher</td></tr></tbody></table></div><p class="fn">Orientierung, keine Pauschalaussage – wir rechnen es für Sie durch.</p></div></section>
<section class="deep" id="kontakt"><div class="deep-w">${welle('#12354A', 90, 'sw')}</div><div class="bub" aria-hidden="true">${Array.from({ length: 10 }, (_, i) => `<i style="--x:${(i * 71) % 100}%;--s:${8 + (i * 7) % 22}px;--d:${(i * 1.7) % 9}s;--t:${7 + (i * 3) % 7}s"></i>`).join('')}</div>
  <div class="deep-in"><p class="kk">Nächster Hafen</p><h2 data-split>Sehen Sie, wie das in der Praxis aussieht.</h2><div class="cta" data-reveal><a class="btn btn-co" href="case.html">Postkarte lesen</a><a class="btn btn-lt" href="${C.termin}">Termin buchen</a></div></div></section>`;
  return page({ k: 2, title: 'Shopware-Agentur · Konzept 2 – Brise', desc: 'Leistungsseite Technologie & Shop.', theme: '#BCD9EA', body: shell(body), attrs: 'data-smooth' });
}

function caseP() {
  const w = C.caseWB;
  const boat = (n, i) => `<div class="boat" style="--i:${i}"><svg viewBox="0 0 90 60" aria-hidden="true"><path d="M44 4v34M44 6l24 28H44z" fill="#fff" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><path d="M8 38h74l-10 16H18z" fill="${['#F0735A', '#3F8FB5', '#F4B860'][i]}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/></svg><span>${n}</span></div>`;
  const art = `<svg class="wine" viewBox="0 0 420 300" aria-hidden="true"><defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6B48F"/><stop offset="1" stop-color="#FDE9C9"/></linearGradient></defs><rect width="420" height="300" fill="url(#sk)"/><circle cx="260" cy="150" r="64" fill="#F0735A" opacity=".9"/><rect y="170" width="420" height="130" fill="#3F8FB5"/><g stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"><path d="M60 196h60M180 214h90M300 192h70M90 240h110M250 258h100"/></g>
    <g transform="translate(120 30)"><path d="M32 0h16v50c0 12 14 22 14 50v150H18V100c0-28 14-38 14-50z" fill="${INK}"/><rect x="26" y="150" width="28" height="56" rx="3" fill="#FDE9C9"/></g><g transform="translate(240 150)"><path d="M0 0h52c0 40-11 64-26 64S0 40 0 0z" fill="#FDE9C9" stroke="${INK}" stroke-width="3"/><path d="M26 64v46M10 110h32" stroke="${INK}" stroke-width="3" fill="none"/></g></svg>`;
  const body = `
<section class="hero hero-s hero-case" aria-labelledby="h1">${sky()}<div class="hero-in"><p class="kk" data-reveal>Postkarte · ${esc(w.typ)}</p>
  <h1 id="h1" data-wind>${esc(w.titel)}</h1><p class="lead" data-reveal>${esc(w.kurz)}.</p>
  <dl class="meta" data-reveal><div><dt>Branche</dt><dd>Food & Gastronomie</dd></div><div><dt>Jahr</dt><dd>${w.jahr}</dd></div><div><dt>Stack</dt><dd>Shopware 6, Warenwirtschaft, Marktplätze</dd></div></dl></div>
  <figure class="hero-art" data-reveal>${art}</figure>
  <div class="hero-w" aria-hidden="true">${welleLoop('#EAF2F4', 90, 'w1', 480)}${welleLoop('#CFE3EE', 90, 'w2', 360)}</div></section>
<section class="s s-nebel"><div class="wr">${hd('01 · Drei Boote, ein Hafen', 'Aus drei Welten wird ein System.')}
  <div class="ba" data-ba="after"><div class="ba-bar" role="group" aria-label="Ansicht wählen"><button type="button" data-ba-set="before" aria-pressed="false">Vorher</button><button type="button" data-ba-set="after" aria-pressed="true">Nachher</button></div>
    <div class="ba-d"><div class="pier" aria-hidden="true"></div>${['Laden', 'Online-Shop', 'Marktplätze'].map(boat).join('')}<p class="ba-h" aria-hidden="true">Warenwirtschaft · ein Bestand</p></div>
    <p class="ba-t"><b class="b-b">Vorher:</b> ${esc(w.ausgang)}</p><p class="ba-t"><b class="b-a">Nachher:</b> ${esc(w.loesung)}</p></div></div></section>
<section class="s s-sand"><div class="wr">${hd('02 · Törn', 'Vier Etappen, ein Ziel.')}<ol class="legs">${w.schritte.map((s, i) => `<li data-reveal style="--d:${i * 80}ms;--b:${i * -.9}s"><span class="buoy" aria-hidden="true">${i + 1}</span><h3>${s.t}</h3><p>${s.d}</p></li>`).join('')}</ol></div>${welle('#CFE3EE', 90, 'sw')}</section>
<section class="s s-blau"><div class="wr">${hd('03 · Ergebnis', 'Ein Sortiment, ein Bestand, eine Wahrheit.', w.ergebnis)}
  <ul class="facts">${w.zahlen.map(z => `<li data-reveal><b data-count="${z.n}" data-suffix="${z.s}">${z.n}${z.s}</b><span>${esc(z.l)}</span></li>`).join('')}</ul><p class="fn">${C.hinweisBeispiel}</p>
  <figure class="bq" data-reveal><blockquote>„${esc(w.stimme.q)}“</blockquote><figcaption><b>${w.stimme.w}</b>${w.stimme.f}</figcaption></figure></div></section>
<section class="deep" id="kontakt"><div class="deep-w">${welle('#12354A', 90, 'sw')}</div><div class="bub" aria-hidden="true">${Array.from({ length: 10 }, (_, i) => `<i style="--x:${(i * 71) % 100}%;--s:${8 + (i * 7) % 22}px;--d:${(i * 1.7) % 9}s;--t:${7 + (i * 3) % 7}s"></i>`).join('')}</div>
  <div class="deep-in"><p class="kk">Nächster Hafen</p><h2 data-split>Ihr Geschäft könnte die nächste Postkarte sein.</h2><div class="cta" data-reveal><a class="btn btn-co" href="${C.termin}">Termin buchen</a><a class="btn btn-lt" href="index.html#referenzen">Weitere Referenzen</a></div></div></section>`;
  return page({ k: 2, title: 'Case Wein-Bauer.de · Konzept 2 – Brise', desc: 'Case: Multi-Channel-Handel mit Shopware 6.', theme: '#BCD9EA', body: shell(body), attrs: 'data-smooth' });
}

function praes() {
  const sk = ['morgen', 'vormittag', 'mittag', 'nachmittag', 'abend', 'nacht'];
  const slides = C.slides.map((s, i) => `<section class="sl sk-${sk[i]} ${i === 0 ? 'on' : ''}" data-i="${i}" aria-roledescription="Folie" aria-label="Folie ${i + 1} von ${C.slides.length}" ${i ? 'aria-hidden="true"' : ''}>
    <div class="sl-w" aria-hidden="true">${welleLoop('rgba(255,255,255,.55)', 90, 'w1', 480)}${welleLoop('rgba(255,255,255,.8)', 90, 'w2', 360)}</div>
    <div class="sl-in"><p class="kk">${String(i + 1).padStart(2, '0')} · ${esc(s.k)}</p><h2>${esc(s.t)}</h2><p class="sl-d">${esc(s.d)}</p></div></section>`).join('');
  const body = `<div id="top"></div>${header()}${menu()}${pt}<main id="main" class="deck">
  <div class="stage" id="stage" tabindex="0" aria-label="Präsentation. Mit Pfeiltasten blättern."><div class="sunarc" aria-hidden="true"></div>${slides}</div>
  <div class="deck-ui"><button type="button" class="dbtn" data-prev aria-label="Vorherige Folie">←</button><div class="dprog" aria-hidden="true"><i></i></div><span class="dcount" aria-live="polite"><b data-cur>01</b> / ${String(C.slides.length).padStart(2, '0')}</span><button type="button" class="dbtn" data-next aria-label="Nächste Folie">→</button><button type="button" class="dbtn" data-full aria-label="Vollbild">⤢</button></div>
  <p class="deck-h">← → blättern · F Vollbild · Esc Menü schließen · Die Sonne wandert mit der Präsentation</p></main>`;
  return page({ k: 2, title: 'Präsentation · Konzept 2 – Brise', desc: 'Präsentationsfolien: ein Küstentag von Morgen bis Nacht.', theme: '#BCD9EA', body, cls: 'is-deck' });
}

export const pages = () => ({ 'index.html': index(), 'leistung.html': leistung(), 'case.html': caseP(), 'praesentation.html': praes() });
