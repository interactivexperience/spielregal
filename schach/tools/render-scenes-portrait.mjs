// Rendert die Welt-Szenen als Hochformat-Hintergrund (schach/art/scenes/pN.jpg, 2:~4,3) für die Lektionen.
import { chromium } from '/home/user/spielregal/test/node_modules/playwright/index.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 400, height: 860 }, deviceScaleFactor: 1.6 });
await page.goto(pathToFileURL(path.join(root, 'konzept.html')).href);
await page.waitForTimeout(1000);
const svgs = await page.evaluate(() => [...document.querySelectorAll('#worldlist svg.scene')].map(s => s.outerHTML));
for (let i = 0; i < svgs.length; i++) {
  await page.setContent('<body style="margin:0;background:#ccc">' + svgs[i] + '</body>');
  await page.evaluate(() => { const s = document.querySelector('svg.scene'); s.setAttribute('viewBox', '0 -2 200 430'); s.setAttribute('width', '400'); s.setAttribute('height', '860'); s.style.cssText = 'display:block;width:400px;height:860px'; s.querySelectorAll('animate').forEach(a => a.remove()); });
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(root, `art/scenes/p${i}.png`) });
}
await browser.close();
console.log(svgs.length + ' Hochformat-Szenen');
