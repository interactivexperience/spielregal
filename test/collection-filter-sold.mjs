// Verifiziert das bestehende Sammlung-Filter-Verhalten fuer bereits
// verkaufte Spiele: "Verkauft" (und "Zum Verkauf") sind standardmaessig
// ausgeblendet, muessen im Filter aktiv ausgewaehlt werden, um zu
// erscheinen -- unabhaengig von der neuen Wunschliste-Digital-Filterung,
// die dieselbe Sammlung-Filter-Logik mitbenutzt. Bisher gab es dafuer
// keinen dedizierten Test.
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

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript",
  body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));

const games = [
  { id: "g1", name: "Ark Nova", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
  { id: "g2", name: "Trubel im Turm", status: "owned", saleStatus: "sold", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-02" },
];
await page.addInitScript((g) => {
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
}, games);

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);
await page.locator('button:has-text("Sammlung")').last().click();
await page.waitForTimeout(800);

console.log("Standard (Besitz): Ark Nova sichtbar:", await page.locator('text=Ark Nova').count() > 0);
console.log("Standard (Besitz): Trubel im Turm (verkauft) NICHT sichtbar:", await page.locator('text=Trubel im Turm').count() === 0);
await page.screenshot({ path: `${SP}/collection_sold_hidden.png` });

await page.locator('button[aria-label="Filter"]').first().click();
await page.waitForTimeout(500);
await page.locator('button:has-text("Verkauft")').click();
await page.waitForTimeout(200);
await page.locator('button:has-text("Anwenden")').click();
await page.waitForTimeout(500);
console.log("Nach Auswahl 'Verkauft': Trubel im Turm jetzt sichtbar:", await page.locator('text=Trubel im Turm').count() > 0);
await page.screenshot({ path: `${SP}/collection_sold_shown.png` });

await b.close(); server.close();
