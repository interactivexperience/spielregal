// Smoke-Test für grand-austria-hotel/index.html („Grand Hotel Wien“).
//
// 1. Lädt die Seite headless im iPhone-Format und prüft auf JS-Fehler.
// 2. Spielt viele komplette Bot-Partien (2–4 Personen) synchron über den
//    Test-Hook window.__ghw durch und prüft Invarianten (keine negativen
//    Vorräte, gültige Endabrechnung, Partie endet nach 7 Runden).
// 3. Klickt sich als Mensch durch eine komplette Partie gegen 2 Bots
//    (Würfel nehmen, Gast holen, servieren, Zug beenden, Rundenwertung).
//
// Aufruf (aus test/): node gah-smoke.mjs [--shots <ordner>]
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const shotsIdx = process.argv.indexOf("--shots");
const shots = shotsIdx > 0 ? process.argv[shotsIdx + 1] : null;
if (shots) mkdirSync(shots, { recursive: true });

const server = http.createServer((req, res) => {
  const filePath = path.join(repoRoot, decodeURIComponent(req.url.split("?")[0]));
  try { res.writeHead(200, { "content-type": filePath.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream" }); res.end(readFileSync(filePath)); }
  catch { res.writeHead(404); res.end("not found"); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/grand-austria-hotel/index.html`;

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
await page.route("**/fonts.googleapis.com/**", (r) => r.fulfill({ body: "/* stub */", contentType: "text/css" }));
await page.route("**/fonts.gstatic.com/**", (r) => r.abort());
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error" && !/fonts\.gstatic/.test(m.text())) errors.push(`console.error: ${m.text()}`); });

const fail = (msg) => { console.error("FEHLER:", msg); errors.push(msg); };

await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(300);
if (!(await page.locator("text=Hotel eröffnen").count())) fail("Startbildschirm fehlt");
if (shots) await page.screenshot({ path: `${shots}/1-start.png`, fullPage: true });

// --- Bot-Simulationen ---
const sim = await page.evaluate(() => {
  const out = [];
  for (const n of [2, 3, 4]) for (let seed = 1; seed <= 25; seed++) {
    const r = window.__ghw.simulate(n, seed * 7919 + n);
    const S = window.__ghw.state();
    const bad = [];
    if (!r.final) bad.push("keine Endabrechnung");
    if (S.round !== 7) bad.push(`Runde ${S.round}`);
    for (const p of S.players) {
      if (p.k < 0 || p.vp < 0 || p.emp < 0) bad.push(`${p.name} negativ`);
      for (const f of ["s", "c", "w", "k"]) if (p.kitchen[f] < 0 || p.fresh[f] !== 0) bad.push(`${p.name} Küche ${f}`);
    }
    for (const row of r.final || []) if (!Number.isFinite(row.total)) bad.push("total NaN");
    out.push({ n, seed, turns: r.turns, totals: (r.final || []).map((x) => x.total), rooms: (r.final || []).map((x) => x.rooms), bad });
  }
  window.__ghw.reset();
  return out;
});
const badSims = sim.filter((s) => s.bad.length);
if (badSims.length) fail(`Simulationen mit Problemen: ${JSON.stringify(badSims.slice(0, 3))}`);
const avg = (a) => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
for (const n of [2, 3, 4]) {
  const s = sim.filter((x) => x.n === n);
  console.log(`Bots ${n}P: Ø Siegerpunkte ${avg(s.map((x) => Math.max(...x.totals)))}, Ø Punkte ${avg(s.flatMap((x) => x.totals))}, Ø belegte Zimmer ${avg(s.flatMap((x) => x.rooms))}`);
}

// --- Menschliche Partie per Klick ---
await page.fill("#nm", "Testerin");
await page.click("text=2 Bots");
await page.click("text=Hotel eröffnen");
await page.waitForSelector(".board");
await page.click("[data-a=fast]").catch(() => {});
let myTurns = 0, guests = 0, served = 0, guard = 0, shot2 = false;
while (guard++ < 400) {
  if (await page.locator("text=Neue Partie").count()) break;
  if (await page.locator("[data-a=roundok]").count()) { await page.click("[data-a=roundok]"); continue; }
  const live = page.locator(".act.live");
  if (!(await live.count())) {
    if (await page.locator("[data-a=endturn]:not([disabled])").count()) { await page.click("[data-a=endturn]"); continue; }
    await page.waitForTimeout(200); continue;
  }
  myTurns++;
  // ab und zu einen Gast holen
  if (myTurns % 2 === 1 && (await page.locator(".tslot").count())) {
    await page.locator(".line .gcard").first().click();
    const take = page.locator("[data-a=takeguest]:not([disabled])");
    if (await take.count()) { await take.click(); guests++; } else await page.click("[data-a=close]");
  }
  // Würfel wählen: der mit den meisten Würfeln
  const n = await live.count();
  await live.nth(myTurns % n).click();
  await page.waitForSelector(".sheet");
  if (await page.locator("[data-a=as]").count()) await page.locator("[data-a=as]").nth(myTurns % 5).click();
  if (await page.locator(".sheet .room.ok").count()) await page.locator(".sheet .room.ok").first().click({ force: true });
  if (await page.locator(".sheet [data-a=pick]").count()) await page.locator(".sheet [data-a=pick]").first().click();
  if (await page.locator("[data-a=bplus]:not([disabled])").count()) await page.click("[data-a=bplus]");
  if (!shot2 && shots) { await page.screenshot({ path: `${shots}/3-sheet.png` }); }
  const ok = page.locator("[data-a=dieok]:not([disabled])");
  if (await ok.count()) await ok.click(); else await page.click("[data-a=dieskip]");
  // servieren
  for (let i = 0; i < 8; i++) {
    const can = page.locator(".slot.can");
    if (!(await can.count())) break;
    await can.first().click({ force: true });
    if (await page.locator("[data-a=buyservice]").count()) await page.click("[data-a=buyservice]");
    served++;
  }
  if (await page.locator("[data-a=freerooms]").count()) {
    await page.click("[data-a=freerooms]");
    if (await page.locator(".sheet .room.ok").count()) { await page.locator(".sheet .room.ok").first().click({ force: true }); await page.click("[data-a=frok]"); }
    else await page.click("[data-a=frskip]");
  }
  if (!shot2 && shots) { await page.screenshot({ path: `${shots}/2-game.png`, fullPage: true }); shot2 = true; }
  await page.click("[data-a=endturn]");
}
const ended = await page.locator("text=Neue Partie").count();
if (!ended) fail(`Menschliche Partie nicht beendet (guard=${guard}, Züge=${myTurns})`);
if (myTurns !== 14) fail(`Erwartet 14 eigene Züge, waren ${myTurns}`);
console.log(`UI-Partie: ${myTurns} Züge, ${guests} Gäste geholt, ${served} Gerichte serviert.`);
if (shots) await page.screenshot({ path: `${shots}/4-end.png`, fullPage: true });

await browser.close();
server.close();
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("OK — Grand Hotel Wien: keine JS-Fehler, Bot- und UI-Partien vollständig.");
