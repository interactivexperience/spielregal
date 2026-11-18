// Rendert die Welt-Szenen (Pfad 1, Welt 1–10) aus dem Konzept als schach/art/scenes/wN.jpg (Banner für Lektionen und Welt-Karten).
import { chromium } from '/home/user/spielregal/test/node_modules/playwright/index.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 2.4 });
await page.goto(pathToFileURL(path.join(root, 'konzept.html')).href);
await page.waitForTimeout(1000);
await page.addStyleTag({ content: '*{animation:none!important}.world .wart{height:150px!important}' });
const n = await page.locator('#worldlist .wart').count();
for (let i = 0; i < n; i++) {
  await page.locator('#worldlist .wart').nth(i).screenshot({ path: path.join(root, `art/scenes/w${i}.png`) });
}
await browser.close();
console.log(n + ' Szenen');
