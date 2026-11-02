// Stresstest Ranking (mehrere Spiele laufen parallel): 14 Spiele mit 3 Gleichstaenden, mehrere Durchlaeufe mit
// zufaelliger Reihenfolge; Rangliste und Gleichstaende muessen exakt zur wahren Vorliebe passen. (Basis: ranking.mjs)
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

const strength = { A: 14, B: 13, C: 12, D: 11, E: 11, F: 9, G: 8, H: 8, I: 6, J: 5, K: 4, L: 4, M: 2, N: 1 };
const names = Object.keys(strength);
const base = { status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-01" };
const games = names.map((n, i) => ({ ...base, id: "g" + i, name: "G" + n }));
const play = (id, gameId) => ({ id, gameId, gameName: gameId, date: "2026-09-01", mode: "physical-owned", players: "", playerIds: [], winner: "", scores: {}, notes: "", images: [] });
const plays = names.map((n, i) => play("p" + i, "g" + i));
let allOk = true;
for (let run = 1; run <= 4; run++) {
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript", body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
  await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
  await page.addInitScript((d) => { localStorage.setItem("spielregal:games", JSON.stringify(d.games)); localStorage.setItem("spielregal:plays", JSON.stringify(d.plays)); localStorage.setItem("spielregal:theme", "dark"); }, { games, plays });
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1200);
  await page.locator("[data-rank-start]").click(); await page.waitForTimeout(400);
  let duels = 0, sameCard = 0, last = null, maxRun = 1, run1 = 1;
  for (let g = 0; g < 200; g++) {
    if (await page.locator("[data-ranking-result]").count()) break;
    if (!(await page.locator("[data-ranking-duel]").count())) { await page.waitForTimeout(100); continue; }
    const cur = (await page.locator("[data-rank-card] p.font-display").innerText()).trim().slice(1);
    const ref = (await page.locator("[data-rank-ref] p.font-medium").innerText()).trim().slice(1);
    if (last === cur) { run1++; maxRun = Math.max(maxRun, run1); } else run1 = 1; last = cur;
    const a = strength[cur] > strength[ref] ? "better" : strength[cur] < strength[ref] ? "worse" : "equal";
    await page.locator(`[data-rank="${a}"]`).click(); await page.waitForTimeout(290); duels++;
  }
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:games")));
  const pos = (n) => st.find((x) => x.name === "G" + n).rankPos;
  const orderOk = names.every((a) => names.every((c) => strength[a] <= strength[c] || pos(a) < pos(c)));
  const tiesOk = names.every((a) => names.every((c) => (strength[a] === strength[c]) === (pos(a) === pos(c))));
  console.log(`Durchlauf ${run}: Reihenfolge exakt: ${orderOk} | Gleichstaende exakt (D=E, G=H, K=L): ${tiesOk} | Duelle: ${duels} (alle Paare waeren 91) | laengste Serie derselben Karte: ${maxRun}`);
  if (!orderOk || !tiesOk || duels > 55 || maxRun > 3) allOk = false;
  await page.close();
}
console.log("Stresstest bestanden:", allOk);
await b.close(); server.close();
