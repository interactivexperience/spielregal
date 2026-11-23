// Konzept 1 · HAFENKARTE – die Seite ist eine Seekarte, die Zusammenarbeit eine Route.
import { C } from '../content.mjs';
import { page, logo, mark, esc } from './lib.mjs';

const dirs = ['000', '072', '144', '216', '288'];
const gull = (c = '') => `<svg class="gull ${c}" viewBox="0 0 48 20" aria-hidden="true"><path class="wl" d="M2 12 Q12 0 24 11 Q36 0 46 12" /><path class="wr" d="M2 12 Q12 4 24 11 Q36 4 46 12" /></svg>`;
const compass = () => `<svg class="compass" viewBox="-120 -120 240 240" aria-hidden="true">
  <circle r="112" class="c1"/><circle r="92" class="c2"/><circle r="64" class="c1"/>
  <g class="ticks">${Array.from({ length: 72 }, (_, i) => `<line x1="0" y1="-112" x2="0" y2="${i % 6 ? -106 : -98}" transform="rotate(${i * 5})"/>`).join('')}</g>
  <g class="rose"><path d="M0 -92 L9 -9 L92 0 L9 9 L0 92 L-9 9 L-92 0 L-9 -9Z" class="star"/><path d="M0 -64 L6 -6 L64 0 L6 6 L0 64 L-6 6 L-64 0 L-6 -6Z" class="star2"/></g>
  <g class="needle"><path d="M0 -84 L7 0 L-7 0Z" class="nr"/><path d="M0 84 L7 0 L-7 0Z" class="nb"/><circle r="4" class="nc"/></g>
  <text y="-118" class="cn" text-anchor="middle">N</text></svg>`;
const tile = (i) => {
  const cols = ['#E4482D', '#F2B63D', '#2A8C9B', '#0B2540', '#C9552F', '#6E8B6B', '#8E5B8C'];
  const c = cols[i % cols.length], c2 = cols[(i + 3) % cols.length];
  const cx = 30 + ((i * 37) % 50), cy = 30 + ((i * 53) % 45);
  return `<svg viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="160" height="120" fill="${c2}" opacity=".18"/>${[44, 34, 24, 14].map((r, k) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c}" stroke-width="${k === 3 ? 0 : 1.2}" ${k === 3 ? `fill="${c}"` : ''}/>`).join('')}<path d="M0 ${90 - (i % 3) * 8} Q40 ${70 + i * 3} 80 ${88 - i * 2} T160 ${80 + (i % 4) * 4} V120 H0Z" fill="${c}" opacity=".85"/></svg>`;
};
const icon = {
  bake: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4v6M16 10h16l-3 16H19zM12 40l4-14h16l4 14zM10 44h28"/></svg>`,
  haus: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 44V18l10-8 10 8v26M10 44h28M18 26h12M18 32h12"/><circle cx="24" cy="8" r="3"/></svg>`,
  anker: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="10" r="4"/><path d="M24 14v28M14 22h20M8 30c0 8 7 12 16 12s16-4 16-12"/></svg>`,
};

const header = (cur) => `<header class="hd">
  <a class="hd-logo" href="index.html" aria-label="NetzKombyse – Startseite">${logo()}</a>
  <div class="hd-coord" aria-hidden="true"><i></i>53°33′ N · 9°59′ O · Hamburg</div>
  <div class="hd-r">
    <button class="mt" type="button" data-motion-toggle aria-pressed="true" title="Animationen ein- oder ausschalten"><span class="mt-dot"></span><span data-motion-label>Bewegung an</span></button>
    <button class="burger" type="button" data-menu-open aria-expanded="false" aria-controls="menu"><span class="burger-l"></span><span class="burger-l"></span><span class="burger-t">Menü</span></button>
  </div>
</header>`;

const menu = () => `<div id="menu" class="menu" role="dialog" aria-modal="true" aria-label="Hauptmenü" aria-hidden="true">
  <div class="menu-in">
    <div class="menu-compass">${compass()}<p class="menu-cap" aria-hidden="true">Kurs <b data-deg>000</b>°</p></div>
    <nav class="menu-nav" aria-label="Hauptnavigation">
      <ol>${C.menue.map((m, i) => `<li><a href="${m.href}" data-rot="${dirs[i]}"><span class="mi-n">${dirs[i]}°</span><span class="mi-t">${esc(m.t)}</span></a>
        <p class="mi-sub">${m.sub.map(s => `<a href="${m.href}">${esc(s)}</a>`).join('')}</p></li>`).join('')}</ol>
    </nav>
    <div class="menu-foot">
      <p>Moin! Reden wir. Persönlich.</p>
      <a class="btn btn-red" href="index.html#kontakt">Projekt anfragen</a>
      <a class="menu-tel" href="${C.telHref}">${C.tel}</a>
    </div>
    <button class="menu-x" type="button" data-menu-close aria-label="Menü schließen"><span></span><span></span></button>
  </div>
