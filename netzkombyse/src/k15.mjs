// Konzept 15 · GLUT – nach Owner-Referenz „Kontour“: Schwarz, Orange-Verlaufsnebel, Montserrat, Riesenwort angeschnitten hinter dem Motiv (Möwe), Akkordeon-Leistungen, Kennzahlen-Karten.
import { page, logo, esc } from './lib.mjs';
import { C } from '../content.mjs';

const pad = n => String(n).padStart(2, '0');
const ar = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9l6-6M4 3h5v5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const btn = (href, t, cls = '') => `<a class="pillb ${cls}" href="${href}"><span>${t}</span><i aria-hidden="true">${ar}</i></a>`;
const gull = '<img class="g" src="../media/moewe.webp" alt="" width="888" height="1504" decoding="async">';

function index() {
  const body = `<div id="top"></div>
<header class="hd"><a class="hd-logo" href="index.html" aria-label="NetzKombyse – Startseite">${logo()}</a>
  <nav class="hd-nav" aria-label="Hauptnavigation"><a href="#leistung">Leistung</a><a href="#haltung">Haltung</a><a href="#arbeit">Arbeit</a><a href="#kontakt">Kontakt</a></nav>
  <button class="mt" type="button" data-motion-toggle aria-pressed="true" title="Animationen ein- oder ausschalten"><span class="mt-i" aria-hidden="true"></span><span data-motion-label>Bewegung an</span></button></header>
<main id="main">
<section class="hero" aria-labelledby="h1">
  <div class="glow" aria-hidden="true"></div>
  <p class="k" data-reveal>Digitaler Commerce · Hamburg</p>
  <h1 id="h1" data-reveal>Klarheit zuerst.<br>Dann das System.</h1>
  <p class="s" data-reveal>Shops, Schnittstellen und Marketing für Mittelständler, in einem klaren Plan zusammengeführt.</p>
  <p class="ctas" data-reveal>${btn(C.termin, 'Termin buchen')}${btn('#arbeit', 'Arbeiten ansehen', 'ghost')}</p>
  <aside class="rec" data-reveal><b>Erfahrung</b><p>Wir bauen Systeme, die Marken im Handel klar und verlässlich machen.</p>
    <div class="st"><strong data-count="${C.jahre}" data-suffix="+">${C.jahre}+</strong><span>Jahre am Markt</span></div><div class="st"><strong data-count="${C.zahlen.marken}">${C.zahlen.marken}</strong><span>Marken begleitet</span></div></aside>
  <div class="gwrap" aria-hidden="true">${gull}</div>
  <p class="big" aria-hidden="true">NETZKOMBYSE</p>
</section>

<section class="sec" id="leistung"><div class="wr"><div class="two"><h2 data-reveal>KLARE SYSTEME FÜR WACHSTUM.</h2><p class="side" data-reveal>Strategie, Technologie und Marketing greifen ineinander. Aus drei Disziplinen wird ein Vorgehen.</p></div>
  <ol class="acc">${C.disziplinen.map((d, i) => `<li class="${i === 1 ? 'open' : ''}" data-reveal><button type="button" aria-expanded="${i === 1}" aria-controls="p${i}"><span class="n">[${pad(i + 1)}]</span><b>${esc(d.t).toUpperCase()}</b><i class="ar" aria-hidden="true">${ar}</i></button><div id="p${i}" class="pn" ${i === 1 ? '' : 'hidden'}><p>${esc(d.d)}</p>${btn(C.termin, 'Projekt starten')}</div></li>`).join('')}</ol></div></section>

<section class="sec fog" id="haltung"><div class="wr"><div class="head2"><p class="k">Studio</p><h2 data-reveal>WIR FORMEN MARKEN MIT KLARHEIT UND STRUKTUR ZU WIEDERERKENNUNG, DIE BLEIBT.</h2></div>
  <div class="cards">${C.lagen.map((l, i) => `<article class="cd ${i === 1 ? 'cw' : ''}" data-reveal style="--d:${i * 90}ms"><strong>${pad(i + 1)}</strong><h3>${esc(l.t)}</h3><p>${esc(l.d)}</p></article>`).join('')}</div>
  <ul class="pil">${C.saeulen.map(s => `<li data-reveal><b>${esc(s.t)}</b><span>${esc(s.d)}</span></li>`).join('')}</ul></div></section>

<section class="sec" id="arbeit"><div class="wr"><h2 data-reveal>PROJEKTE, DIE BLEIBEN.</h2><ul class="work">${C.cases.map(c => `<li data-reveal><span class="n">${esc(c.typ)}</span><b>${esc(c.t)}</b><span>${esc(c.branche)}</span></li>`).join('')}</ul>
  <div class="sm">${C.stimmen.map((s, i) => `<figure data-reveal style="--d:${i * 90}ms"><blockquote>${esc(s.q)}</blockquote><figcaption>${esc(s.w)}, ${esc(s.f)}${s.hinweis ? ` (${esc(s.hinweis)})` : ''}</figcaption></figure>`).join('')}</div></div></section>

<section class="sec end" id="kontakt"><div class="glow g2" aria-hidden="true"></div><div class="wr"><p class="k">Kontakt</p><h2 class="b" data-reveal>REDEN WIR.<br>PERSÖNLICH.</h2><p class="s" data-reveal>${C.ansprech.name}, ${C.ansprech.rolle}. Ihr Ansprechpartner von der ersten Frage an.</p>
  <p class="ctas" data-reveal>${btn(C.termin, 'Termin buchen')}${btn(C.telHref, C.tel, 'ghost')}</p></div><p class="big b2" aria-hidden="true">KONTAKT</p></section>
</main>
<footer class="ft"><a class="ft-logo" href="index.html" aria-label="Startseite">${logo()}</a><p>${C.adresse.join(', ')} · <a href="${C.telHref}">${C.tel}</a></p>
  <p><a href="#">Impressum</a> · <a href="#">Datenschutz</a> · <a href="../index.html">Konzept wechseln</a> · <a href="#top">Nach oben</a></p>
  <p class="ft-n">${C.hinweisBeispiel} Zitate sinngemäß bzw. Platzhalter. Dieses Konzept ist nur als Startseite ausgearbeitet.</p></footer>`;
  return page({ k: 'k15', title: 'NetzKombyse · Konzept 15 Glut', desc: 'Konzept 15: Glut – Schwarz mit Orange-Verlauf, Riesenwort hinter der Möwe.', theme: '#000000', body });
}
export const pages = () => ({ 'index.html': index() });
