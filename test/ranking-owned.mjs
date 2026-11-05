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
const base = { status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-01" };
const games = [
  { ...base, id: "a", name: "Azul", rankPos: 1 }, { ...base, id: "b", name: "Brass", rankPos: 2 },
  { ...base, id: "c", name: "Catan Verkauft", saleStatus: "sold", rankPos: 3 },
  { ...base, id: "d", name: "Dixit Wunsch", status: "wishlist" },
  { ...base, id: "e", name: "Everdell Geliehen", status: "none", rankPos: 4 },
  { ...base, id: "f", name: "Fluxx ZumVerkauf", saleStatus: "forSale", rankPos: 3 },
  { ...base, id: "g", name: "Gloomhaven" }];
const plays = games.map((g) => ({ id: "p" + g.id, gameId: g.id, gameName: g.name, date: "2026-09-01", mode: "physical-owned", players: "", playerIds: [], winner: "", scores: {}, notes: "", images: [] }));
await page.addInitScript((d) => { if (localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1");
  localStorage.setItem("spielregal:games", JSON.stringify(d.games)); localStorage.setItem("spielregal:plays", JSON.stringify(d.plays)); localStorage.setItem("spielregal:theme", "dark"); }, { games, plays });
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }); await page.waitForTimeout(1800);
const stored = async () => Object.fromEntries((await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:games")))).map((g) => [g.id, g.rankPos]));
await page.waitForFunction(() => { const g = JSON.parse(localStorage.getItem("spielregal:games")).find((x) => x.id === "c"); return g && g.rankPos === undefined; }, null, { timeout: 8000 }).catch(() => {});
const st = await stored();
check("Verkauftes, Wunschlisten- und 'nur gespielt'-Spiel verlieren ihren Rang", st.c === undefined && st.e === undefined && st.d === undefined);
check("Besessene behalten ihren Rang, 'zum Verkauf' markierte verlieren ihn", st.a === 1 && st.b === 2 && st.f === undefined);
check("Dashboard: 2 von 3 eingeordnet (nur besessene, nicht zum Verkauf markierte Spiele)", (await page.locator("[data-dash-ranking]").innerText()).includes("2 von 3"));
await page.locator("[data-rank-open]").click(); await page.waitForTimeout(600);
const list = await page.locator("[data-rank-all]").innerText().catch(() => "");
check("Rangliste enthaelt nur Besessene", list.includes("Azul") && list.includes("Brass") && !/Catan|Dixit|Everdell|Fluxx/.test(list));
// Neues Spiel einordnen: nie die ausgeschlossenen Spiele im Duell
await page.locator("[data-rank-continue]").click(); await page.waitForTimeout(500);
let bad = false;
for (let i = 0; i < 6 && await page.locator("[data-ranking-duel]").count(); i++) {
  const t = await page.locator("[data-ranking-duel]").innerText(); if (/Catan|Dixit|Everdell|Fluxx/.test(t)) bad = true;
  await page.locator("[data-duel-cur]").click(); await page.waitForTimeout(450);
}
check("Im Duell tauchen keine ausgeschlossenen Spiele auf", !bad);
// Wieder verkauft -> fliegt raus
await page.evaluate(() => { const g = JSON.parse(localStorage.getItem("spielregal:games")).map((x) => (x.id === "b" ? { ...x, saleStatus: "sold" } : x)); localStorage.setItem("spielregal:games", JSON.stringify(g)); });
await page.reload({ waitUntil: "networkidle" });
await page.waitForFunction(() => { const g = JSON.parse(localStorage.getItem("spielregal:games")).find((x) => x.id === "b"); return g && g.rankPos === undefined; }, null, { timeout: 8000 }).catch(() => {});
check("Nachtraeglich verkauftes Spiel verliert den Rang", (await stored()).b === undefined);
await b.close(); server.close();
console.log(ok ? "Besitz-Test bestanden: true" : "FEHLER"); process.exit(ok ? 0 : 1);
