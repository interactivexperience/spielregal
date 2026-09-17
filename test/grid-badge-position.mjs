// Prueft zwei Fixes aus einem Screenshot-Feedback zur dichten (4-Spalten)
// Sammlung-Ansicht:
// 1. Das Erweiterungsbadge ("+N") sass bei verliehenen Spielen mit sichtbarem
//    Abstand ueber dem "Verliehen an ..."-Banner statt direkt darueber --
//    der feste bottom-Versatz (32px) war fuer die GROSSE Banner-Variante
//    (gridCols=2, "Verliehen an {Name}") kalibriert, nicht fuer die
//    KOMPAKTE Variante der 4-Spalten-Ansicht (nur der Name, kleinere
//    Schrift/Padding, ca. 17px hoch statt ~28px).
// 2. Die Trennlinie zwischen dem letzten Grid-Spiel und "Powered by BGG"
//    ist entfernt.
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

const PIXEL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3Crect width='2' height='2' fill='%23f00'/%3E%3C/svg%3E";
const games = [
  { id: "g1", name: "Isle of Cats", status: "owned", lentTo: "Max", images: [PIXEL], categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
  { id: "g2", name: "Isle of Cats: Erweiterung", status: "owned", expansionOf: "g1", images: [PIXEL], categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-02" },
];
await page.addInitScript((g) => {
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
  localStorage.setItem("spielregal:collectionGridCols", "4");
}, games);

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);
await page.locator('button:has-text("Sammlung")').last().click();
await page.waitForTimeout(900);
await page.screenshot({ path: `${SP}/grid_badge_position.png` });

// --- 1. Erweiterungsbadge direkt ueber dem kompakten Lent-Banner ---
const card = page.locator('button', { has: page.locator('img[alt="Isle of Cats"]') }).first();
const badge = card.locator('span[title*="Erweiterung"]').first();
const banner = card.locator('span[title="Verliehen an Max"]').first();
const badgeBox = await badge.boundingBox();
const bannerBox = await banner.boundingBox();
const gap = bannerBox.y - (badgeBox.y + badgeBox.height);
console.log("Lent-Banner (kompakt) tatsaechlich unter 20px hoch:", bannerBox.height < 20);
console.log(`Abstand Badge-Unterkante -> Banner-Oberkante klein (<6px, gemessen ${gap.toFixed(1)}px):`, gap < 6);
console.log("Badge sitzt oberhalb des Banners (kein Ueberlapp):", gap >= -1);

// --- 2. Keine Trennlinie mehr vor "Powered by BGG" ---
// Direkter Elternknoten des Links (das spezifische Footer-div mit den
// pb-56/pt-6/mt-auto-Klassen), nicht irgendein umschliessendes div (z.B.
// der App-Root), das den Link auch bloss als Nachfahren "hat".
const footer = page.locator('a:has-text("Powered by BGG")').locator('xpath=../..');
const borderTopWidth = await footer.evaluate((el) => getComputedStyle(el).borderTopWidth);
console.log("Keine Trennlinie mehr ueber 'Powered by BGG' (borderTopWidth 0px):", borderTopWidth === "0px");

await b.close(); server.close();
