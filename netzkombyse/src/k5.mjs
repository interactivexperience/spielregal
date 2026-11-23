// Konzept 5 · LEUCHTFEUER – Nordsee bei Nacht: Ein Lichtkegel folgt dem Zeiger und deckt auf, was im Dunkeln liegt.
import { page } from './lib.mjs';
import { header, lagen, saeulen, disz, cases, stimmen, kontakt, footer, marken, C } from './lib2.mjs';
import { turm } from './art.mjs';

const H = 'Wir halten Ihr Licht an.';
function index() {
  const body = `<div id="top"></div>${header([['#nebel', 'Ausgangslage'], ['#feuer', 'Feuer'], ['#hafen', 'Hafen'], ['#kontakt', 'Kontakt']])}
<main id="main">
<section class="hero" aria-labelledby="h1">
  <div class="beam" aria-hidden="true"><i></i></div>
  <div class="tower" aria-hidden="true">${turm('tw')}</div>
  <p class="kk" data-reveal>Digitaler Commerce · Hamburg · rund um die Uhr erreichbar</p>
  <h1 id="h1" class="spot" aria-label="${H}"><span class="dim" aria-hidden="true">${H}</span><span class="lit" aria-hidden="true" data-lit>${H}</span></h1>
  <p class="lead" data-reveal>Auch bei dichtem Nebel im Tagesgeschäft: Systeme, die zuverlässig leuchten, und Menschen, die erreichbar bleiben. Fahren Sie mit dem Zeiger über die Zeile.</p>
  <p class="cta" data-reveal><a class="btn btn-p" href="#kontakt">Kurs besprechen</a><a class="btn btn-s" href="#nebel">Ins Dunkle schauen</a></p>
</section>

<section class="sec" id="nebel"><div class="wr"><p class="kk" data-reveal>Nebel · Ausgangslage</p><h2 data-reveal>Wo es gerade dunkel ist.</h2>
  <p class="sub" data-reveal>Wir begleiten Unternehmen, die E-Commerce als zentralen Teil ihrer Entwicklung sehen – nicht als Nebenschauplatz.</p>${lagen()}</div></section>

<section class="sec sec-l" id="feuer"><div class="wr"><p class="kk" data-reveal>Feuer · Leistungen</p><h2 data-reveal>Drei Disziplinen, ein Ziel: digitaler Vertrieb, der sich rechnet.</h2>${disz()}${saeulen()}</div></section>

<section class="sec" id="hafen"><div class="wr"><p class="kk" data-reveal>Hafen · Referenzen</p><h2 data-reveal>Hier sind wir eingelaufen.</h2>
  <p class="sub" data-reveal>${C.zahlen.marken} Marken, ${C.zahlen.branchen} Branchen, ${C.jahre}+ Jahre.</p>${cases()}
  <p class="band" aria-label="Kunden"><span class="band-t">${marken()}</span></p>${stimmen()}</div></section>

<section class="sec sec-l" id="kontakt"><div class="wr">${kontakt('Machen wir Licht.')}</div></section>
</main>${footer()}`;
  return page({ k: 'k5', title: 'NetzKombyse · Konzept 5 Leuchtfeuer', desc: 'Konzept 5: Leuchtfeuer – Nordsee bei Nacht, Lichtkegel folgt dem Zeiger.', theme: '#0A1A2E', body });
}
export const pages = () => ({ 'index.html': index() });
