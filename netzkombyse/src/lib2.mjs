// Gemeinsame Inhaltsbausteine für k4–k6 (Markup neutral, jedes Konzept gestaltet es per CSS völlig anders)
import { C } from '../content.mjs';
import { logo, esc } from './lib.mjs';

export const header = (links) => `<header class="hd">
  <a class="hd-logo" href="index.html" aria-label="NetzKombyse – Startseite">${logo()}</a>
  <nav class="hd-nav" aria-label="Hauptnavigation">${links.map(([h, t]) => `<a href="${h}">${esc(t)}</a>`).join('')}</nav>
  <button class="mt" type="button" data-motion-toggle aria-pressed="true" title="Animationen ein- oder ausschalten"><span class="mt-i" aria-hidden="true"></span><span data-motion-label>Bewegung an</span></button>
</header>`;

export const lagen = () => `<ul class="lg">${C.lagen.map((l, i) => `<li data-reveal style="--d:${i * 90}ms"><span class="n" aria-hidden="true">0${i + 1}</span><h3>${esc(l.t)}</h3><p>${esc(l.d)}</p></li>`).join('')}</ul>`;
export const saeulen = () => `<ul class="sl">${C.saeulen.map((s, i) => `<li data-reveal style="--d:${i * 70}ms"><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p></li>`).join('')}</ul>`;
export const disz = () => `<ol class="dz">${C.disziplinen.map((d, i) => `<li data-reveal style="--d:${i * 80}ms"><a href="#kontakt"><span class="n" aria-hidden="true">0${i + 1}</span><h3>${esc(d.t)}</h3><p>${esc(d.d)}</p></a></li>`).join('')}</ol>`;
export const cases = () => `<ul class="cs">${C.cases.map((c, i) => `<li class="${c.featured ? 'feat' : ''}" data-reveal style="--d:${(i % 4) * 60}ms"><span class="cs-m">${esc(c.typ)} · ${esc(c.branche)}</span><h3>${esc(c.t)}</h3>${c.featured ? '<span class="cs-f">Case im Detail: Konzept 1–3</span>' : ''}</li>`).join('')}</ul>`;
export const stimmen = () => `<div class="sm">${C.stimmen.map((s, i) => `<figure data-reveal style="--d:${i * 90}ms"><blockquote>${esc(s.q)}</blockquote><figcaption>${esc(s.w)}, ${esc(s.f)}${s.hinweis ? ` <i>(${esc(s.hinweis)})</i>` : ''}</figcaption></figure>`).join('')}</div>`;
export const kontakt = (k = 'Reden wir. Persönlich.') => `<div class="ct"><h2 data-reveal>${esc(k)}</h2><p data-reveal>${C.ansprech.name}, ${C.ansprech.rolle}, ist Ihr Ansprechpartner von der ersten Frage an.</p>
  <p class="ct-a" data-reveal><a class="btn btn-p" href="${C.termin}">Termin buchen</a><a class="btn btn-s" href="${C.telHref}">${C.tel}</a></p></div>`;
export const footer = () => `<footer class="ft"><a class="ft-logo" href="index.html" aria-label="Startseite">${logo()}</a>
  <p>${C.adresse.join(', ')} · <a href="${C.telHref}">${C.tel}</a></p>
  <p class="ft-s"><a href="#">Impressum</a> · <a href="#">Datenschutz</a> · <a href="../index.html">Konzept wechseln</a> · <a href="#top">Nach oben</a></p>
  <p class="ft-n">${C.hinweisBeispiel} Zitate sinngemäß bzw. Platzhalter. Dieses Konzept ist nur als Startseite ausgearbeitet.</p></footer>`;
export const marken = () => [...C.marken, ...C.marken].map(m => `<span>${esc(m)}</span>`).join('<i aria-hidden="true">✦</i>');
export { C, esc };
