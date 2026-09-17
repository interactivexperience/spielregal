// Prueft: das Dashboard-Stat "Spiele im Regal" (und die davon abgeleiteten
// Werte wie Oe Komplexitaet) zaehlt weder bereits verkaufte NOCH zum Verkauf
// markierte Spiele mit -- Verkauf(sprozess) loescht einen Eintrag nicht
// (status bleibt "owned", nur saleStatus wird gesetzt), aber die
// Sammlung-Standardansicht blendet BEIDE Verkaufsstatus aus (erst per
// aktivem Filter sichtbar), und das Dashboard muss exakt dieselbe Menge
// zaehlen wie die Sammlung ohne aktive Filter, sonst weichen die Zahlen
// zwischen Dashboard und Sammlung voneinander ab.
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
  { id: "g1", name: "Ark Nova", status: "owned", complexity: "2", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
  { id: "g2", name: "Trubel im Turm", status: "owned", saleStatus: "sold", complexity: "5", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-02" },
  { id: "g3", name: "Sternenreich", status: "owned", saleStatus: "forSale", complexity: "4", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-03" },
];
await page.addInitScript((g) => {
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
}, games);

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${SP}/dashboard_sold_exclude.png` });

// "Spiele im Regal": nur 1 (Ark Nova) -- verkauft UND zum Verkauf beide raus.
const collectionBtnText = await page.locator('button', { hasText: "Spiele im Regal" }).innerText();
console.log("'Spiele im Regal' zeigt 1 (verkauft UND 'zum Verkauf' beide raus):", collectionBtnText.split("\n").includes("1"));

// Oe Komplexitaet nur aus dem einen verbleibenden Spiel: 2.0, NICHT (2+4+5)/3 = 3.7 und NICHT (2+4)/2 = 3.0.
const compBtnText = await page.locator('button', { hasText: "Ø Komplexität" }).innerText();
console.log("Ø Komplexität rechnet weder verkauftes noch zum-Verkauf-Spiel mit ein (2.0):", compBtnText.split("\n").includes("2.0"));

// Erklaertext im Info-Popup erwaehnt jetzt beide Ausschlussgruende.
await page.locator('button', { hasText: "Spiele im Regal" }).click();
await page.waitForTimeout(400);
console.log("Info-Popup erwaehnt bereits verkaufte Spiele als Ausschluss:", await page.locator('text=bereits verkaufte').count() > 0);
console.log("Info-Popup erwaehnt zum Verkauf markierte Spiele als Ausschluss:", await page.locator('text=zum Verkauf markierte').count() > 0);

await b.close();

// Zweiter Lauf: dieselbe Menge muss auch in der Sammlung-Standardansicht
// (ohne aktive Filter) zu sehen sein -- das ist der eigentliche Abgleich,
// um den es hier geht (Dashboard-Zahl == Sammlung-Zahl).
const b2 = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page2 = await b2.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
page2.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page2.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page2.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
await page2.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page2.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript",
  body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page2.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
await page2.addInitScript((g) => {
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
}, games);
await page2.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page2.waitForTimeout(2500);
await page2.locator('button:has-text("Sammlung")').last().click();
await page2.waitForTimeout(800);
console.log("Sammlung (Standardansicht): Ark Nova sichtbar:", await page2.locator('text=Ark Nova').count() > 0);
console.log("Sammlung (Standardansicht): Trubel im Turm (verkauft) NICHT sichtbar:", await page2.locator('text=Trubel im Turm').count() === 0);
console.log("Sammlung (Standardansicht): Sternenreich (zum Verkauf) NICHT sichtbar:", await page2.locator('text=Sternenreich').count() === 0);
await b2.close(); server.close();
