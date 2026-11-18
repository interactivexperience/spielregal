// Rendert die Weltkarte des Konzepts (ohne Ortsmarker, Alice und Easter Eggs) als schach/art/map.jpg (900x2250).
// Die Marker legt die App als Knöpfe darüber. Aufruf: node schach/tools/render-map.mjs
import { chromium } from '/home/user/spielregal/test/node_modules/playwright/index.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 1.5 });
await page.goto(pathToFileURL(path.join(root, 'konzept.html')).href);
await page.waitForTimeout(900);
await page.addStyleTag({ content: '#scroller{overflow:visible!important}.phone.big{height:auto!important;width:400px!important}.scroller svg.wm{width:600px!important;height:1500px!important}' });
await page.click('.stage[data-st="3"]');
await page.waitForTimeout(2500);
await page.evaluate(() => {
  const s = document.getElementById('worldsvg');
  s.pauseAnimations && s.pauseAnimations();
  s.querySelectorAll('.egg').forEach(e => e.remove());
  const kids = [...s.children], i = kids.findIndex(k => k.getAttribute && k.getAttribute('fill') === 'url(#vig)');
  kids.slice(i + 1).forEach(k => k.remove());                 // Marker, Namensschilder, Alice
  s.querySelectorAll('animateMotion').forEach(a => { const g = a.parentNode; if (g.closest('.life') === null) g.remove(); });
  window.__mapSvg = s.outerHTML;
});
const html = await page.evaluate(() => window.__mapSvg);
await page.setViewportSize({ width: 600, height: 1500 });
await page.setContent('<body style="margin:0">' + html + '</body>');
await page.evaluate(() => { const s = document.getElementById('worldsvg'); s.setAttribute('width', '600'); s.setAttribute('height', '1500'); s.style.cssText = 'display:block;width:600px;height:1500px'; s.pauseAnimations && s.pauseAnimations(); });
await page.waitForTimeout(600);
await page.locator('#worldsvg').screenshot({ path: path.join(root, 'art/map.png') });
await browser.close();
console.log('map.png geschrieben');
