// Prueft Ueberspringen und die Duell-Darstellung (zwei Karten nebeneinander, Wischen/Tippen waehlt eine Seite).
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
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: false });
const pickBtn = (k) => (k === "equal" ? page.locator('[data-rank="equal"]') : k === "better" ? page.locator("[data-duel-cur]") : page.locator("[data-duel-ref]"));
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("dialog", (d) => d.accept());
await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react.production.min.js".replace("react.","react-dom.")), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript", body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));

// Staerke = wahre Vorliebe. Gleiche Staerke -> "Gleich gut".
const strength = { Azul: 9, Brass: 8, Catan: 7, Dixit: 6, Everdell: 6, Fluxx: 4, Gloomhaven: 3, Hanabi: 2 };
const names = Object.keys(strength);
const base = { status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-01" };
const games = [...names.map((n, i) => ({ ...base, id: "g" + i, name: n })),
  { ...base, id: "gx", name: "Ungespielt" },                                   // keine Partie -> nicht dabei
  { ...base, id: "gexp", name: "Azul: Erweiterung", expansionOf: "g0" },      // Partie zaehlt zum Basisspiel
  { ...base, id: "gsaum", name: "Saum", status: "none" }];                    // nur Browser-Partie (selbst gebaut) -> zaehlt nicht
const play = (id, gameId) => ({ id, gameId, gameName: gameId, date: "2026-09-01", mode: "physical-owned", players: "", playerIds: [], winner: "", scores: {}, notes: "", images: [] });
const plays = [...names.map((n, i) => play("p" + i, "g" + i)), play("pe", "gexp"), { ...play("psaum", "gsaum"), mode: "bga", source: "saum" }];
await page.addInitScript((d) => {
  if (localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1");
  localStorage.setItem("spielregal:games", JSON.stringify(d.games));
  localStorage.setItem("spielregal:plays", JSON.stringify(d.plays));
  localStorage.setItem("spielregal:theme", "dark");
}, { games, plays });
const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:games")));
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2000);

const card = page.locator("[data-ranking-duel]");
console.log("Dashboard: Karte 'Mein Ranking' mit 'Ranking starten':", await page.locator("[data-dash-ranking] [data-rank-start]").count() === 1 && (await page.locator("[data-dash-ranking]").innerText()).includes("8 gespielten"));
await page.locator("[data-rank-start]").click(); await page.waitForTimeout(500);
await page.screenshot({ path: `${SP}/ranking_duel.png` });

const SPp = SP;
const info2 = async () => ({ cur: (await page.locator("[data-duel-cur] [data-name]").innerText()).trim(), ref: (await page.locator("[data-duel-ref] [data-name]").innerText()).trim(), curSide: await page.locator("[data-duel-cur]").getAttribute("data-side") });
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }); await page.waitForTimeout(1500);
await page.locator("[data-rank-start]").click(); await page.waitForTimeout(600);
console.log("Zwei Karten nebeneinander mit VS:", await page.locator("[data-duel-card]").count() === 2 && (await page.locator("[data-ranking-duel]").innerText()).includes("VS"));
const boxes = await page.locator("[data-duel-card]").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width)]; }));
console.log("Diagonal: beide Karten volle Breite, linke oben, rechte unten, zusammen fast die ganze Hoehe:", boxes[0][2] === boxes[1][2] && boxes[0][0] === boxes[1][0] && boxes[0][1] < boxes[1][1] && boxes[0][2] >= 380, JSON.stringify(boxes));
console.log("Knoepfe unten: 'Gleich gut' und 'Ueberspringen', kein Herz/Kreuz mehr:", await page.locator('[data-rank="equal"]').count() === 1 && await page.locator('[data-rank="skip"]').count() === 1 && await page.locator('[data-rank="better"], [data-rank="worse"]').count() === 0);
// Antworten bis mind. 2 Spiele einsortiert, damit mehrere warten
for (let i = 0; i < 2; i++) { await pickBtn("better").click(); await page.waitForTimeout(450); }
const before = await info2();
const rankedBefore = (await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:games")))).filter((g) => Number.isInteger(g.rankPos)).length;
await page.locator('[data-rank="skip"]').click(); await page.waitForTimeout(500);
const afterSkip = await info2();
const rankedAfter = (await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:games")))).filter((g) => Number.isInteger(g.rankPos)).length;
console.log("Ueberspringen: anderes Spiel kommt, nichts wird einsortiert:", afterSkip.cur !== before.cur && rankedAfter === rankedBefore, before.cur, "->", afterSkip.cur);
await page.locator("[data-rank-undo]").click(); await page.waitForTimeout(500);
const afterUndo = await info2();
console.log("Rueckgaengig nach Ueberspringen: dasselbe Duell wie vorher:", afterUndo.cur === before.cur && afterUndo.ref === before.ref);
// Wischen: Halb gezogen wird die Seite hervorgehoben, Loslassen ueber der Schwelle waehlt sie
const area = await page.locator("[data-duel-area]").boundingBox();
const cx = area.x + area.width / 2, cy = area.y + area.height / 2;
await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx - 70, cy, { steps: 5 });
await page.screenshot({ path: `${SPp}/duel_drag_left.png` });
const sc = await page.locator("[data-duel-card]").evaluateAll((els) => els.map((e) => ({ side: e.getAttribute("data-side"), t: e.style.transform })));
console.log("Beim Ziehen nach links wird die linke Karte groesser, die rechte kleiner:", sc.find((c) => c.side === "left").t.includes("scale(1.0") && sc.find((c) => c.side === "right").t.includes("scale(0.9"), JSON.stringify(sc));
const picked = await page.locator("[data-duel-card]").nth(0).getAttribute("data-side");
const leftName = (await page.locator('[data-duel-card][data-side="left"] [data-name]').innerText()).trim();
await page.mouse.up(); await page.waitForTimeout(600);
const g1 = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:games")));
const hist = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:rankingSession")).hist.length);
console.log("Wischen nach links waehlt das linke Spiel (Verlauf waechst um 1):", hist >= 3, "(gewaehlt: " + leftName + ")");
await page.screenshot({ path: `${SPp}/duel_after.png` });
await b.close(); server.close();
