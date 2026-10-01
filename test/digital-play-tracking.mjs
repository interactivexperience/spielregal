import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const vendor = (...p) => path.join(__dirname, "node_modules", ...p);

const server = http.createServer((req, res) => {
  // Ordner-URLs wie GitHub Pages auf index.html abbilden
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  let body;
  try { body = readFileSync(path.join(repoRoot, p)); } catch { res.writeHead(404); res.end("nf"); return; }
  res.writeHead(200, p.endsWith(".html") ? { "content-type": "text/html; charset=utf-8" } : {});
  res.end(body);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;
const twCss = readFileSync(path.join(__dirname, "tw-built.css"), "utf8");

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript",
  body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));



// Prueft das Tracking: Eine im Browser beendete Grand-Hotel-Partie landet
// ueber den Eingangskorb als digitale Partie ("bga") in Spielregal, mit
// Profil-Zuordnung, ohne Bots als Sieger und ohne Duplikate.
const SP = process.argv[2];
let fehler = 0;
const check = (ok, msg) => { if (!ok) { console.log("FEHLER: " + msg); fehler++; } };
const seed = {
  games: [{ id: "gah", name: "Grand Austria Hotel", bggId: "182874", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-01" }],
  players: [{ id: "pl-mi", name: "Mi", photo: "" }],
};
await page.addInitScript((d) => {
  if (!sessionStorage.getItem("seeded")) {
    localStorage.setItem("spielregal:games", JSON.stringify(d.games));
    localStorage.setItem("spielregal:plays", "[]");
    localStorage.setItem("spielregal:players", JSON.stringify(d.players));
    sessionStorage.setItem("seeded", "1");
  }
}, seed);
const base = url.replace("/index.html", "/");
try {
  // 1. Spiel: Profil-Chip waehlen, Partie starten und schnell zu Ende spielen
  await page.goto(base + "grand-austria-hotel/", { waitUntil: "load" });
  await page.waitForTimeout(400);
  check(await page.locator('[data-a=pickname][data-n="Mi"]').count() === 1, "Profil-Chip 'Mi' fehlt");
  await page.click('[data-a=pickname][data-n="Mi"]');
  await page.click("[data-a=bots][data-n='2']");
  await page.click("text=Hotel eröffnen");
  await page.evaluate(() => {
    let guard = 0;
    while (S.screen === "game" && guard++ < 500) {
      if (cur().bot) botTurn(); else { const f = [1, 2, 3, 4, 5, 6].find((x) => S.dice[x]); doDie(cur(), f, { skip: true }); endTurn(); }
      S.roundInfo = null;
    }
    U.sheet = null; render();
  });
  check(await page.locator("text=Als digitale Partie").count() === 1, "Hinweis 'vorgemerkt' fehlt am Spielende");
  check(await page.locator('a:has-text("Zum Spielregal")').getAttribute("href") === "../", "Link 'Zum Spielregal' fehlt");
  const inbox = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:inbox:plays") || "[]"));
  check(inbox.length === 1 && inbox[0].human === "Mi", "Eingangskorb: " + JSON.stringify(inbox).slice(0, 200));
  await page.reload(); await page.waitForTimeout(300);
  const inbox2 = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:inbox:plays") || "[]"));
  check(inbox2.length === 1, "Neuladen der Endseite erzeugt Duplikat");
  if (SP) await page.screenshot({ path: `${SP}/tracking-end.png`, fullPage: true });
  // 2. Zurueck ins Spielregal
  await page.goto(base + "index.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  const plays = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:plays") || "[]"));
  const leer = await page.evaluate(() => localStorage.getItem("spielregal:inbox:plays"));
  check(plays.length === 1, "Partien nach Import: " + plays.length);
  const p = plays[0] || {};
  check(p.mode === "bga" && p.gameId === "gah", "Modus/Spiel falsch: " + JSON.stringify(p).slice(0, 200));
  const meinTotal = inbox[0] && String(inbox[0].results.find((r) => !r.bot).total);
  check(JSON.stringify(p.playerIds) === '["pl-mi"]' && p.scores && p.scores["pl-mi"] === meinTotal, "Profil/Punkte falsch: " + JSON.stringify(p).slice(0, 300));
  const humanWon = inbox[0] && inbox[0].winners.includes("Mi");
  check(humanWon ? p.winner === "Mi" : p.winner === "", "Sieger falsch: " + p.winner);
  check(!leer, "Eingangskorb nicht geleert");
  await page.locator('button:has-text("Partien")').last().click();
  await page.waitForTimeout(600);
  await page.locator("text=Grand Austria Hotel").last().click();
  await page.waitForTimeout(600);
  check(await page.locator("text=Im Browser gespielt").count() >= 1, "Partie nicht in der Partien-Liste sichtbar");
  if (SP) await page.screenshot({ path: `${SP}/tracking-playlog.png` });
  // 3. Spiel nicht in der Sammlung → wird als "gespielt" angelegt, Bot-Sieg nicht als Sieger
  await page.evaluate(() => {
    localStorage.setItem("spielregal:inbox:plays", JSON.stringify([{ id: "ghw-test2", source: "grand-hotel-wien", bggId: "182874", gameName: "Grand Austria Hotel", date: "2026-10-01", human: "Unbekannt", results: [{ name: "Unbekannt", bot: false, total: 50 }, { name: "Frau Kipferl", bot: true, total: 60 }], winners: ["Frau Kipferl"] }]));
    localStorage.setItem("spielregal:games", "[]");
    localStorage.setItem("spielregal:plays", "[]");
  });
  await page.reload(); await page.waitForTimeout(3000);
  const g3 = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:games") || "[]"));
  const p3 = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:plays") || "[]"));
  check(g3.length === 1 && g3[0].status === "none" && g3[0].bggId === "182874", "Spiel nicht angelegt: " + JSON.stringify(g3).slice(0, 200));
  check(p3.length === 1 && p3[0].winner === "" && p3[0].playerIds.length === 0 && /Frau Kipferl \(Bot\)/.test(p3[0].notes), "Bot-Sieg falsch: " + JSON.stringify(p3).slice(0, 300));
} catch (e) { console.log("FEHLER: " + e.message); fehler++; }
await b.close(); server.close();
if (fehler) process.exit(1);
console.log("OK — Grand-Hotel-Partie landet als digitale Partie in Spielregal.");