</div>`;

const footer = () => `<footer class="ft">
  <div class="ft-in">
    <a class="ft-logo" href="index.html" aria-label="Startseite">${logo()}</a>
    <p>${C.adresse.join(', ')} · <a href="${C.telHref}">${C.tel}</a> · Fax haben wir abgeschafft.</p>
    <p class="ft-s"><a href="#">Impressum</a> · <a href="#">Datenschutz</a> · <a href="../index.html">Konzept wechseln</a> · <a href="#top">Nach oben</a></p>
    <p class="ft-n">${C.hinweisBeispiel} Zitate sinngemäß bzw. Platzhalter.</p>
  </div></footer>`;

const wave = `<div class="pt" aria-hidden="true"><svg viewBox="0 0 1440 80" preserveAspectRatio="none"><path d="M0 80 V40 Q90 0 180 40 T360 40 T540 40 T720 40 T900 40 T1080 40 T1260 40 T1440 40 V80Z"/></svg></div>`;
const shell = (body) => `<div id="top"></div>${header()}${menu()}${wave}<main id="main">${body}</main>${footer()}`;

const chartBg = () => `<svg class="chart" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs><pattern id="gr" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="currentColor" stroke-width=".6"/></pattern></defs>
  <rect width="1200" height="800" fill="url(#gr)" opacity=".14"/>
  <g class="land" fill="none" stroke="currentColor">
    ${[1, .86, .72, .58].map((s, i) => `<path transform="translate(${(1 - s) * 280} ${(1 - s) * 190}) scale(${s})" d="M780 150 C860 90 990 110 1040 190 C1100 270 1010 340 1060 420 C1100 500 1020 560 930 540 C840 520 790 580 720 540 C650 500 690 420 650 360 C610 300 700 210 780 150Z" opacity="${.55 - i * .08}" stroke-width="${1.4 - i * .2}"/>`).join('')}
    ${[1, .8, .6].map((s, i) => `<path transform="translate(${(1 - s) * 120} ${(1 - s) * 620}) scale(${s})" d="M120 620 C170 580 260 590 290 640 C320 690 260 740 190 735 C120 730 80 660 120 620Z" opacity="${.5 - i * .1}" stroke-width="1.2"/>`).join('')}
  </g>
  <g class="snd" fill="currentColor" font-family="IBM Plex Mono, monospace" font-size="13" opacity=".45">
    <text x="420" y="260">12</text><text x="520" y="420">34</text><text x="300" y="480">27</text><text x="610" y="640">48</text><text x="180" y="330">9</text><text x="470" y="150">21</text><text x="860" y="700">56</text><text x="1010" y="620">41</text>
  </g>
  <path class="route-d" d="M110 700 C260 640 330 520 470 470 S690 380 800 300 S960 190 1080 140" fill="none" stroke="#E4482D" stroke-width="2.4" stroke-dasharray="2 9" stroke-linecap="round"/>
  <g class="pin"><circle cx="1080" cy="140" r="9" fill="#E4482D"/><circle cx="1080" cy="140" r="20" fill="none" stroke="#E4482D" stroke-width="1.5"/></g>
  <circle cx="110" cy="700" r="6" fill="#0B2540"/></svg>`;

const sectionHead = (n, k, t) => `<header class="sh"><span class="sh-n" data-reveal>${n}</span><p class="sh-k" data-reveal>${esc(k)}</p><h2 data-split>${esc(t)}</h2></header>`;

function index() {
  const body = `
<section class="hero" aria-labelledby="h1">
  ${chartBg()}
  ${gull('g1')}${gull('g2')}
  <div class="hero-in">
    <p class="eyebrow" data-reveal>Hamburger Agentur · Digitaler Commerce · Mittelstand</p>
    <h1 id="h1" data-split>Kurs auf das Geschäft von morgen.</h1>
    <p class="lead" data-reveal>Digitaler Commerce. Für Unternehmen, die mehr vorhaben – und einen Partner suchen, der nicht nach dem Projekt von Bord geht.</p>
    <div class="cta" data-reveal><a class="btn btn-red" href="#kontakt">Kurs besprechen</a><a class="btn btn-line" href="case.html">Cases ansehen</a></div>
  </div>
  <div class="hero-compass" aria-hidden="true">${compass()}</div>
  <p class="hero-scroll" aria-hidden="true"><span></span>Auslaufen</p>
