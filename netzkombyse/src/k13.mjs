// Konzept 13 · FEDERSTRICH – nach Owner-Vorlage (Scale&Craft): körniges Papier, kontrastreiche Serife in zwei Gewichten, viel Weißraum,
// handgezeichnete Strichillustration (Möwe lässt eine Münze auf den Stapel fallen), dunkle Sektionen im Wechsel.
import { page, logo, esc } from './lib.mjs';
import { C } from '../content.mjs';
import { marken } from './lib2.mjs';

const pad = n => String(n).padStart(2, '0');
// Strichillustration: Horizont, zwei Münzstapel, Keimling, Möwe im Flug mit gestrichelter Fallbahn der Münze
const coins = (cx, base, rx, ry, n, h) => Array.from({ length: n }, (_, i) => { const y = base - i * h;
  return `<path d="M${cx - rx} ${y}v${h}A${rx} ${ry} 0 0 0 ${cx + rx} ${y + h}v${-h}"/><ellipse cx="${cx}" cy="${y}" rx="${rx}" ry="${ry}" ${i === n - 1 ? '' : 'fill="var(--bg)"'}/>`; }).join('');
const art = `<svg class="art" viewBox="0 0 900 760" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
  <path d="M0 668C110 654 210 676 330 660S520 626 610 650S780 688 900 630"/>
  <g>${coins(470, 640, 92, 30, 3, 36)}</g><g>${coins(730, 650, 88, 29, 6, 36)}</g>
  <path d="M470 532C470 492 482 462 512 436"/><path d="M470 504C440 466 396 470 372 484C404 510 442 516 470 504Z"/>
  <path d="M512 436C534 390 580 376 606 388C602 432 556 450 512 436Z" fill="currentColor"/><path d="M522 428C548 410 570 400 596 394" stroke="var(--bg)" stroke-width="2"/>
  <g class="gull"><path d="M600 236C646 202 742 196 796 232C764 246 706 250 658 266C634 266 612 256 600 236Z"/>
    <circle cx="806" cy="222" r="17"/><path d="M822 218L852 228L822 236"/><circle cx="811" cy="219" r="2.4" fill="currentColor" stroke="none"/>
    <path d="M652 220C618 148 556 112 494 122C556 154 596 190 636 250"/><path d="M696 214C706 136 770 88 846 86C804 128 752 160 716 228Z" fill="currentColor"/>
    <path d="M602 238L558 262L612 262"/><path d="M700 258L694 290M726 254L724 288"/></g>
  <path d="M822 252C842 330 780 420 732 530" stroke-dasharray="2 9"/><circle cx="728" cy="548" r="10"/>
</svg>`;
const wave = `<svg class="wavy" viewBox="0 0 440 22" preserveAspectRatio="none" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M2 9C40 1 70 17 110 9S180 1 220 9S300 17 340 9S410 3 438 9"/><path d="M60 16C110 10 150 20 200 15S280 10 330 16"/></svg>`;
const sec = (cls, inner) => `<section class="sec ${cls}">${inner}</section>`;

