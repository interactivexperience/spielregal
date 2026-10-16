// Prueft die Top-10-Sortierung im Dashboard bei Gleichstand der Bewertung:
// 1. Hoehere Bewertung steht immer vor niedrigerer (auch mit weniger Partien).
// 2. Gleiche Bewertung: mehr Partien zuerst.
// 3. Gleiche Bewertung und gleich viele Partien: zuletzt gespielt zuerst.
// 4. Immer noch gleich: Name alphabetisch (stabile Reihenfolge).
// Ausserdem: nur Spiele im Besitz ohne Verkaufsvermerk, nur bewertete.
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

const PIXEL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3Crect width='2' height='2' fill='%23f00'/%3E%3C/svg%3E";
const base = { images: [PIXEL], status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" };
// In bewusst "falscher" Reihenfolge in den Daten, damit die Eingabereihenfolge
// nicht zufaellig das richtige Ergebnis liefert.
const games = [
  { ...base, id: "z", name: "Zeta", rating: "10" },                       // 10, 1 Partie
  { ...base, id: "a", name: "Alpha", rating: "10" },                      // 10, 1 Partie, aelter als Zeta
  { ...base, id: "m", name: "Mu", rating: "10" },                         // 10, 3 Partien
  { ...base, id: "n", name: "Nu", rating: "10" },                         // 10, 1 Partie, genauso alt wie Alpha -> Name entscheidet
  { ...base, id: "k", name: "Kappa", rating: "9" },                       // 9, 5 Partien (hinter allen 10ern)
  { ...base, id: "v", name: "Verkauft", rating: "10", saleStatus: "sold" },          // raus
  { ...base, id: "f", name: "ZumVerkauf", rating: "10", saleStatus: "forSale" },     // raus
  { ...base, id: "u", name: "Unbewertet" },                                          // raus
];
const play = (id, gameId, date) => ({ id, gameId, gameName: gameId, date, mode: "physical-owned", playerIds: [], scores: {} });
const plays = [
  play("p1", "z", "2026-09-20"),
  play("p2", "a", "2026-08-01"),
  play("p3", "n", "2026-08-01"),
  play("p4", "m", "2026-01-01"), play("p5", "m", "2026-01-02"), play("p6", "m", "2026-01-03"),
  ...["2026-02-01","2026-02-02","2026-02-03","2026-02-04","2026-02-05"].map((d, i) => play("k" + i, "k", d)),
];
await page.addInitScript((data) => {
  localStorage.setItem("spielregal:games", JSON.stringify(data.games));
  localStorage.setItem("spielregal:plays", JSON.stringify(data.plays));
  localStorage.setItem("spielregal:theme", "dark");
}, { games, plays });

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);

const order = await page.evaluate(() => {
  const h = [...document.querySelectorAll("h2")].find((e) => e.textContent.trim() === "Top 10 Spiele");
  if (!h) return null;
  return [...h.parentElement.querySelectorAll("img")].map((el) => el.getAttribute("alt"));
});
console.log("Reihenfolge:", JSON.stringify(order));
console.log("Top-10-Abschnitt vorhanden:", order !== null);
// Erwartet: Mu (10, 3 Partien) > Nu (10, 1 Partie, 08-01, Name N) vs Alpha (10, 1 Partie, 08-01, Name A)
// -> Alpha vor Nu (Name) > Zeta (10, 1 Partie, aber juenger: 09-20 -> VOR Alpha/Nu!) ...
// Reihenfolge nach Regeln: Mu; dann 1-Partie-Gruppe nach "zuletzt gespielt zuerst": Zeta (09-20); dann Alpha, Nu (gleich -> Name); dann Kappa (9).
console.log("Genau die erwarteten 5 Spiele (kein Verkauft/ZumVerkauf/Unbewertet):", JSON.stringify(order) === JSON.stringify(["Mu", "Zeta", "Alpha", "Nu", "Kappa"]));
console.log("Mehr Partien schlaegt bei gleicher Bewertung (Mu vor allen anderen 10ern):", order && order[0] === "Mu");
console.log("Bei gleichen Partien: zuletzt gespielt zuerst (Zeta vor Alpha):", order && order.indexOf("Zeta") < order.indexOf("Alpha"));
console.log("Bei sonst Gleichheit: Name alphabetisch (Alpha vor Nu):", order && order.indexOf("Alpha") < order.indexOf("Nu"));
console.log("Hoehere Bewertung geht vor Partien-Anzahl (Kappa 9 mit 5 Partien hinter allen 10ern):", order && order[order.length - 1] === "Kappa");
console.log("Verkauft/Zum Verkauf/Unbewertet nicht enthalten:", order && !order.some((n) => ["Verkauft", "ZumVerkauf", "Unbewertet"].includes(n)));
await b.close(); server.close();