</section>

<section class="band" aria-label="Kunden">
  <div class="band-track"><div>${[...C.marken, ...C.marken].map(m => `<span>${esc(m)}</span><i>✦</i>`).join('')}</div><div aria-hidden="true">${[...C.marken, ...C.marken].map(m => `<span>${esc(m)}</span><i>✦</i>`).join('')}</div></div>
</section>

<div class="stations">
  <div class="rt" aria-hidden="true"><i></i></div>

  <section class="st" id="ausgangslage">
    ${sectionHead('01', 'Ausgangslage', 'Woher kommen Sie?')}
    <p class="st-lead" data-reveal>Wir begleiten Unternehmen, die E-Commerce als zentralen Teil ihrer Entwicklung sehen – nicht als Nebenschauplatz.</p>
    <div class="marks">${C.lagen.map((l, i) => `<article class="mk" data-reveal style="--d:${i * 90}ms">${[icon.bake, icon.haus, icon.anker][i]}<h3>${esc(l.t)}</h3><p>${esc(l.d)}</p></article>`).join('')}</div>
  </section>

  <section class="st" id="kurs">
    ${sectionHead('02', 'Kurs', 'Drei Disziplinen, ein Ziel: digitaler Vertrieb, der sich rechnet.')}
    <ul class="disc">${C.disziplinen.map((d, i) => `<li data-reveal style="--d:${i * 80}ms"><a href="${d.href}"><span class="disc-n">0${i + 1}</span><span class="disc-t">${esc(d.t)}</span><span class="disc-d">${esc(d.d)}</span><span class="disc-a" aria-hidden="true"><svg viewBox="0 0 40 16"><path d="M0 8h36M29 1l7 7-7 7"/></svg></span></a></li>`).join('')}</ul>
    <div class="pillars">${C.saeulen.map(s => `<div data-reveal><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p></div>`).join('')}</div>
  </section>

  <section class="st st-wide" id="referenzen">
    ${sectionHead('03', 'Ladung', 'Ausgewählte Arbeiten.')}
    <div class="cargo" tabindex="0" aria-label="Referenzen, horizontal scrollbar">${C.cases.map((c, i) => `<a class="fb ${c.featured ? 'fb-f' : ''}" href="${c.featured ? 'case.html' : '#referenzen'}" ${c.featured ? '' : 'aria-disabled="true"'}>
      <div class="fb-art">${tile(i)}</div><p class="fb-m"><span>${esc(c.typ)}</span><span>${esc(c.branche)}</span></p><h3>${esc(c.t)}</h3><span class="fb-go">${c.featured ? 'Case ansehen' : 'Im Prototyp nicht ausgebaut'}</span></a>`).join('')}</div>
  </section>

  <section class="st" id="team">
    ${sectionHead('04', 'Crew', 'Sie arbeiten direkt mit uns.')}
    <div class="crew-top">
      <article class="henning" data-reveal><div class="henning-av" aria-hidden="true">HG</div>
        <h3>${C.ansprech.name}</h3><p>${C.ansprech.rolle} · Ihr Ansprechpartner von der ersten Frage an.</p>
        <p class="henning-a"><a class="btn btn-red" href="${C.telHref}">Anrufen</a><a class="btn btn-line" href="${C.termin}">Termin buchen</a></p></article>
      <p class="crew-note" data-reveal>${C.zahlen.team} Menschen, ${C.jahre}+ Jahre Erfahrung. Kein Vertriebsfilter zwischen Ihnen und denen, die Ihre Systeme bauen.</p>
    </div>
    <ul class="crew">${C.rollen.map((r, i) => `<li data-reveal style="--d:${(i % 6) * 50}ms"><span class="ring" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>${esc(r)}</li>`).join('')}</ul>
  </section>

  <section class="st st-sea" id="haefen">
    ${sectionHead('05', 'Häfen', 'Wir kennen Ihren Markt. Und Ihre Systeme.')}
    <div class="harbor">
      <div><h3 data-reveal>Branchen</h3><ul class="chips">${C.branchen.map(b => `<li data-reveal>${esc(b)}</li>`).join('')}</ul></div>
      <div><h3 data-reveal>Angebunden an Ihre Systeme</h3><ul class="chips">${C.integrationen.map(b => `<li data-reveal>${esc(b)}</li>`).join('')}</ul>
        <p class="big-n" data-reveal><b data-count="${C.prozessloesungen}" data-suffix="+">${C.prozessloesungen}+</b> individuell entwickelte Prozesslösungen</p></div>
      <div><h3 data-reveal>Unabhängig ausgezeichnet</h3><ul class="awards">${C.awards.map(b => `<li data-reveal><span aria-hidden="true">★</span>${esc(b)}</li>`).join('')}</ul></div>
    </div>
  </section>

  <section class="st" id="stimmen">
    ${sectionHead('06', 'Logbuch', 'Was Kapitäne sagen.')}
    <div class="quotes">${C.stimmen.map((s, i) => `<figure data-reveal style="--d:${i * 90}ms"><blockquote>„${esc(s.q)}“</blockquote><figcaption><b>${esc(s.w)}</b>${esc(s.f)}</figcaption></figure>`).join('')}</div>
    <p class="rating" data-reveal>Google-Bewertung <b>${C.bewertung.wert}</b> von ${C.bewertung.von} · ${C.bewertung.anzahl} Bewertungen</p>
  </section>

  <section class="st" id="fragen">
    ${sectionHead('07', 'Seekarte lesen', 'Was Entscheider wissen wollen.')}
    <div class="faq">${C.faq.map(f => `<details data-reveal><summary>${esc(f.q)}<i aria-hidden="true"></i></summary><p>${esc(f.a)}</p></details>`).join('')}</div>
    <aside class="fund" data-reveal><b data-count="${C.foerderung}" data-suffix=" %">${C.foerderung} %</b><p>Bis zu ${C.foerderung} % Zuschuss für Ihr Digitalprojekt. Wir prüfen mit Ihnen, ob Sie förderfähig sind.</p><a class="btn btn-line" href="#kontakt">Fördergespräch</a></aside>
  </section>