function index() {
  const body = `<div id="top"></div>
<header class="hd">
  <a class="hd-logo" href="index.html" aria-label="NetzKombyse – Startseite">${logo()}<span class="ribbon" aria-hidden="true">Digitaler Commerce aus Hamburg</span></a>
  <nav class="hd-nav" aria-label="Hauptnavigation"><a href="#top" aria-current="page">Start</a><a href="#leistung">Leistung</a><a href="#arbeit">Arbeit</a><a href="#kontakt">Kontakt</a></nav>
  <div class="hd-r"><a class="ico" href="${C.telHref}" aria-label="Anrufen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="currentColor"/></svg></a>
    <a class="ico" href="${C.termin}" aria-label="Termin buchen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2v3M17 2v3M3.500 9h17M5 4.500h14a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6.500a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round"/></svg></a>
    <button class="mt" type="button" data-motion-toggle aria-pressed="true" title="Animationen ein- oder ausschalten"><span class="mt-i" aria-hidden="true"></span><span data-motion-label>Bewegung an</span></button></div>
</header>
<main id="main">
<section class="hero" aria-labelledby="h1">
  <div class="hero-t">
    <h1 id="h1"><span class="l" data-reveal>digitaler <b>Vertrieb</b></span><span class="l" data-reveal style="--d:90ms">braucht klare <span class="uw">Systeme${wave}</span></span><span class="l" data-reveal style="--d:180ms">und <b>Menschen</b>, die bleiben</span></h1>
    <p class="lead" data-reveal style="--d:260ms">NetzKombyse baut Shops, Schnittstellen und Marketing für inhabergeführte Mittelständler. Aus Hamburg, mit festen Ansprechpartnern.</p>
    <p data-reveal style="--d:320ms"><a class="btn" href="#kontakt">Kontakt aufnehmen</a></p>
  </div>
  <div class="hero-a" data-art>${art}</div>
</section>

${sec('sec-d', `<div class="wr"><p class="k" data-reveal>Leistung</p><h2 data-reveal>Drei Disziplinen. <i>Ein</i> Ziel.</h2>
  <ol class="rows">${C.disziplinen.map((d, i) => `<li data-reveal><a href="#kontakt"><span class="n">${pad(i + 1)}</span><b>${esc(d.t)}</b><span class="d">${esc(d.d)}</span></a></li>`).join('')}</ol></div>`).replace('class="sec sec-d"', 'class="sec sec-d" id="leistung"')}

${sec('', `<div class="wr"><p class="k" data-reveal>Ausgangslage</p><h2 data-reveal>Woher Sie <i>kommen</i>.</h2>
  <ul class="lg">${C.lagen.map((l, i) => `<li data-reveal style="--d:${i * 90}ms"><span class="n">${pad(i + 1)}</span><h3>${esc(l.t)}</h3><p>${esc(l.d)}</p></li>`).join('')}</ul>
  <ul class="pil">${C.saeulen.map(s => `<li data-reveal><b>${esc(s.t)}</b><span>${esc(s.d)}</span></li>`).join('')}</ul></div>`)}

${sec('sec-d', `<div class="wr"><ul class="nums">${[[C.zahlen.marken, '', 'Marken'], [C.zahlen.branchen, '', 'Branchen'], [C.jahre, '+', 'Jahre Erfahrung'], [C.zahlen.team, '', 'Menschen']].map(([n, s, l]) => `<li data-reveal><b><span data-count="${n}" data-suffix="${s}">${n}${s}</span></b><span>${l}</span></li>`).join('')}</ul></div>`)}

${sec('', `<div class="wr"><p class="k" data-reveal>Arbeit</p><h2 data-reveal>Ausgewählte <i>Projekte</i>.</h2>
  <ul class="work">${C.cases.map(c => `<li data-reveal><b>${esc(c.t)}</b><span>${esc(c.typ)} · ${esc(c.branche)}</span></li>`).join('')}</ul>
  <p class="band" aria-label="Kunden"><span class="band-t">${marken()}</span></p></div>`).replace('class="sec "', 'class="sec" id="arbeit"')}

${sec('sec-d', `<div class="wr"><p class="k" data-reveal>Stimmen</p><div class="sm">${C.stimmen.map((s, i) => `<figure data-reveal style="--d:${i * 90}ms"><blockquote>${esc(s.q)}</blockquote><figcaption>${esc(s.w)}, ${esc(s.f)}${s.hinweis ? ` (${esc(s.hinweis)})` : ''}</figcaption></figure>`).join('')}</div></div>`)}

${sec('', `<div class="wr ct"><p class="k" data-reveal>Kontakt</p><h2 class="big" data-reveal>Reden wir. <b>Persönlich.</b></h2>
  <p class="lead" data-reveal>${C.ansprech.name}, ${C.ansprech.rolle}. Ihr Ansprechpartner von der ersten Frage an.</p>
  <p class="acts" data-reveal><a class="btn" href="${C.termin}">Termin buchen</a><a class="btn btn-o" href="${C.telHref}">${C.tel}</a></p></div>`).replace('class="sec "', 'class="sec" id="kontakt"')}
</main>
<footer class="ft"><a class="ft-logo" href="index.html" aria-label="Startseite">${logo()}</a>
  <p>${C.adresse.join(', ')} · <a href="${C.telHref}">${C.tel}</a></p>
  <p><a href="#">Impressum</a> · <a href="#">Datenschutz</a> · <a href="../index.html">Konzept wechseln</a> · <a href="#top">Nach oben</a></p>
  <p class="ft-n">${C.hinweisBeispiel} Zitate sinngemäß bzw. Platzhalter. Dieses Konzept ist nur als Startseite ausgearbeitet.</p></footer>`;
  return page({ k: 'k13', title: 'NetzKombyse · Konzept 13 Federstrich', desc: 'Konzept 13: Federstrich – körniges Papier, Serife, Strichillustration, dunkle Sektionen.', theme: '#EDEBE7', body });
}
export const pages = () => ({ 'index.html': index() });
