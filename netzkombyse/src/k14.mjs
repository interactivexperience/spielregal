// Konzept 14 · PILLE – nach Owner-Referenz „Clothy“, jetzt im Darkmode: Typo als Zentrum des Heros, genau eine Möwe im Hero, Wörter in Pillen, Kapselkarten.
import { page, logo, esc } from './lib.mjs';
import { C } from '../content.mjs';

const pad = n => String(n).padStart(2, '0');
const sq = `<svg class="sq" viewBox="0 0 300 12" preserveAspectRatio="none" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M2 6C25 0 40 12 62 6S100 0 124 6S162 12 186 6S224 0 248 6S280 10 298 6"/></svg>`;
const arrow = `<svg viewBox="0 0 60 16" aria-hidden="true"><path d="M2 8h52M46 2l8 6-8 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const blobSvg = `<svg viewBox="0 0 400 360" aria-hidden="true"><path d="M70 60C130 10 250 0 330 50C395 90 400 190 350 250C300 320 170 365 90 320C10 275 -10 120 70 60Z" fill="var(--c)"/></svg>`;
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
  <div class="meta"><span class="tag"><b>01</b></span><span class="tag">Digitaler Commerce</span><span class="tag mr">Hamburg · ${C.jahre}+ Jahre</span></div>
  <h1 id="h1" aria-label="Wir bauen Shops, die sich rechnen"><span class="r"><span class="pill" data-reveal>Wir bauen</span></span><span class="r"><span class="word" data-reveal style="--d:80ms">Shops</span> <span class="chip" data-reveal style="--d:120ms">${arrow}</span></span><span class="r"><span class="pill" data-reveal style="--d:200ms">die sich</span> <span class="word" data-reveal style="--d:260ms">rechnen</span>${sq}</span></h1>
  <div class="hero-b">
    <p class="lead" data-reveal>Digitaler Vertrieb für Mittelständler: klare Systeme, feste Ansprechpartner, ein Shop, der sich rechnet.</p>
    <p class="acts" data-reveal><a class="btn" href="${C.termin}">Termin buchen</a><a class="more" href="#leistung">Mehr lesen ↗</a></p>
  </div>
  <div class="blob hg" style="--c:#FF6B14">${blobSvg}${gull()}</div>
</section>

<section class="sec" id="leistung"><div class="wr"><p class="tag" data-reveal><b>02</b> Leistung</p><h2 data-reveal>Drei <span class="pill">Disziplinen</span>, ein Ziel.</h2>
  <ol class="caps">${C.disziplinen.map((d, i) => `<li data-reveal style="--d:${i * 90}ms"><a href="#kontakt"><b>${pad(i + 1)}</b><h3>${esc(d.t)}</h3><p>${esc(d.d)}</p><span class="go" aria-hidden="true">${arrow}</span></a></li>`).join('')}</ol></div></section>

<section class="sec sec-l" id="lage"><div class="wr"><div class="lage"><div class="lage-h"><p class="tag" data-reveal><b>03</b> Ausgangslage</p><h2 data-reveal>Woher <span class="pill">Sie</span> kommen.</h2><p class="sub" data-reveal>Wir begleiten Unternehmen, die E-Commerce als zentralen Teil ihrer Entwicklung sehen, nicht als Nebenschauplatz.</p></div>
  <ol class="steps">${C.lagen.map((l, i) => `<li data-reveal style="--d:${i * 100}ms"><span class="big" aria-hidden="true">${pad(i + 1)}</span><div><h3>${esc(l.t)}</h3><p>${esc(l.d)}</p></div></li>`).join('')}</ol></div>
  <ul class="chips" aria-label="Unsere Säulen">${C.saeulen.map(s => `<li data-reveal><b>${esc(s.t)}</b><span>${esc(s.d)}</span></li>`).join('')}</ul></div></section>

<section class="sec" id="arbeit"><div class="wr"><p class="tag" data-reveal><b>04</b> Arbeit</p><h2 data-reveal>Ausgewählte <span class="pill">Projekte</span>.</h2>
  <ul class="work">${C.cases.map(c => `<li data-reveal><a href="${c.featured ? '../k1/case.html' : '#arbeit'}" ${c.featured ? '' : 'aria-disabled="true" tabindex="-1"'}><b>${esc(c.t)}</b><span>${esc(c.typ)} · ${esc(c.branche)}</span><i class="wi" aria-hidden="true">${arrow}</i></a></li>`).join('')}</ul></div></section>

<section class="sec sec-s" id="stimmen"><div class="wr"><p class="tag" data-reveal><b>05</b> Stimmen</p><h2 data-reveal>Was <span class="pill">Kunden</span> sagen.</h2>
  <div class="vox">${C.stimmen.map((s, i) => `<figure class="${i === 0 ? 'main' : ''}" data-reveal style="--d:${i * 90}ms"><span class="qm" aria-hidden="true">“</span><blockquote>${esc(s.q)}</blockquote><figcaption><span class="av" aria-hidden="true">${esc(s.w.split(' ').map(x => x[0]).join('').slice(0, 2))}</span><span><b>${esc(s.w)}</b><i>${esc(s.f)}${s.hinweis ? ` (${esc(s.hinweis)})` : ''}</i></span></figcaption></figure>`).join('')}</div></div></section>

<section class="sec" id="kontakt"><div class="wr ct"><div class="ct-t"><p class="tag" data-reveal><b>06</b> Kontakt</p><h2 data-reveal>Reden wir <span class="pill">persönlich</span>.</h2>
  <p class="lead" data-reveal>${C.ansprech.name}, ${C.ansprech.rolle}. Ihr Ansprechpartner von der ersten Frage an.</p>
  <p class="acts" data-reveal><a class="btn" href="${C.termin}">Termin buchen</a><a class="btn btn-o" href="${C.telHref}">${C.tel}</a></p></div>
  <div class="blob ctb" style="--c:#FFC93C" aria-hidden="true">${blobSvg}${gull(true)}</div></div></section>
</main>
<footer class="ft"><a class="ft-logo" href="index.html" aria-label="Startseite">${logo()}</a><p>${C.adresse.join(', ')} · <a href="${C.telHref}">${C.tel}</a></p>
  <p><a href="#">Impressum</a> · <a href="#">Datenschutz</a> · <a href="../index.html">Konzept wechseln</a> · <a href="#top">Nach oben</a></p>
  <p class="ft-n">${C.hinweisBeispiel} Zitate sinngemäß bzw. Platzhalter. Dieses Konzept ist nur als Startseite ausgearbeitet.</p></footer>`;
  return page({ k: 'k14', title: 'NetzKombyse · Konzept 14 Pille', desc: 'Konzept 14: Pille – Darkmode, Typo im Zentrum, Pillen und Kapseln, eine Möwe im Blob.', theme: '#0F0E0D', body });
}
export const pages = () => ({ 'index.html': index() });