</div>

<section class="dock" id="kontakt" aria-labelledby="dk">
  <svg class="dock-w" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 120V60C120 20 240 20 360 60S600 100 720 60 960 20 1080 60 1320 100 1440 60V120Z"/></svg>
  <div class="dock-in">
    <p class="eyebrow">Anlegen</p>
    <h2 id="dk" data-split>Moin! Reden wir. Persönlich.</h2>
    <p class="lead" data-reveal>Moin sagt man hier übrigens zu jeder Uhrzeit. Ein Gespräch dauert 30 Minuten und kostet nichts als Neugier.</p>
    <div class="cta" data-reveal><a class="btn btn-red" href="${C.termin}">Termin buchen</a><a class="btn btn-ghost" href="${C.telHref}">${C.tel}</a></div>
    <p class="dock-p" data-reveal>${mark()}<span>${C.ansprech.name}, ${C.ansprech.rolle}<br>${C.adresse.join(', ')}</span></p>
  </div>
</section>`;
  return page({ k: 1, title: 'NetzKombyse · Konzept 1 – Hafenkarte', desc: 'Hamburger Agentur für digitalen Commerce im Mittelstand. Konzept 1: Hafenkarte.', theme: '#EFE6D2', body: shell(body), attrs: 'data-smooth' });
}

function leistung() {
  const steps = C.caseWB.schritte;
  const body = `
<section class="phero"><div class="phero-in">
  <p class="eyebrow" data-reveal>Leistungen · Technologie & Shop</p>
  <h1 data-split>Shopware-Agentur aus Hamburg.</h1>
  <p class="lead" data-reveal>Architektur statt Einzeltickets: Wir bauen Shops, die in fünf Jahren noch tragen – und sich an Ihre Systeme anschließen, statt sie zu ersetzen.</p></div>${chartBg()}</section>
