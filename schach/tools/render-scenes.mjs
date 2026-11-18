// Rendert die Welt-Szenen (Pfad 1, Welt 1–10) aus dem Konzept als schach/art/scenes/wN.jpg (Banner für Lektionen und Welt-Karten).
import { chromium } from '/home/user/spielregal/test/node_modules/playwright/index.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 2.4 });
await page.goto(pathToFileURL(path.join(root, 'konzept.html')).href);
await page.waitForTimeout(1000);
await page.evaluate(() => document.querySelectorAll('.world.locked').forEach(w => w.classList.remove('locked')));
await page.addStyleTag({ content: '*{animation:none!important}.world .wart{height:150px!important}' });
const LIST = process.env.STRAT ? '#stratlist' : '#worldlist', OFF = process.env.STRAT ? 10 : 0;
const n = await page.locator(LIST + ' .wart').count();
for (let i = 0; i < n; i++) {
  await page.locator(LIST + ' .wart').nth(i).screenshot({ path: path.join(root, `art/scenes/w${i + OFF}.png`) });
}
await browser.close();
console.log(n + ' Szenen');
