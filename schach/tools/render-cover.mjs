// Erzeugt schach/cover.jpg (3:4, 960x1280): bewusst ruhig, nur Titel, drei Figuren auf der Brettwiese.
// Wichtiges steht in der Mittelzone, weil das Dashboard die Karte quadratisch zuschneidet.
// Aufruf (aus dem Repo-Root, test/node_modules muss installiert sein): node schach/tools/render-cover.mjs
import { chromium } from '/home/user/spielregal/test/node_modules/playwright/index.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 480, height: 640 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(path.join(root, 'konzept.html')).href);   // Schriften und Figuren-Code kommen aus dem Konzept
await page.waitForTimeout(800);
await page.evaluate(() => {
  const INK = '#2B2535';
  // Schiefes Schachbrett (wie die Brettwiese): 8x8, hell/dunkel, dunkle Kante
  let cells = '';
  for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++)
    cells += `<rect x="${-120 + a * 30}" y="${-120 + b * 30}" width="30" height="30" fill="${(a + b) % 2 ? '#5FA55A' : '#E3F0A8'}"/>`;
  const board = `<svg width="480" height="230" viewBox="-240 -115 480 230" style="position:absolute;left:0;top:360px">
    <g transform="translate(0 6) skewX(-14) scale(1 .5)"><rect x="-128" y="-122" width="256" height="256" rx="8" fill="${INK}" opacity=".25"/></g>
    <g transform="skewX(-14) scale(1 .5)">${cells}<rect x="-120" y="-120" width="240" height="240" fill="none" stroke="${INK}" stroke-width="7"/></g></svg>`;
  const fig = (k, size, left, top) => `<div style="position:absolute;left:${left}px;top:${top}px;font-size:${size}px;filter:drop-shadow(4px 6px 0 rgba(43,37,53,.28))">${chr(k)}</div>`;
  document.body.innerHTML = '';
  document.body.style.cssText = 'margin:0;overflow:hidden;background:#9ED06C';
  const box = document.createElement('div');
  box.style.cssText = 'position:relative;width:480px;height:640px;overflow:hidden;background:linear-gradient(180deg,#F3EBC8 0,#F3EBC8 34%,#A9D676 34%,#8DC35E 100%)';
  box.innerHTML = board +
    fig('pawn', 118, 70, 326) + fig('king', 128, 290, 318) + fig('knight', 178, 158, 262) +
    `<div style="position:absolute;left:0;right:0;top:128px;text-align:center;font:900 100px/1 'Londrina Solid',cursive;color:${INK};transform:rotate(-2deg);text-shadow:4px 6px 0 rgba(43,37,53,.22)">Schach<span style="color:#E2566B">dorf</span></div>`;
  document.body.appendChild(box);
});
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(root, 'cover.jpg'), type: 'jpeg', quality: 90, clip: { x: 0, y: 0, width: 480, height: 640 } });
await browser.close();
console.log('schach/cover.jpg geschrieben');