<div class="stations"><div class="rt" aria-hidden="true"><i></i></div>
  <section class="st">${sectionHead('01', 'Warum', 'Wann sich Shopware 6 lohnt.')}
    <ul class="why">${[['Viele Kanäle', 'Shop, Marktplätze, Außendienst – eine Datenbasis statt drei Excel-Listen.'], ['Eigene Preislogik', 'Kundengruppen, Staffeln, Rahmenverträge: abbildbar statt umgangen.'], ['Offene Architektur', 'Headless, API-first, ohne Abhängigkeit von einem einzigen Anbieter.'], ['Wachstum', 'Ein System, das mitwächst, statt bei der nächsten Idee zu klemmen.']].map(([t, d]) => `<li data-reveal><h3>${t}</h3><p>${d}</p></li>`).join('')}</ul></section>
  <section class="st">${sectionHead('02', 'Etappen', 'Der Kurs in vier Etappen.')}
    <ol class="legs">${steps.map((s, i) => `<li data-reveal><span>${i + 1}</span><h3>${s.t}</h3><p>${s.d}</p></li>`).join('')}</ol></section>
  <section class="st" id="wissen">${sectionHead('03', 'Wissen', 'Logbuch.')}
    <ul class="disc">${[['Shopify vs. Shopware', 'Ein Kostenvergleich ohne Produktbrille.'], ['Template vs. Headless', 'Wann sich der Mehraufwand lohnt – und wann nicht.'], ['Unser Headless Shopware 6', 'So bauen wir schnelle, flexible Shops.']].map(([t, d], i) => `<li data-reveal><a href="#wissen"><span class="disc-n">0${i + 1}</span><span class="disc-t">${t}</span><span class="disc-d">${d}</span><span class="disc-a" aria-hidden="true"><svg viewBox="0 0 40 16"><path d="M0 8h36M29 1l7 7-7 7"/></svg></span></a></li>`).join('')}</ul></section>
</div>
<section class="dock" id="kontakt"><svg class="dock-w" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 120V60C120 20 240 20 360 60S600 100 720 60 960 20 1080 60 1320 100 1440 60V120Z"/></svg>
  <div class="dock-in"><p class="eyebrow">Anlegen</p><h2 data-split>Moin! Reden wir. Persönlich.</h2><div class="cta" data-reveal><a class="btn btn-red" href="${C.termin}">Termin buchen</a><a class="btn btn-ghost" href="case.html">Case ansehen</a></div></div></section>`;
  return page({ k: 1, title: 'Shopware-Agentur · Konzept 1 – Hafenkarte', desc: 'Leistungsseite Technologie & Shop.', theme: '#EFE6D2', body: shell(body), attrs: 'data-smooth' });
}

function caseP() {
  const w = C.caseWB;
  const art = `<svg class="wine" viewBox="0 0 400 300" aria-hidden="true"><rect width="400" height="300" fill="#12365C"/>${[150, 120, 90, 60].map((r, i) => `<circle cx="210" cy="150" r="${r}" fill="none" stroke="#EFE6D2" opacity="${.12 + i * .05}"/>`).join('')}
    <g transform="translate(150 20)"><path d="M32 0h16v50c0 12 14 22 14 50v160H18V100c0-28 14-38 14-50z" fill="#E4482D"/><rect x="26" y="150" width="28" height="60" rx="3" fill="#EFE6D2"/><rect x="34" y="165" width="12" height="3" fill="#0B2540"/><rect x="34" y="173" width="12" height="3" fill="#0B2540"/></g>
    <g transform="translate(250 130)"><path d="M0 0h50c0 40-10 62-25 62S0 40 0 0z" fill="#F2B63D"/><path d="M25 62v50M10 112h30" stroke="#EFE6D2" stroke-width="3" fill="none"/></g>
    <g class="vine" fill="#2A8C9B"><circle cx="70" cy="210" r="14"/><circle cx="92" cy="222" r="14"/><circle cx="64" cy="236" r="14"/><circle cx="86" cy="248" r="14"/><circle cx="108" cy="240" r="14"/></g></svg>`;
  const body = `
<section class="phero phero-case"><div class="phero-in">
  <p class="eyebrow" data-reveal>Case · ${esc(w.typ)}</p>
  <h1 data-split>${esc(w.titel)}</h1>
  <p class="lead" data-reveal>${esc(w.kurz)}.</p>
  <dl class="meta" data-reveal><div><dt>Branche</dt><dd>Food & Gastronomie</dd></div><div><dt>Jahr</dt><dd>${w.jahr}</dd></div><div><dt>Stack</dt><dd>Shopware 6, Warenwirtschaft, Marktplätze</dd></div></dl></div>
  <div class="phero-art" data-reveal>${art}</div></section>
