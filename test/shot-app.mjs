// Rendert die echte App offline und schiesst Screenshots je Tab und Theme.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const vendor = (...p) => path.join(__dirname, "node_modules", ...p);
const SP = "/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad";

const server = http.createServer((req, res) => {
  try { res.writeHead(200); res.end(readFileSync(path.join(repoRoot, decodeURIComponent(req.url.split("?")[0])))); }
  catch { res.writeHead(404); res.end("nf"); }
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;
const twCss = readFileSync(path.join(__dirname, "tw-built.css"), "utf8");
const fontCss = readFileSync(path.join(SP, "fonts", "embed.css"), "utf8");

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript",
  body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: fontCss, contentType: "text/css" }));

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);

// Vorschau-Modus einschalten (Demodaten), damit die Screens Inhalt haben.
// Laeuft ueber die UI, weil demoMode reiner React-State ohne Persistenz ist.
await page.locator('button:has-text("Mehr")').last().click();
await page.waitForTimeout(700);
await page.locator('button:has-text("Vorschau-Modus")').first().click();
await page.waitForTimeout(600);
await page.locator('button:has-text("Demo-Vorschau anzeigen")').first().click();
await page.waitForTimeout(1200);

const tabs = ["Übersicht", "Sammlung", "Partien", "Ideen", "Mehr"];
for (const theme of ["dark", "light"]) {
  await page.evaluate((t) => window.__setTheme(t), theme);
  await page.waitForTimeout(400);
  for (const t of tabs) {
    const btn = page.locator(`button:has-text("${t}")`).last();
    if (await btn.count()) { await btn.click({ timeout: 3000 }).catch(()=>{}); await page.waitForTimeout(900); }
    await page.screenshot({ path: `${SP}/app_${theme}_${t.replace(/[^\wÜ]/g,"")}.png` });
  }
  // Sammlung in der 4-Spalten-Ansicht
  await page.locator('button:has-text("Sammlung")').last().click();
  await page.waitForTimeout(700);
  const four = page.locator('button[aria-label="4 Spalten"]').first();
  if (await four.count()) {
    await four.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SP}/app_${theme}_Grid4.png` });
    await page.locator('button[aria-label="2 Spalten"]').first().click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(400);
  }

  // Einstellungen -> Synchronisation: eigene Unterseite, kein Sheet mehr
  await page.locator('button:has-text("Mehr")').last().click();
  await page.waitForTimeout(700);
  const syncRow = page.locator('button:has-text("Synchronisation")').first();
  if (await syncRow.count()) {
    await syncRow.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${SP}/app_${theme}_Sync.png` });
    await page.locator('button[aria-label="Zurück"], button[aria-label="Abbrechen"]').first()
      .click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(500);
  }

  // Spiel-Detail: erstes Cover in der Sammlung antippen
  await page.locator('button:has-text("Sammlung")').last().click();
  await page.waitForTimeout(800);
  const card = page.locator('button:has(img[alt])').nth(3);
  if (await card.count()) {
    await card.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${SP}/app_${theme}_Detail.png` });
    await page.keyboard.press("Escape").catch(() => {});
    await page.locator('button[aria-label="Zurück"]').first().click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(600);
  }
}
await b.close(); server.close(); console.log("ok");
