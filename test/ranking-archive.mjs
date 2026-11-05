// Beim Neustart des Rankings kann der alte Stand gespeichert werden; gespeicherte Staende sind einsehbar und loeschbar.
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
const page = await b.newPage({ viewport: { width: 390, height: 844 } });
let ok = true; const check = (l, c) => { console.log(l + ":", !!c); if (!c) ok = false; };
page.on("pageerror", (e) => { console.log("PAGEERROR", e.message); ok = false; });
page.on("dialog", (d) => d.accept());
await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript", body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
const names = ["Azul", "Brass", "Catan", "Dixit"];
const base = { status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-01" };
const games = names.map((n, i) => ({ ...base, id: "g" + i, name: n, rankPos: i + 1 }));
const plays = names.map((n, i) => ({ id: "p" + i, gameId: "g" + i, gameName: n, date: "2026-09-01", mode: "physical-owned", players: "", playerIds: [], winner: "", scores: {}, notes: "", images: [] }));
await page.addInitScript((d) => {
  if (localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1");
  localStorage.setItem("spielregal:games", JSON.stringify(d.games)); localStorage.setItem("spielregal:plays", JSON.stringify(d.plays)); localStorage.setItem("spielregal:theme", "dark");
}, { games, plays });
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }); await page.waitForTimeout(1500);
const archive = () => page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:rankingArchive") || "[]"));
const ranked = async () => (await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:games")))).filter((g) => Number.isInteger(g.rankPos)).length;
check("Dashboard ohne Archiv: kein Knopf 'Gespeicherte Staende'", await page.locator("[data-rank-archive-open]").count() === 0);
await page.locator("[data-rank-open]").click(); await page.waitForTimeout(400);
await page.locator('button:has-text("Ranking neu starten")').click(); await page.waitForTimeout(300);
check("Dialog fragt nach dem Speichern", await page.locator("[data-rank-restart-dialog]").count() === 1 && (await page.locator("[data-rank-restart-dialog]").innerText()).includes("aufbewahren"));
await page.locator("[data-rank-restart-cancel]").click(); await page.waitForTimeout(200);
check("Abbrechen: nichts geaendert", await page.locator("[data-rank-restart-dialog]").count() === 0 && await ranked() === 4 && (await archive()).length === 0);
await page.locator('button:has-text("Ranking neu starten")').click(); await page.waitForTimeout(200);
await page.locator("[data-rank-restart-save]").click(); await page.waitForTimeout(500);
const a = await archive();
check("Speichern: Stand liegt im Archiv (4 Spiele, Plaetze 1-4)", a.length === 1 && a[0].entries.length === 4 && a[0].entries[0].name === "Azul" && a[0].entries[3].place === 4);
check("Ranking ist danach zurueckgesetzt (hoechstens das automatisch gesetzte erste Spiel)", await ranked() <= 1);
await page.locator("[data-ranking-duel] button:has-text('Schließen'), [aria-label='Schließen']").first().click(); await page.waitForTimeout(400);
check("Dashboard zeigt jetzt 'Gespeicherte Staende'", await page.locator("[data-rank-archive-open]").count() === 1);
await page.locator("[data-rank-archive-open]").click(); await page.waitForTimeout(400);
check("Archivansicht listet den Stand", await page.locator("[data-rank-archive-item]").count() === 1);
await page.locator("[data-rank-archive-item] > button").click(); await page.waitForTimeout(200);
check("Aufgeklappt: komplette Liste mit Namen", (await page.locator("[data-rank-archive-item]").innerText()).includes("Dixit"));
await page.screenshot({ path: "/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad/ranking_archive.png" });
await page.locator("[data-rank-archive-del]").click(); await page.waitForTimeout(300);
check("Loeschen entfernt den Stand", (await archive()).length === 0 && await page.locator("[data-rank-archive-item]").count() === 0);
// Ohne Speichern
await page.evaluate(() => { const g = JSON.parse(localStorage.getItem("spielregal:games")).map((x, i) => ({ ...x, rankPos: i + 1 })); localStorage.setItem("spielregal:games", JSON.stringify(g)); });
await page.reload({ waitUntil: "networkidle" }); await page.waitForTimeout(1200);
await page.locator("[data-rank-open]").click(); await page.waitForTimeout(400);
await page.locator('button:has-text("Ranking neu starten")').click(); await page.waitForTimeout(200);
await page.locator("[data-rank-restart-nosave]").click(); await page.waitForTimeout(400);
check("Ohne Speichern: Archiv bleibt leer, Ranking zurueckgesetzt", (await archive()).length === 0 && await ranked() <= 1);
await b.close(); server.close();
console.log(ok ? "Archiv-Test bestanden: true" : "FEHLER"); process.exit(ok ? 0 : 1);