<div class="stations"><div class="rt" aria-hidden="true"><i></i></div>
  <section class="st">${sectionHead('01', 'Ausgangslage', 'Drei Welten, die nicht miteinander sprachen.')}<p class="st-lead" data-reveal>${esc(w.ausgang)}</p></section>
  <section class="st">${sectionHead('02', 'Lösung', 'Ein Shop als Mitte.')}<p class="st-lead" data-reveal>${esc(w.loesung)}</p>
    <ol class="legs">${w.schritte.map((s, i) => `<li data-reveal><span>${i + 1}</span><h3>${s.t}</h3><p>${s.d}</p></li>`).join('')}</ol></section>
  <section class="st st-sea">${sectionHead('03', 'Ergebnis', 'Ein Sortiment, ein Bestand, eine Wahrheit.')}<p class="st-lead" data-reveal>${esc(w.ergebnis)}</p>
    <ul class="nums">${w.zahlen.map(z => `<li data-reveal><b data-count="${z.n}" data-suffix="${z.s}">${z.n}${z.s}</b><span>${esc(z.l)}</span></li>`).join('')}</ul>
    <p class="fn">${C.hinweisBeispiel}</p></section>
  <section class="st"><figure class="bigq" data-reveal><blockquote>„${esc(w.stimme.q)}“</blockquote><figcaption><b>${w.stimme.w}</b>${w.stimme.f}</figcaption></figure></section>
</div>
<section class="dock" id="kontakt"><svg class="dock-w" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 120V60C120 20 240 20 360 60S600 100 720 60 960 20 1080 60 1320 100 1440 60V120Z"/></svg>
  <div class="dock-in"><p class="eyebrow">Nächster Hafen</p><h2 data-split>Ihr Geschäft könnte das nächste sein.</h2><div class="cta" data-reveal><a class="btn btn-red" href="${C.termin}">Termin buchen</a><a class="btn btn-ghost" href="index.html#referenzen">Weitere Referenzen</a></div></div></section>`;
  return page({ k: 1, title: 'Case Wein-Bauer.de · Konzept 1 – Hafenkarte', desc: 'Case: Multi-Channel-Handel mit Shopware 6.', theme: '#EFE6D2', body: shell(body), attrs: 'data-smooth' });
}

function praes() {
  const bg = (i) => ['<circle cx="1000" cy="300" r="260"/><circle cx="1000" cy="300" r="190"/><circle cx="1000" cy="300" r="120"/>', '<path d="M0 500 Q300 380 600 480 T1200 420"/><path d="M0 560 Q300 440 600 540 T1200 480"/><path d="M0 620 Q300 500 600 600 T1200 540"/>', '<rect x="760" y="120" width="300" height="300"/><rect x="820" y="180" width="300" height="300"/><rect x="880" y="240" width="300" height="300"/>', '<circle cx="900" cy="200" r="60"/><circle cx="1010" cy="320" r="90"/><circle cx="860" cy="430" r="40"/>', '<path d="M700 100 L1100 100 L1100 500"/><path d="M740 140 L1060 140 L1060 460"/>', '<circle cx="950" cy="320" r="220"/><path d="M950 100V540M730 320H1170"/>'][i];
  const slides = C.slides.map((s, i) => `<section class="sl ${i === 0 ? 'on' : ''}" data-i="${i}" aria-roledescription="Folie" aria-label="Folie ${i + 1} von ${C.slides.length}" ${i ? 'aria-hidden="true"' : ''}>
    <svg class="sl-bg" viewBox="0 0 1200 700" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.2">${bg(i)}</svg>
    <div class="sl-in"><p class="eyebrow">${String(i + 1).padStart(2, '0')} · ${esc(s.k)}</p><h2>${esc(s.t)}</h2><p class="lead">${esc(s.d)}</p></div></section>`).join('');
  const body = `<div id="top"></div>${header()}${menu()}${wave}<main id="main" class="deck">
  <div class="stage" id="stage" tabindex="0" aria-label="Präsentation. Mit Pfeiltasten blättern.">${slides}</div>
  <div class="deck-ui"><button type="button" class="dbtn" data-prev aria-label="Vorherige Folie"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
    <div class="dprog" aria-hidden="true"><i></i></div><span class="dcount" aria-live="polite"><b data-cur>01</b> / ${String(C.slides.length).padStart(2, '0')}</span>
    <button type="button" class="dbtn" data-next aria-label="Nächste Folie"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
    <button type="button" class="dbtn" data-full aria-label="Vollbild"><svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button></div>
  <p class="deck-h">Tipp: ← → blättern · F Vollbild · Esc Menü schließen</p></main>`;
  return page({ k: 1, title: 'Präsentation · Konzept 1 – Hafenkarte', desc: 'Präsentationsfolien im Stil der Hafenkarte.', theme: '#0B2540', body, cls: 'is-deck' });
}

export const pages = () => ({ 'index.html': index(), 'leistung.html': leistung(), 'case.html': caseP(), 'praesentation.html': praes() });
