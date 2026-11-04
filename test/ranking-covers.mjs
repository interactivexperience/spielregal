// Prueft das Ranking per Wischen: Dashboard-Karte, Binaersuche-Duelle (rechts = lieber,
// links = weniger, 'Gleich gut' = gleicher Platz), Rueckgaengig, Wischen per Zeiger, Fortsetzen nach
// Neuladen, Enthuellung + Top-10-Karte, komplette Rangliste und Nachruecken neuer Spiele.
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
const SP = "/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad";

const wide = "data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='300' height='120'><rect width='300' height='120' fill='#3a7'/><circle cx='60' cy='60' r='40' fill='#fc4'/></svg>");
const nm = ["The Castles of Burgundy: Special Edition mit allen Erweiterungen", "Ark Nova", "Brass: Lancashire", "Townsfolk Tussle", "Moonrakers: Titan Edition", "Take Time", "Harrow County: The Game of Gothic Fear", "Spirit Island"];
const pos = [1, 2, 2, 2, 5, 5, 7, 8];
const base = { status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [wide], addedDate: "2026-01-01" };
const games = nm.map((n, i) => ({ ...base, id: "g" + i, name: n, rankPos: pos[i] }));
const plays = games.map((g, i) => ({ id: "p" + i, gameId: g.id, gameName: g.name, date: "2026-09-01", mode: "physical-owned", players: "", playerIds: [], winner: "", scores: {}, notes: "", images: [] }));
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript", body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
await page.addInitScript((d) => { localStorage.setItem("spielregal:games", JSON.stringify(d.games)); localStorage.setItem("spielregal:plays", JSON.stringify(d.plays)); localStorage.setItem("spielregal:theme", "dark"); }, { games, plays });
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }); await page.waitForTimeout(1500);
await page.locator("[data-rank-open]").click(); await page.waitForTimeout(800);
const boxes = await page.locator("[data-top10-card] li img").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
console.log("Alle Cover quadratisch 48x48:", boxes.length === 8 && boxes.every(([w, h]) => w === 48 && h === 48), JSON.stringify(boxes));
const xs = await page.locator("[data-top10-card] li img").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().left)));
console.log("Alle Cover stehen in einer Spalte (gleicher linker Rand):", new Set(xs).size === 1, JSON.stringify(xs));
await page.screenshot({ path: "/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad/ranking_covers.png" });
await b.close(); server.close();
