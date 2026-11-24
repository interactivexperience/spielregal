// Konzept 16 · STENCIL – nach Owner-Referenz „KODE.IMMERSIVE“: Orange-Rot-Verlauf mit Filmkorn, Versal-Serife über die ganze Breite, Objekt (hier die Möwe) schwebt zwischen den Zeilen, Mini-Navigation in Klammern.
import { page, logo, esc } from './lib.mjs';
import { C } from '../content.mjs';

const pad = n => String(n).padStart(3, '0');
const sec = (id, n, inner, cls = '') => `<section class="sl ${cls}" id="${id}" data-sl aria-label="${id}"><span class="ix" aria-hidden="true">[ ${pad(n)} ]</span>${inner}</section>`;

function index() {
  const body = `<div id="top"></div>
<header class="hd"><span class="hd-a">NETZKOMBYSE</span><a class="hd-logo" href="index.html" aria-label="NetzKombyse – Startseite">${logo()}</a>
  <span class="hd-m"><button class="mt" type="button" data-motion-toggle aria-pressed="true" title="Animationen ein- oder ausschalten"><span class="mt-i" aria-hidden="true"></span><span data-motion-label>[ Bewegung an ]</span></button><span class="cnt" aria-hidden="true">[ <b data-cur>001</b> ]</span></span>
  <a class="hd-c" href="#kontakt">KONTAKT</a></header>
<div class="grain" aria-hidden="true"></div><div class="dot" aria-hidden="true"></div>
<main id="main">
${sec('s1', 1, `<h1 class="giant" aria-label="Wir bauen Shops mit Haltung"><span class="ln" data-reveal>WIR BAUEN</span><span class="ln" data-reveal style="--d:90ms">SHOPS MIT</span><span class="ln" data-reveal style="--d:180ms">HALTUNG</span></h1>
  <div class="obj" data-obj aria-hidden="true"><img src="../media/moewe.webp" alt="" width="888" height="1504" decoding="async"></div>
  <p class="cap" data-reveal>Digitaler Commerce aus Hamburg. Für Mittelständler, die mehr vorhaben.</p>`, 'orange')}
${sec('s2', 2, `<p class="lab" data-reveal>[ LEISTUNG ]</p><ol class="rows">${C.disziplinen.map((d, i) => `<li data-reveal style="--d:${i * 90}ms"><a href="#kontakt"><span class="num">${String(i + 1).padStart(2, '0')}</span><b>${esc(d.t).toUpperCase()}</b><span class="d">${esc(d.d)}</span></a></li>`).join('')}</ol>`, 'dark')}
${sec('s3', 3, `<p class="lab" data-reveal>[ AUSGANGSLAGE ]</p><h2 class="giant mid" data-reveal>WOHER SIE KOMMEN</h2><ul class="lg">${C.lagen.map((l, i) => `<li data-reveal style="--d:${i * 90}ms"><h3>${esc(l.t)}</h3><p>${esc(l.d)}</p></li>`).join('')}</ul><ul class="pil">${C.saeulen.map(s => `<li data-reveal><b>${esc(s.t)}</b><span>${esc(s.d)}</span></li>`).join('')}</ul>`, 'orange')}
${sec('s4', 4, `<p class="lab" data-reveal>[ ARBEIT ]</p><ul class="work">${C.cases.map(c => `<li data-reveal><b>${esc(c.t).toUpperCase()}</b><span>${esc(c.typ)} · ${esc(c.branche)}</span></li>`).join('')}</ul><div class="sm">${C.stimmen.map((s, i) => `<figure data-reveal style="--d:${i * 90}ms"><blockquote>${esc(s.q)}</blockquote><figcaption>${esc(s.w)}, ${esc(s.f)}${s.hinweis ? ` (${esc(s.hinweis)})` : ''}</figcaption></figure>`).join('')}</div>`, 'dark')}
${sec('kontakt', 5, `<h2 class="giant" data-reveal><span class="ln">REDEN</span><span class="ln">WIR</span></h2><div class="ct" data-reveal><p>${C.ansprech.name}, ${C.ansprech.rolle}. Ihr Ansprechpartner von der ersten Frage an.</p><p class="acts"><a class="btn" href="${C.termin}">TERMIN BUCHEN</a><a class="btn btn-o" href="${C.telHref}">${C.tel}</a></p>
  <p class="fine">${C.adresse.join(', ')} · <a href="#">Impressum</a> · <a href="#">Datenschutz</a> · <a href="../index.html">Konzept wechseln</a></p><p class="fine">${C.hinweisBeispiel} Zitate sinngemäß bzw. Platzhalter. Dieses Konzept ist nur als Startseite ausgearbeitet.</p></div>`, 'orange')}
</main>`;
  return page({ k: 'k16', title: 'NetzKombyse · Konzept 16 Stencil', desc: 'Konzept 16: Stencil – Orange-Verlauf mit Korn, Versal-Serife, Möwe zwischen den Zeilen.', theme: '#FF5A14', body });
}
export const pages = () => ({ 'index.html': index() });
