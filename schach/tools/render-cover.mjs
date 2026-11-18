// Erzeugt schach/cover.jpg (3:4, 960x1280) aus dem Konzept: Ausschnitt der Weltkarte, Titel und Figuren.
// Wichtiges steht in der Mittelzone, weil das Dashboard die Karte quadratisch zuschneidet.
// Aufruf (aus dem Repo-Root, test/node_modules muss installiert sein): node schach/tools/render-cover.mjs
import { chromium } from '/home/user/spielregal/test/node_modules/playwright/index.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 480, height: 640 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(path.join(root, 'konzept.html')).href);
await page.waitForTimeout(800);
await page.click('.stage[data-st="3"]');           // Tal mit Bäumen, Tieren und Vögeln
await page.waitForTimeout(2200);
await page.evaluate(() => {
  const svg = document.getElementById('worldsvg').cloneNode(true);
  svg.removeAttribute('class');
  svg.setAttribute('viewBox', '0 640 600 800');       // 3:4-Ausschnitt: Läuferwald bis Brettwiese
  svg.setAttribute('width', '480'); svg.setAttribute('height', '640');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.querySelectorAll('.life').forEach(g => g.classList.add('on'));
  const sprite = document.querySelector('body > svg[width="0"]').cloneNode(true);
  const cast = ['pawn', 'rook', 'bishop', 'knight', 'queen', 'king'].map(k => chr(k)).join('');
  document.body.innerHTML = '';
  document.body.style.cssText = 'margin:0;background:#9DCB6F;overflow:hidden';
  const box = document.createElement('div');
  box.style.cssText = 'position:relative;width:480px;height:640px;overflow:hidden';
  box.appendChild(svg);
  const shade = document.createElement('div');
  shade.style.cssText = 'position:absolute;inset:0;background:linear-gradient(180deg,rgba(251,243,228,0) 0,rgba(251,243,228,0) 14%,rgba(251,243,228,.55) 32%,rgba(251,243,228,.5) 60%,rgba(251,243,228,0) 82%)';
  box.appendChild(shade);
  const title = document.createElement('div');
  title.innerHTML = 'Schach<span style="color:#E2566B">dorf</span>';
  title.style.cssText = "position:absolute;left:0;right:0;top:196px;text-align:center;font:900 96px/1 'Londrina Solid',cursive;color:#2B2535;transform:rotate(-2deg);-webkit-text-stroke:7px #FBF3E4;paint-order:stroke fill;text-shadow:3px 5px 0 rgba(43,37,53,.28)";
  box.appendChild(title);
  const sub = document.createElement('div');
  sub.textContent = 'Schach spielen, Figur für Figur.';
  sub.style.cssText = "position:absolute;left:0;right:0;top:296px;text-align:center;font:400 21px Delius,sans-serif;color:#2B2535;-webkit-text-stroke:5px #FBF3E4;paint-order:stroke fill";
  box.appendChild(sub);
  const row = document.createElement('div');
  row.innerHTML = cast;
  row.style.cssText = 'position:absolute;left:0;right:0;top:352px;display:flex;justify-content:center;align-items:flex-end;gap:2px;font-size:74px';
  row.querySelectorAll('svg').forEach(s => { s.style.filter = 'drop-shadow(3px 4px 0 rgba(43,37,53,.28))'; });
  box.appendChild(row);
  document.body.appendChild(sprite);
  document.body.appendChild(box);
});
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(root, 'cover.jpg'), type: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: 480, height: 640 } });
await browser.close();
console.log('schach/cover.jpg geschrieben');
