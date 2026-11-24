// Konzept 14 · PILLE – nach Owner-Referenz „Clothy“: Creme, breite Fettschrift, Wörter in Pillen, orangefarbener Pfeil-Chip, Blob-Fotos (hier: Möwe), Produktkarte als Kapsel.
import { page, logo, esc } from './lib.mjs';
import { C } from '../content.mjs';

const pad = n => String(n).padStart(2, '0');
const sq = `<svg class="sq" viewBox="0 0 300 12" preserveAspectRatio="none" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M2 6C25 0 40 12 62 6S100 0 124 6S162 12 186 6S224 0 248 6S280 10 298 6"/></svg>`;
const arrow = `<svg viewBox="0 0 60 16" aria-hidden="true"><path d="M2 8h52M46 2l8 6-8 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const blob = (cls, c, img) => `<div class="blob ${cls}" style="--c:${c}"><svg viewBox="0 0 400 360" aria-hidden="true"><path d="M70 60C130 10 250 0 330 50C395 90 400 190 350 250C300 320 170 365 90 320C10 275 -10 120 70 60Z" fill="var(--c)"/></svg>${img}</div>`;
const gull = (flip) => `<img class="g" src="../media/moewe.webp" alt="" width="888" height="1504" decoding="async"${flip ? ' style="scale:-1 1"' : ''}>`;

function index() {
  const body = `<div id="top"></div>
<header class="hd"><div class="hd-in">
  <a class="hd-logo" href="index.html" aria-label="NetzKombyse – Startseite">${logo()}</a>
  <nav class="hd-nav" aria-label="Hauptnavigation"><a href="#leistung">Leistung</a><a href="#lage">Lage</a><a href="#arbeit">Arbeit</a><a href="#stimmen">Stimmen</a><a href="#kontakt">Kontakt</a></nav>
  <div class="hd-r"><a class="cart" href="${C.termin}">Termin <b>1</b></a><button class="mt" type="button" data-motion-toggle aria-pressed="true" title="Animationen ein- oder ausschalten"><span class="mt-i" aria-hidden="true"></span><span data-motion-label>Bewegung an</span></button></div>
</div></header>
<main id="main">
<section class="hero" aria-labelledby="h1">
  <div class="side" data-reveal><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span><p>Digitaler Vertrieb ist eine Frage der Haltung: klare Systeme, feste Ansprechpartner, ein Shop, der sich rechnet.</p><a class="more" href="#leistung">Mehr lesen ↗</a></div>
  <h1 id="h1" aria-label="Shops sind das Rückgrat des Handels"><span class="r"><span class="pill" data-reveal>Shops</span> sind</span><span class="r">das <span class="chip" data-reveal style="--d:90ms">${arrow}</span> Rückgrat</span><span class="r"><span class="pill" data-reveal style="--d:160ms">des</span> Handels${sq}</span></h1>
  <a class="card-v" href="#arbeit" data-reveal style="--d:200ms">${blob('mini', '#FFC93C', gull())}<b>Wein-Bauer.de</b><span>Multi-Channel</span></a>
</section>
<div class="meta"><span class="tag"><b>01</b></span><span class="tag">Leistung</span><span class="tag" style="margin-left:auto">${C.jahre}+ Jahre</span></div>
<section class="trio">
  ${blob('b1', '#FFC93C', gull())}
  <a class="cap" href="${C.termin}" data-reveal><span class="exp"><i aria-hidden="true">${arrow}</i><b>Termin</b></span><strong>${C.zahlen.marken}<sup>Marken</sup></strong><span>in ${C.zahlen.branchen} Branchen</span><span class="plus" aria-hidden="true">+</span></a>
  ${blob('b2', '#FF6B14', gull(true))}
</section>

<section class="sec" id="leistung"><div class="wr"><p class="tag" data-reveal><b>02</b> Leistung</p><h2 data-reveal>Drei <span class="pill">Disziplinen</span>, ein Ziel.</h2>
  <ol class="caps">${C.disziplinen.map((d, i) => `<li data-reveal style="--d:${i * 90}ms"><a href="#kontakt"><b>${pad(i + 1)}</b><h3>${esc(d.t)}</h3><p>${esc(d.d)}</p><span class="go" aria-hidden="true">${arrow}</span></a></li>`).join('')}</ol></div></section>

<section class="sec sec-y" id="lage"><div class="wr"><p class="tag" data-reveal><b>03</b> Ausgangslage</p><h2 data-reveal>Woher Sie <span class="pill">kommen</span>.</h2>
  <ul class="lg">${C.lagen.map((l, i) => `<li data-reveal style="--d:${i * 80}ms"><h3>${esc(l.t)}</h3><p>${esc(l.d)}</p></li>`).join('')}</ul>
  <ul class="pil">${C.saeulen.map(s => `<li data-reveal><b>${esc(s.t)}</b><span>${esc(s.d)}</span></li>`).join('')}</ul></div></section>

<section class="sec" id="arbeit"><div class="wr"><p class="tag" data-reveal><b>04</b> Arbeit</p><h2 data-reveal>Ausgewählte <span class="pill">Projekte</span>.</h2>
  <ul class="work">${C.cases.map(c => `<li data-reveal><b>${esc(c.t)}</b><span>${esc(c.typ)} · ${esc(c.branche)}</span></li>`).join('')}</ul></div></section>

<section class="sec sec-o" id="stimmen"><div class="wr"><p class="tag tag-w" data-reveal><b>05</b> Stimmen</p><div class="sm">${C.stimmen.map((s, i) => `<figure data-reveal style="--d:${i * 90}ms"><blockquote>${esc(s.q)}</blockquote><figcaption>${esc(s.w)}, ${esc(s.f)}${s.hinweis ? ` (${esc(s.hinweis)})` : ''}</figcaption></figure>`).join('')}</div></div></section>

<section class="sec" id="kontakt"><div class="wr ct"><p class="tag" data-reveal><b>06</b> Kontakt</p><h2 data-reveal>Reden wir <span class="pill">persönlich</span>.</h2>
  <p class="lead" data-reveal>${C.ansprech.name}, ${C.ansprech.rolle}. Ihr Ansprechpartner von der ersten Frage an.</p>
  <p class="acts" data-reveal><a class="btn" href="${C.termin}">Termin buchen</a><a class="btn btn-o" href="${C.telHref}">${C.tel}</a></p></div></section>
</main>
<footer class="ft"><a class="ft-logo" href="index.html" aria-label="Startseite">${logo()}</a><p>${C.adresse.join(', ')} · <a href="${C.telHref}">${C.tel}</a></p>
  <p><a href="#">Impressum</a> · <a href="#">Datenschutz</a> · <a href="../index.html">Konzept wechseln</a> · <a href="#top">Nach oben</a></p>
  <p class="ft-n">${C.hinweisBeispiel} Zitate sinngemäß bzw. Platzhalter. Dieses Konzept ist nur als Startseite ausgearbeitet.</p></footer>`;
  return page({ k: 'k14', title: 'NetzKombyse · Konzept 14 Pille', desc: 'Konzept 14: Pille – Creme, breite Fettschrift, Pillen und Blobs, Möwe statt Fotos.', theme: '#FFF9EE', body });
}
export const pages = () => ({ 'index.html': index() });
