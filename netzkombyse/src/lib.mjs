import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const inner = (f) => {
  let s = readFileSync(join(root, 'assets', f), 'utf8');
  const vb = s.match(/viewBox="([^"]+)"/)[1];
  s = s.replace(/<\?xml[^>]*>/, '').replace(/<!--[\s\S]*?-->/g, '').replace(/<defs>[\s\S]*?<\/defs>/g, '').replace(/<style[\s\S]*?<\/style>/g, '')
       .replace(/class="[^"]*"/g, '').replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
  return { vb, body: s.trim() };
};
const L = inner('nk_lightmode_desktop.svg'), M = inner('nk_lightmode_mobile.svg');
export const SYMBOLS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><symbol id="nk" viewBox="${L.vb}" fill="currentColor">${L.body}</symbol><symbol id="nkm" viewBox="${M.vb}" fill="currentColor">${M.body}</symbol></svg>`;
export const logo = (cls = '') => `<svg class="logo ${cls}" role="img" aria-label="NetzKombyse" viewBox="${L.vb}"><use href="#nk"/></svg>`;
export const mark = (cls = '') => `<svg class="mark ${cls}" aria-hidden="true" viewBox="${M.vb}"><use href="#nkm"/></svg>`;
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const page = ({ k, title, desc, theme = '#fff', body, cls = '' }) => `<!doctype html>
<html lang="de" class="${cls}" data-motion="on">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="${theme}">
<meta name="robots" content="noindex">
<link rel="stylesheet" href="style.css">
<script>try{if(sessionStorage.getItem('nk:pt')==='1'&&localStorage.getItem('nk:motion')!=='off'&&!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('is-entering')}catch(e){}</script>
</head>
<body data-k="${k}">
${SYMBOLS}
<a class="skip" href="#main">Zum Inhalt springen</a>
${body}
<script src="../shared/core.js" defer></script>
<script src="../shared/deck.js" defer></script>
<script src="app.js" defer></script>
</body>
</html>`;
