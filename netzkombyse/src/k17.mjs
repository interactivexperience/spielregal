// Konzept 17 · INDEX – nach Owner-Referenz „INDEX“: Hellgrau, ultrabreite Rot-Schrift, Schwarz-Weiß-Motiv (hier die Möwe) überlappt das Wort, Rasterlinien, [Klammer]-Labels, schwarze Dreier-Sektion.
import { page, logo, esc } from './lib.mjs';
import { C } from '../content.mjs';

const slash = '<svg class="sl3" viewBox="0 0 70 14" aria-hidden="true"><path d="M2 12L14 2h8L10 12zM26 12L38 2h8L34 12zM50 12L62 2h8L58 12z" fill="currentColor"/></svg>';
const pad = n => String(n).padStart(2, '0');

function index() {
  const body = `<div id="top"></div>
<header class="hd"><a class="hd-logo" href="index.html" aria-label="NetzKombyse – Startseite">${logo()}</a>
  <nav class="hd-nav" aria-label="Hauptnavigation"><a href="#leistung" aria-current="true">[LEISTUNG]</a><a href="#studio">[HALTUNG]</a><a href="#arbeit">[ARBEIT]</a><a href="#kontakt">[KONTAKT]</a></nav>
  <button class="mt" type="button" data-motion-toggle aria-pressed="true" title="Animationen ein- oder ausschalten"><span class="mt-i" aria-hidden="true"></span><span data-motion-label>[BEWEGUNG AN]</span></button></header>
<main id="main">
<section class="hero" aria-labelledby="h1">
  <h1 id="h1" class="mega" aria-label="Netzkombyse"><span data-reveal>NETZ</span></h1>
  <div class="gbw" aria-hidden="true"><img src="../media/moewe.webp" alt="" width="888" height="1504" decoding="async"></div>
  <p class="mini" data-reveal>Wir gestalten klare digitale Vertriebssysteme, die Ideen in Struktur, Richtung und bleibende Wirkung übersetzen.</p>
  <div class="big87" data-reveal>${slash}<strong data-count="${C.zahlen.marken}" data-suffix="+">${C.zahlen.marken}+</strong><span>Marken begleitet</span></div>
  <a class="cta" href="${C.termin}" data-reveal>PROJEKT STARTEN</a>
  <p class="claim" data-reveal><span class="rd">DIGITALER VERTRIEB</span> IST KEINE<br>DEKORATION</p>
</section>

<section class="blk" id="studio"><p class="lab" data-reveal>[ÜBER UNS]</p>
  <h2 class="stm" data-reveal>#WIR_SIND_EIN<br><span class="rd">DIGITALER VERTRIEBSPARTNER,</span> DER SYSTEME BAUT UND BLEIBT</h2></section>

<section class="blk nm" id="zahlen"><div class="top"><span class="chip">${slash}</span><a class="ol" href="${C.termin}">PROJEKT STARTEN</a></div>
  <p class="num" aria-hidden="true">${C.jahre}+</p><p class="ucap">Jahre Erfahrung, ${C.zahlen.team} Menschen, ${C.zahlen.branchen} Branchen</p></section>

<section class="blk dk" id="leistung"><div class="top"><a class="ol" href="${C.termin}">PROJEKT STARTEN</a><span class="mk" aria-hidden="true">${slash}</span><a class="ol" href="#arbeit">ARBEIT</a></div>
  <div class="three">${C.disziplinen.map((d, i) => `<article data-reveal style="--d:${i * 90}ms">${slash}<h3>${esc(d.t).toUpperCase()}</h3><p>${esc(d.d)}</p></article>`).join('')}</div></section>

<section class="blk" id="lage"><p class="lab">[AUSGANGSLAGE]</p><ul class="lg">${C.lagen.map((l, i) => `<li data-reveal style="--d:${i * 90}ms"><span class="lab">[${pad(i + 1)}]</span><h3>${esc(l.t).toUpperCase()}</h3><p>${esc(l.d)}</p></li>`).join('')}</ul>
  <ul class="pil">${C.saeulen.map(s => `<li data-reveal><b>${esc(s.t).toUpperCase()}</b><span>${esc(s.d)}</span></li>`).join('')}</ul></section>

<section class="blk" id="arbeit"><p class="lab">[ARBEIT]</p><ul class="work">${C.cases.map(c => `<li data-reveal><b>${esc(c.t).toUpperCase()}</b><span>${esc(c.typ)} · ${esc(c.branche)}</span></li>`).join('')}</ul>
  <div class="sm">${C.stimmen.map((s, i) => `<figure data-reveal style="--d:${i * 90}ms"><blockquote>${esc(s.q)}</blockquote><figcaption>${esc(s.w)}, ${esc(s.f)}${s.hinweis ? ` (${esc(s.hinweis)})` : ''}</figcaption></figure>`).join('')}</div></section>

<section class="blk dk end" id="kontakt"><p class="lab">[KONTAKT]</p><h2 class="stm w" data-reveal>REDEN WIR.<br><span class="rd">PERSÖNLICH.</span></h2>
  <p class="mini w" data-reveal>${C.ansprech.name}, ${C.ansprech.rolle}. Ihr Ansprechpartner von der ersten Frage an.</p>
  <p class="acts" data-reveal><a class="cta" href="${C.termin}">TERMIN BUCHEN</a><a class="ol" href="${C.telHref}">${C.tel}</a></p></section>
</main>
<footer class="ft"><a class="ft-logo" href="index.html" aria-label="Startseite">${logo()}</a><p>${C.adresse.join(', ')} · <a href="${C.telHref}">${C.tel}</a></p>
  <p><a href="#">Impressum</a> · <a href="#">Datenschutz</a> · <a href="../index.html">Konzept wechseln</a> · <a href="#top">Nach oben</a></p>
  <p class="ft-n">${C.hinweisBeispiel} Zitate sinngemäß bzw. Platzhalter. Dieses Konzept ist nur als Startseite ausgearbeitet.</p></footer>`;
  return page({ k: 'k17', title: 'NetzKombyse · Konzept 17 Index', desc: 'Konzept 17: Index – Hellgrau, ultrabreite Rot-Schrift, Schwarz-Weiß-Möwe über dem Wort.', theme: '#E6E6E6', body });
}
export const pages = () => ({ 'index.html': index() });
