// Prueft: das Dashboard-Stat "Spiele im Regal" (und die davon abgeleiteten
// Werte wie Oe Komplexitaet) zaehlt bereits verkaufte Spiele nicht mehr mit.
// Verkauf loescht einen Eintrag nicht (status bleibt "owned", nur
// saleStatus wird "sold") -- das Dashboard muss das trotzdem rausrechnen.
// "Zum Verkauf markiert" (noch aktuell besessen) bleibt dagegen drin.
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

// "Spiele im Regal": 2 (Ark Nova + Sternenreich/zum Verkauf), NICHT 3.
const collectionBtnText = await page.locator('button', { hasText: "Spiele im Regal" }).innerText();
console.log("'Spiele im Regal' zeigt 2 (verkauftes Spiel raus, 'zum Verkauf' bleibt drin):", collectionBtnText.split("\n").includes("2"));

// Oe Komplexitaet nur aus den 2 nicht-verkauften Spielen: (2+4)/2 = 3.0, NICHT (2+4+5)/3 = 3.7.
const compBtnText = await page.locator('button', { hasText: "Ø Komplexität" }).innerText();
console.log("Ø Komplexität rechnet verkauftes Spiel nicht mit ein (3.0, nicht 3.7):", compBtnText.split("\n").includes("3.0"));

// Erklaertext im Info-Popup erwaehnt jetzt "verkauft".
await page.locator('button', { hasText: "Spiele im Regal" }).click();
await page.waitForTimeout(400);
console.log("Info-Popup erwaehnt bereits verkaufte Spiele als Ausschluss:", await page.locator('text=bereits verkauft').count() > 0);

await b.close(); server.close();
