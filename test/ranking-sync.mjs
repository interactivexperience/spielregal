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
const base = { status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-01" };
const strength = { Azul: 3, Brass: 2, Catan: 1 };
const games = Object.keys(strength).map((n, i) => ({ ...base, id: "g" + i, name: n }));
const plays = games.map((g, i) => ({ id: "p" + i, gameId: g.id, gameName: g.name, date: "2026-09-01", mode: "physical-owned", players: "", playerIds: [], winner: "", scores: {}, notes: "", images: [] }));
const db = { data: { games, plays, updatedAt: 1 } }; let putMode = "fail", puts = 0;
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const pickBtn = (k) => (k === "equal" ? page.locator('[data-rank="equal"]') : k === "better" ? page.locator("[data-duel-cur]") : page.locator("[data-duel-ref]"));
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript", body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
await page.route("https://db.test/**", (r) => {
  const req = r.request();
  if (req.method() === "PUT") { if (putMode === "fail") return r.abort(); puts++; db.data = JSON.parse(req.postData()); return r.fulfill({ status: 200, contentType: "application/json", body: "{}" }); }
  return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(db.data) });
});
await page.addInitScript((d) => {
  if (localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1");
  localStorage.setItem("spielregal:games", JSON.stringify(d.games)); localStorage.setItem("spielregal:plays", JSON.stringify(d.plays));
  localStorage.setItem("spielregal:syncUrl", "https://db.test/"); localStorage.setItem("spielregal:theme", "dark");
}, { games, plays });
const local = () => page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:games")));
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(1500);
await page.locator("[data-rank-start]").click(); await page.waitForTimeout(400);
for (let g = 0; g < 20; g++) {
  if (await page.locator("[data-ranking-result]").count()) break;
  if (!(await page.locator("[data-ranking-duel]").count())) { await page.waitForTimeout(100); continue; }
  const cur = (await page.locator("[data-duel-cur] [data-name]").innerText()).trim();
  const ref = (await page.locator("[data-duel-ref] [data-name]").innerText()).trim();
  await pickBtn(strength[cur] > strength[ref] ? "better" : "worse").click(); await page.waitForTimeout(430);
}
const ranked1 = (await local()).filter((g) => Number.isInteger(g.rankPos)).length;
console.log("Lokal eingeordnet (3 Spiele):", ranked1 === 3);
console.log("Upload fehlgeschlagen -> Cloud kennt die Plaetze nicht (erwartet):", !db.data.games.some((g) => Number.isInteger(g.rankPos)));
// App schliessen/neu oeffnen: Netz ist wieder da, Cloud hat noch die alten Daten
putMode = "ok";
await page.reload({ waitUntil: "networkidle" }); await page.waitForTimeout(2500);
const after = await local();
console.log("Nach Neustart: eingeordnete Spiele noch da (3):", after.filter((g) => Number.isInteger(g.rankPos)).length === 3);
console.log("Nach Neustart: Plaetze wurden in die Cloud hochgeladen:", db.data.games.filter((g) => Number.isInteger(g.rankPos)).length === 3);
console.log("Dashboard zeigt weiter die fertige Rangliste:", (await page.locator("[data-dash-ranking]").innerText()).includes("Rangliste ansehen"));
// Aenderung kurz vor dem Schliessen (innerhalb der 1,2 s Wartezeit): darf nicht verloren gehen
await page.evaluate(() => { const gs = JSON.parse(localStorage.getItem("spielregal:games")); });
const before = puts;
await page.locator("[data-rank-open]").click(); await page.waitForTimeout(500);
await page.locator("button[aria-label='Schließen']").click(); await page.waitForTimeout(300);
await page.locator("[data-rank-open]").click(); await page.waitForTimeout(300);
await page.locator('button:has-text("Ranking neu starten")').click().catch(() => {}); await page.locator('[data-rank-restart-nosave]').click().catch(() => {}); await page.waitForTimeout(300);
await page.reload({ waitUntil: "networkidle" }); await page.waitForTimeout(2500);
const after2 = await local();
const srv = db.data.games.filter((g) => Number.isInteger(g.rankPos)).length;
console.log("Neustart direkt nach 'Ranking neu starten': lokal und Cloud stimmen ueberein (kein Zurueckspringen auf alte Plaetze):", after2.filter((g) => Number.isInteger(g.rankPos)).length === srv);
await b.close(); server.close();
