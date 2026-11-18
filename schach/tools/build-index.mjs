// Baut schach/index.html aus tools/app.src.html: bettet Engine, Schriften, Icons und Figuren ein.
// Aufruf (aus dem Repo-Root): node schach/tools/build-index.mjs         (schreibt schach/index.html)
//                              node schach/tools/build-index.mjs --check (prüft nur, ob index.html aktuell ist)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = p => readFileSync(path.join(root, p), 'utf8');

export function buildIndex() {
  const html = read('tools/app.src.html');
  const concept = read('konzept.html');

  // Engine: ESM -> klassisches Skript mit window.SchachEngine
  const engineSrc = read('engine.mjs');
  const names = [...engineSrc.matchAll(/^export (?:const|function) (\w+)/gm)].map(m => m[1]);
  const engine = 'window.SchachEngine=(function(){\n' + engineSrc.replace(/^export (const|function)/gm, '$1') +
    '\nreturn {' + names.join(',') + '};\n})();';

  // Schriften aus dem freigegebenen Konzept
  const fonts = (concept.match(/@font-face\{[^\n]*\n/g) || []).join('');
  if (!fonts) throw new Error('Keine @font-face-Blöcke im Konzept gefunden');

  // Duotone-Icons aus dem Konzept + neue für die Bedienung
  const take = ['pawn', 'rook', 'bishop', 'knight', 'queen', 'king', 'trophy', 'star', 'flag', 'users', 'close', 'check', 'lock', 'bolt'];
  let symbols = take.map(n => {
    const m = concept.match(new RegExp('<symbol id="i-' + n + '"[\\s\\S]*?</symbol>'));
    if (!m) throw new Error('Icon fehlt im Konzept: ' + n);
    return m[0];
  }).join('\n');
  symbols += `
<symbol id="i-menu" viewBox="0 0 24 24"><rect class="b" x="3" y="4" width="18" height="16" rx="4"/><path class="s" d="M7 9h10M7 12h10M7 15h10"/></symbol>
<symbol id="i-undo" viewBox="0 0 24 24"><circle class="b" cx="12.500" cy="12.500" r="8.500"/><path class="s" d="M9 8.500H5V4.500M5.300 8.500A8 8 0 1 1 5.800 15.500"/></symbol>
<symbol id="i-sound" viewBox="0 0 24 24"><path class="b" d="M3 9h4l5-4v14l-5-4H3z"/><path class="s" d="M15.500 9a4 4 0 0 1 0 6M18 6.500a8 8 0 0 1 0 11"/></symbol>
<symbol id="i-mute" viewBox="0 0 24 24"><path class="b" d="M3 9h4l5-4v14l-5-4H3z"/><path class="s" d="M15.500 9.500l5 5M20.500 9.500l-5 5"/></symbol>
<symbol id="i-chevron" viewBox="0 0 24 24"><path class="s" d="M14.500 5L8 12l6.500 7" style="stroke-width:3"/></symbol>`;

  // Figuren (Illustrationen) aus dem Konzept
  const a = concept.indexOf('var INKC=');
  const b = concept.indexOf('function hydrate(root){');
  if (a < 0 || b < 0) throw new Error('Figuren-Code im Konzept nicht gefunden');
  const chr = concept.slice(a, b);

  return html.replace('/*@FONTS@*/', () => fonts).replace('/*@SYMBOLS@*/', () => symbols)
    .replace('/*@ENGINE@*/', () => engine).replace('/*@CHR@*/', () => chr);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = buildIndex();
  const file = path.join(root, 'index.html');
  if (process.argv.includes('--check')) {
    const cur = readFileSync(file, 'utf8');
    if (cur !== out) { console.error('schach/index.html ist nicht aktuell – bitte node schach/tools/build-index.mjs ausführen.'); process.exit(1); }
    console.log('schach/index.html ist aktuell.');
  } else { writeFileSync(file, out); console.log('schach/index.html geschrieben (' + Math.round(out.length / 1024) + ' KB)'); }
}
