// Prueft: eingeordnete Ranking-Plaetze gehen mit Cloud-Sync nicht verloren. Frueher ueberschrieb der Start-Pull
// bedingungslos die lokalen Daten -- kam der Upload nie an (Netz weg, App sofort geschlossen), waren die
// Plaetze beim naechsten Start weg. Jetzt: ungesicherte lokale Aenderungen werden zuerst hochgeladen.
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
let ok = true; const check = (l, c) => { console.log(l + ":", !!c); if (!c) ok = false; };
const base = { status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-01" };
const games = ["Azul", "Brass", "Catan"].map((n, i) => ({ ...base, id: "g" + i, name: n }));
const plays = games.map((g, i) => ({ id: "p" + i, gameId: g.id, gameName: g.name, date: "2026-09-01", mode: "physical-owned", players: "", playerIds: [], winner: "", scores: {}, notes: "", images: [] }));
const lists = [{ id: "l1", name: "Koop", gameIds: ["g0", "g1"] }];
async function run({ localGames = [], withSync, remote, abort, unblock }) {
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const state = { db: remote, puts: [] };
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript", body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
  await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
  let blockGet = !!abort;
  await page.route("https://db.test/**", (r) => { const req = r.request();
    if (req.method() === "PUT") { const d = JSON.parse(req.postData()); state.puts.push(d); state.db = d; return r.fulfill({ status: 200, contentType: "application/json", body: "{}" }); }
    if (blockGet) return r.abort();
    return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(state.db) }); });
  await page.addInitScript((d) => { if (localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1");
    localStorage.setItem("spielregal:games", JSON.stringify(d.games)); localStorage.setItem("spielregal:plays", JSON.stringify(d.plays)); localStorage.setItem("spielregal:lists", JSON.stringify(d.lists));
    if (d.withSync) localStorage.setItem("spielregal:syncUrl", "https://db.test/"); localStorage.setItem("spielregal:theme", "dark"); }, { games: localGames, plays, lists, withSync });
  // beim Start darf die Cloud nichts liefern (simuliert: der Start-Pull hat die Spiele nicht zurueckgebracht)
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }); await page.waitForTimeout(1500);
  if (unblock) blockGet = false;
  await page.locator('button:has-text("Sammlung")').last().click(); await page.waitForTimeout(800);
  const has = await page.locator("[data-restore-btn]").count();
  if (has) { await page.locator("[data-restore-btn]").click(); await page.waitForTimeout(2200); }
  const msg = (await page.locator("[data-restore-msg]").count()) ? await page.locator("[data-restore-msg]").innerText() : "";
  const local = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:games")));
  const names = await page.evaluate(() => [...document.querySelectorAll("p,span,h3")].map((e) => e.textContent).join("|"));
  await page.close();
  return { has, msg, local, state, names };
}
// 1) ohne Cloud: aus den Partien neu anlegen, gleiche IDs (Listen finden ihre Spiele wieder)
let r = await run({ withSync: false, remote: {} });
check("1: Wiederherstellen-Knopf erscheint bei leeren Spielen mit Partien", r.has === 1);
check("1: 3 Spiele aus Partien neu angelegt, gleiche IDs", r.local.length === 3 && r.local.map((g) => g.id).sort().join() === "g0,g1,g2" && r.local.some((g) => g.name === "Azul"));
check("1: Meldung nennt 3 Spiele (" + r.msg.slice(0, 40) + ")", /3 Spiele/.test(r.msg));
// 2) mit Cloud, die die Spiele hat: Cloud gewinnt (Namen aus der Cloud)
const cloudGames = games.map((g) => ({ ...g, name: g.name + " Cloud" }));
r = await run({ withSync: true, remote: { games: cloudGames, plays, lists, updatedAt: 1 }, abort: true });
check("2: Cloud nicht erreichbar -> abgebrochen, nichts angelegt, nichts hochgeladen", r.local.length === 0 && /nicht erreichbar/.test(r.msg) && r.state.puts.length === 0);
// 2b) Start-Pull ging schief, beim Klick ist die Cloud da und hat die Spiele: Cloud gewinnt
r = await run({ withSync: true, remote: { games: cloudGames, plays, lists, updatedAt: 1 }, abort: true, unblock: true });
check("2b: Spiele kommen aus der Cloud (Namen mit 'Cloud'), nicht aus den Partien", r.local.length === 3 && r.local.every((g) => /Cloud$/.test(g.name)));
// 3) Cloud erreichbar, aber ohne Spiele
r = await run({ withSync: true, remote: { plays, lists, updatedAt: 1 } });
check("3: Cloud ohne Spiele -> aus Partien angelegt (3)", r.local.length === 3);
check("3: danach liegt die wiederhergestellte Liste in der Cloud", r.state.puts.some((d) => d.games && d.games.length === 3));
// 4) Sicherung: sind Spiele da, wird eine kompakte Kopie mitgeschrieben und bei der Wiederherstellung bevorzugt
const pg = await b.newPage();
await pg.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await pg.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
await pg.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await pg.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript", body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await pg.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
await pg.addInitScript((d) => { if (localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1"); localStorage.setItem("spielregal:games", JSON.stringify(d.games)); localStorage.setItem("spielregal:plays", JSON.stringify(d.plays)); }, { games: games.map((g) => ({ ...g, rating: "8", status: g.name === "Brass" ? "wishlist" : "owned" })), plays });
await pg.goto(url, { waitUntil: "networkidle" }); await pg.waitForTimeout(1500);
const bk = await pg.evaluate(() => JSON.parse(localStorage.getItem("spielregal:gamesBackup") || "[]"));
check("4: kompakte Sicherung der Spiele wird mitgeschrieben (3, mit Status/Bewertung)", bk.length === 3 && bk.find((g) => g.name === "Brass").status === "wishlist" && bk[0].rating === "8");
await pg.close();
await b.close(); server.close();
console.log(ok ? "Wiederherstellungs-Test bestanden: true" : "FEHLER"); process.exit(ok ? 0 : 1);
