// Prueft: im Partie-Formular setzt sich die Krone (Gewinner) automatisch auf
// den/die Mitspieler mit der hoechsten Punktzahl -- bei Gleichstand auf ALLE
// Punktgleichen. Vorher musste man jede Krone von Hand setzen.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const vendor = (...p) => path.join(__dirname, "node_modules", ...p);
const server = http.createServer((req, res) => {
  try { res.writeHead(200); res.end(readFileSync(path.join(repoRoot, decodeURIComponent(req.url.split("?")[0])))); }
  catch { res.writeHead(404); res.end("nf"); }
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;
const twCss = readFileSync(path.join(__dirname, "tw-built.css"), "utf8");
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript",
  body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
const players = [{ id: "p1", name: "Anna" }, { id: "p2", name: "Ben" }, { id: "p3", name: "Clara" }];
const games = [{ id: "g1", name: "Ark Nova", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" }];
await page.addInitScript((d) => {
  localStorage.setItem("spielregal:games", JSON.stringify(d.games));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:players", JSON.stringify(d.players));
  localStorage.setItem("spielregal:theme", "dark");
}, { games, players });
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2000);
await page.locator('button:has-text("Partien")').last().click();
await page.waitForTimeout(800);
await page.locator('button[aria-label="Partie eintragen"]').click();
await page.waitForTimeout(600);
await page.locator('input[placeholder*="Spiel"], input[placeholder*="suchen"]').first().fill("Ark Nova");
await page.waitForTimeout(500);
await page.locator('text=Ark Nova').first().click();
await page.waitForTimeout(600);
for (const p of players) {
  await page.locator(`p:has-text("${p.name}")`).first().locator('xpath=preceding-sibling::button[1]').click();
  await page.waitForTimeout(150);
}
await page.waitForTimeout(300);
const list = page.locator('label:has-text("Ergebnis")').locator('xpath=following-sibling::div[1]');
const row = (n) => list.locator('xpath=./div[.//span[contains(@class,"text-ink") and text()="' + n + '"]]');
const score = (n, v) => row(n).locator('input[placeholder="Punkte"]').fill(v);
const crowned = async () => {
  const out = [];
  for (const n of ["Anna", "Ben", "Clara"]) {
    if (await row(n).locator('button[aria-label="Gewinner entfernen"]').count() > 0) out.push(n);
  }
  return out.sort();
};
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

console.log("Ohne Punkte: niemand gekroent:", eq(await crowned(), []));
await score("Ben", "50"); await page.waitForTimeout(200);
console.log("Eine Punktzahl: Ben gekroent:", eq(await crowned(), ["Ben"]));
await score("Clara", "90"); await page.waitForTimeout(200);
console.log("Clara hoeher: nur Clara gekroent (Ben verliert Krone):", eq(await crowned(), ["Clara"]));
await score("Anna", "90"); await page.waitForTimeout(200);
console.log("Gleichstand 90/90: Anna UND Clara gekroent, Ben nicht:", eq(await crowned(), ["Anna", "Clara"]));
await score("Anna", "100"); await page.waitForTimeout(200);
console.log("Anna 100: nur Anna gekroent:", eq(await crowned(), ["Anna"]));
// Manuell zusaetzlich Ben kroenen -> bleibt bis zur naechsten Punkteaenderung.
await row("Ben").locator('button[aria-label="Als Gewinner markieren"]').click(); await page.waitForTimeout(200);
console.log("Manuell zusaetzlich gekroent: Anna + Ben:", eq(await crowned(), ["Anna", "Ben"]));
await score("Clara", "20"); await page.waitForTimeout(200);
console.log("Naechste Punkteaenderung gleicht wieder an (nur Anna):", eq(await crowned(), ["Anna"]));
await page.screenshot({ path: "/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad/winner_auto.png" });
await b.close(); server.close();
