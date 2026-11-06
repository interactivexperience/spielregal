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
async function scenario(name, { localGames, remote, dirty }) {
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const state = { db: remote, puts: [] };
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript", body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
  await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
  await page.route("https://db.test/**", (r) => { const req = r.request();
    if (req.method() === "PUT") { const d = JSON.parse(req.postData()); state.puts.push(d); state.db = d; return r.fulfill({ status: 200, contentType: "application/json", body: "{}" }); }
    return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(state.db) }); });
  await page.addInitScript((d) => { if (localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1");
    localStorage.setItem("spielregal:games", JSON.stringify(d.games)); localStorage.setItem("spielregal:plays", JSON.stringify(d.plays)); localStorage.setItem("spielregal:lists", JSON.stringify(d.lists));
    localStorage.setItem("spielregal:syncUrl", "https://db.test/"); localStorage.setItem("spielregal:theme", "dark"); if (d.dirty) localStorage.setItem("spielregal:syncDirty", "1"); }, { games: localGames, plays, lists, dirty });
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }); await page.waitForTimeout(3000);
  const local = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:games")));
  await page.close();
  return { local, state };
}
// A: Cloud hat Partien/Listen, aber keine Spiele; lokal sind die Spiele da -> bleiben, Cloud wird wiederhergestellt
let r = await scenario("A", { localGames: games, remote: { plays, lists, updatedAt: 1 } });
check("A: lokale Spiele bleiben erhalten (3)", r.local.length === 3);
check("A: Cloud wird mit den Spielen wiederhergestellt", r.state.db.games && r.state.db.games.length === 3);
// B: lokal sind die Spiele weg (Partien/Listen da), Merker 'ungesichert', Cloud hat die Spiele -> werden abgerufen, nichts Leeres hochgeladen
r = await scenario("B", { localGames: [], remote: { games, plays, lists, updatedAt: 1 }, dirty: true });
check("B: Spiele kommen aus der Cloud zurueck (3)", r.local.length === 3);
check("B: es wurde nichts mit leerer Spieleliste hochgeladen", r.state.puts.every((d) => d.games && d.games.length > 0));
// C: lokal weg, Cloud hat ebenfalls keine Spiele -> es wird nie eine leere Spieleliste hochgeladen
r = await scenario("C", { localGames: [], remote: { plays, lists, updatedAt: 1 }, dirty: true });
check("C: keine leere Spieleliste in die Cloud geschrieben", r.state.puts.every((d) => d.games && d.games.length > 0));
await b.close(); server.close();
console.log(ok ? "Cloud-Schutz-Test bestanden: true" : "FEHLER"); process.exit(ok ? 0 : 1);
