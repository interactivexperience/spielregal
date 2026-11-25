// Konzept 16 · STENCIL – nach Owner-Referenz „KODE.IMMERSIVE“: Orange-Rot-Verlauf mit Filmkorn, Versal-Serife über die ganze Breite, Objekt (hier die Möwe) schwebt zwischen den Zeilen, Mini-Navigation in Klammern.
import { page, logo, esc } from './lib.mjs';
import { C } from '../content.mjs';

const pad = n => String(n).padStart(3, '0');
const sec = (id, n, inner, cls = '') => `<section class="sl ${cls}" id="${id}" data-sl aria-label="${id}"><span class="ix" aria-hidden="true">[ ${pad(n)} ]</span>${inner}</section>`;

function index() {
  const body = `<div id="top"></div><svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="liquid" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".012 .02" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="70" xChannelSelector="R" yChannelSelector="G"/></filter></svg>
<header class="hd"><span class="hd-a">NETZKOMBYSE</span><a class="hd-logo" href="index.html" aria-label="NetzKombyse – Startseite">${logo()}</a>
  <span class="hd-m"><button class="mt" type="button" data-motion-toggle aria-pressed="true" title="Animationen ein- oder ausschalten"><span class="mt-i" aria-hidden="true"></span><span data-motion-label>[ Bewegung an ]</span></button><span class="cnt" aria-hidden="true">[ <b data-cur>001</b> ]</span></span>
  <a class="hd-c" href="#kontakt">KONTAKT</a></header>
<div class="grain" aria-hidden="true"></div><div class="dot" aria-hidden="true"></div>
<main id="main">
${sec('s1', 1, `<h1 class="giant" aria-label="Wir bauen Shops mit Haltung"><span class="ln" data-reveal>WIR BAUEN</span><span class="ln" data-reveal style="--d:90ms">SHOPS MIT</span><span class="ln" data-reveal style="--d:180ms">HALTUNG</span></h1>
  <div class="obj" data-obj aria-hidden="true"><img src="../media/moewe.webp" alt="" width="888" height="1504" decoding="async"></div>
  <div class="glass chev" data-lg aria-hidden="true"><i class="lg-f"></i><svg class="lg-r" viewBox="0 0 300 560" preserveAspectRatio="none"><defs><linearGradient id="rg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".4" stop-color="#fff" stop-opacity=".08"/><stop offset=".72" stop-color="#ffd2b0" stop-opacity=".3"/><stop offset="1" stop-color="#fff" stop-opacity=".9"/></linearGradient></defs><path d="M20 20L280 280L20 540L20 440L180 280L20 120Z" fill="none" stroke="url(#rg1)" stroke-width="5" stroke-linejoin="round"/></svg></div>
  <div class="glass orb o1" data-lg aria-hidden="true"><i class="lg-f"></i></div><div class="glass orb o2" data-lg aria-hidden="true"><i class="lg-f"></i></div>
  <p class="cap" data-reveal>Digitaler Commerce aus Hamburg. Für Mittelständler, die mehr vorhaben.</p>`, 'orange')}
${sec('s2', 2, `<p class="lab" data-reveal>[ LEISTUNG ]</p><ol class="rows">${C.disziplinen.map((d, i) => `<li data-reveal style="--d:${i * 90}ms"><a href="#kontakt"><span class="num">${String(i + 1).padStart(2, '0')}</span><b>${esc(d.t).toUpperCase()}</b><span class="d">${esc(d.d)}</span></a></li>`).join('')}</ol>`, 'dark')}
${sec('s3', 3, `<p class="lab" data-reveal>[ AUSGANGSLAGE ]</p><h2 class="giant mid" data-reveal>WOHER SIE KOMMEN</h2><ul class="lg">${C.lagen.map((l, i) => `<li data-reveal style="--d:${i * 90}ms"><h3>${esc(l.t)}</h3><p>${esc(l.d)}</p></li>`).join('')}</ul><ul class="pil">${C.saeulen.map(s => `<li data-reveal><b>${esc(s.t)}</b><span>${esc(s.d)}</span></li>`).join('')}</ul>`, 'orange')}
${sec('s4', 4, `<p class="lab" data-reveal>[ ARBEIT ]</p><ul class="work">${C.cases.map(c => `<li data-reveal><b>${esc(c.t).toUpperCase()}</b><span>${esc(c.typ)} · ${esc(c.branche)}</span></li>`).join('')}</ul><div class="sm">${C.stimmen.map((s, i) => `<figure data-reveal style="--d:${i * 90}ms"><blockquote>${esc(s.q)}</blockquote><figcaption>${esc(s.w)}, ${esc(s.f)}${s.hinweis ? ` (${esc(s.hinweis)})` : ''}</figcaption></figure>`).join('')}</div>`, 'dark')}
${sec('kontakt', 5, `<h2 class="giant" data-reveal><span class="ln">REDEN</span><span class="ln">WIR</span></h2><div class="glass orb o3" data-lg aria-hidden="true"><i class="lg-f"></i></div><div class="glass orb o4" data-lg aria-hidden="true"><i class="lg-f"></i></div><div class="ct" data-reveal><p>${C.ansprech.name}, ${C.ansprech.rolle}. Ihr Ansprechpartner von der ersten Frage an.</p><p class="acts"><a class="btn" href="${C.termin}">TERMIN BUCHEN</a><a class="btn btn-o" href="${C.telHref}">${C.tel}</a></p>
  <p class="fine">${C.adresse.join(', ')} · <a href="#">Impressum</a> · <a href="#">Datenschutz</a> · <a href="../index.html">Konzept wechseln</a></p><p class="fine">${C.hinweisBeispiel} Zitate sinngemäß bzw. Platzhalter. Dieses Konzept ist nur als Startseite ausgearbeitet.</p></div>`, 'orange')}
</main>`;
  return page({ k: 'k16', title: 'NetzKombyse · Konzept 16 Stencil', desc: 'Konzept 16: Stencil – Orange-Verlauf mit Korn, Versal-Serife, Möwe zwischen den Zeilen.', theme: '#FF5A14', body });
}
export const pages = () => ({ 'index.html': index() });
