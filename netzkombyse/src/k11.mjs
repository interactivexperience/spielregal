// Konzept 11 · BETON – dunkler Brutalismus: rohe Struktur, sichtbare Rasterlinien, Monospace, harte Kanten, Warnband, Text-Decoder.
import { page, esc } from './lib.mjs';
import { C } from '../content.mjs';
import { header, footer, marken } from './lib2.mjs';

const pad = (n) => String(n).padStart(2, '0');
function index() {
  const t = 'Digitaler Commerce. Kein Schnickschnack.';
  const body = `<div id="top"></div>
${header([['#fakten', 'Fakten'], ['#leistung', 'Leistung'], ['#arbeit', 'Arbeit'], ['#kontakt', 'Kontakt']])}
<main id="main">
<section class="hero" aria-labelledby="h1">
  <p class="mono" data-reveal>/ NETZKOMBYSE GMBH / HAMBURG / ${C.adresse[0].toUpperCase()}</p>
  <h1 id="h1" aria-label="${esc(t)}"><span class="gl" data-t="${esc(t)}" aria-hidden="true">${esc(t)}</span></h1>
  <p class="lead" data-reveal>Wir bauen Shops, Schnittstellen und Marketing für Mittelständler. Direkt. Ohne Vertriebsfilter. Ohne Schnörkel.</p>
  <p class="cta" data-reveal><a class="btn btn-a" href="#kontakt">&gt; Termin anfragen</a><a class="btn" href="#arbeit">&gt; Projekte öffnen</a></p>
</section>
<p class="tape" aria-hidden="true"><span class="tape-t">${Array(24).fill('NETZKOMBYSE ▪ DIGITALER COMMERCE ▪ HAMBURG ▪').join(' ')}</span></p>

<section class="sec" id="fakten"><div class="wr"><h2 data-scr>[01] Fakten</h2>
  <dl class="spec" data-reveal>
    <div><dt>Standort</dt><dd>${C.adresse.join(', ')}</dd></div><div><dt>Team</dt><dd>${C.zahlen.team} Menschen</dd></div>
    <div><dt>Erfahrung</dt><dd>${C.jahre}+ Jahre</dd></div><div><dt>Marken</dt><dd>${C.zahlen.marken} in ${C.zahlen.branchen} Branchen</dd></div>
    <div><dt>Ansprechpartner</dt><dd>${C.ansprech.name}, ${C.ansprech.rolle}</dd></div><div><dt>Status</dt><dd class="ok">Erreichbar</dd></div>
  </dl>
  <ul class="grid3">${C.lagen.map((l, i) => `<li data-reveal style="--d:${i * 70}ms"><span class="mono">LAGE_${pad(i + 1)}</span><h3>${esc(l.t)}</h3><p>${esc(l.d)}</p></li>`).join('')}</ul></div></section>

<section class="sec" id="leistung"><div class="wr"><h2 data-scr>[02] Leistung</h2>
  <ol class="tbl">${C.disziplinen.map((d, i) => `<li data-reveal><a href="#kontakt"><span class="mono">${pad(i + 1)}</span><b>${esc(d.t)}</b><span>${esc(d.d)}</span><i aria-hidden="true">→</i></a></li>`).join('')}</ol>
  <ul class="grid4">${C.saeulen.map(s => `<li data-reveal><b>${esc(s.t)}</b><span>${esc(s.d)}</span></li>`).join('')}</ul></div></section>

<section class="sec" id="arbeit"><div class="wr"><h2 data-scr>[03] Arbeit</h2>
  <p class="mono dim" data-reveal>$ ls -la ./projekte</p>
  <ul class="ls">${C.cases.map((c, i) => `<li data-reveal><span class="perm" aria-hidden="true">drwxr-xr-x</span><b>${esc(c.t)}</b><span>${esc(c.typ)}</span><span>${esc(c.branche)}</span></li>`).join('')}</ul>
  <p class="band" aria-label="Kunden"><span class="band-t">${marken()}</span></p>
  <div class="sm">${C.stimmen.map(s => `<figure data-reveal><blockquote>${esc(s.q)}</blockquote><figcaption>— ${esc(s.w)}, ${esc(s.f)}${s.hinweis ? ` (${esc(s.hinweis)})` : ''}</figcaption></figure>`).join('')}</div></div></section>

<section class="sec sec-a" id="kontakt"><div class="wr"><h2 data-scr>[04] Kontakt</h2>
  <p class="prompt" data-reveal>&gt; reden_wir<span class="blink" aria-hidden="true">_</span></p>
  <p class="lead" data-reveal>${C.ansprech.name}, ${C.ansprech.rolle}. Ihr Ansprechpartner von der ersten Frage an.</p>
  <p class="cta" data-reveal><a class="btn btn-k" href="${C.termin}">&gt; Termin buchen</a><a class="btn btn-o" href="${C.telHref}">${C.tel}</a></p></div></section>
</main>${footer()}`;
  return page({ k: 'k11', title: 'NetzKombyse · Konzept 11 Beton', desc: 'Konzept 11: Beton – dunkler Brutalismus.', theme: '#0B0B0B', body });
}
export const pages = () => ({ 'index.html': index() });
