// Prueft zwei Dashboard-Neuerungen:
// 1. Neue Sektion "Verliehene Spiele": Spiele mit gesetztem lentTo erscheinen
//    in einer eigenen horizontalen Kachelreihe (Handshake-Icon, Bildunterschrift
//    "an {Name}"), Spiele ohne lentTo erscheinen dort NICHT.
// 2. "Dein Spieljahr"-Sektion ist jetzt visuell als Karte gestaltet: getoentes
//    Kartenelement mit Cover des meistgespielten Spiels und grosser Partien-Zahl,
//    zusaetzlich zum bisherigen KI-Fliesstext.
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
  { id: "g1", name: "Ark Nova", status: "owned", lentTo: "Max", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
  { id: "g2", name: "Trubel im Turm", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-02" },
];
const plays = [
  { id: "p1", gameId: "g1", date: "2026-03-01" },
  { id: "p2", gameId: "g1", date: "2026-03-05" },
  { id: "p3", gameId: "g2", date: "2026-03-10" },
];
const yearlyInsight = { text: "Ein starkes Jahr mit viel Ark Nova auf dem Tisch.", year: 2026, generatedAt: Date.now(), fingerprint: "x" };
// addInitScript nimmt nur EIN Zusatzargument entgegen -- mehrere separate
// Argumente wuerden bis auf das erste stillschweigend verworfen, was
// localStorage.setItem(..., JSON.stringify(undefined)) und damit den
// String "undefined" statt echter Daten erzeugen wuerde. Deshalb hier
// gebuendelt als ein Objekt.
await page.addInitScript((data) => {
  localStorage.setItem("spielregal:games", JSON.stringify(data.games));
  localStorage.setItem("spielregal:plays", JSON.stringify(data.plays));
  localStorage.setItem("spielregal:theme", "dark");
  localStorage.setItem("spielregal:yearlyInsight", JSON.stringify(data.yearlyInsight));
}, { games, plays, yearlyInsight });

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${SP}/dashboard_lent_yearly.png`, fullPage: true });

// --- Verliehene Spiele ---
console.log("Sektion 'Verliehene Spiele' vorhanden:", await page.locator('text=Verliehene Spiele').count() > 0);
console.log("Ark Nova (verliehen) mit Bildunterschrift 'an Max' sichtbar:", await page.locator('text=an Max').count() > 0);
const lentSection = page.locator('div', { has: page.locator('h2', { hasText: "Verliehene Spiele" }) }).first();
console.log("Trubel im Turm (nicht verliehen) NICHT in der Lent-Sektion:", (await lentSection.innerText()).includes("Trubel im Turm") === false);

// --- Dein Spieljahr, visuell ---
console.log("Sektion 'Dein Spieljahr' vorhanden:", await page.locator('text=Dein Spieljahr 2026').count() > 0);
const yearCard = page.locator('div.border-t.border-line', { hasText: "Dein Spieljahr 2026" }).first();
console.log("Karten-Container mit accent-Tönung vorhanden:", await yearCard.locator('div.rounded-2xl.border-accent\\/25').count() > 0);
console.log("Partien-Anzahl 3 in der Karte sichtbar:", (await yearCard.innerText()).includes("3"));
console.log("'Partien in 2026' Label sichtbar:", (await yearCard.innerText()).includes("Partien in 2026"));
console.log("KI-Fliesstext weiterhin sichtbar:", (await yearCard.innerText()).includes("starkes Jahr"));
// Meistgespielt (Ark Nova, 2x) hat ein Cover-Bild-Element in der Karte:
console.log("Cover-Button fuer meistgespieltes Spiel vorhanden:", await yearCard.locator("button").count() > 0);

await b.close(); server.close();
