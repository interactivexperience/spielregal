// Smoke-Test für three-sisters/index.html („Drei Schwestern“).
// 1. Lädt die Seite im iPhone-Format und prüft auf JS-Fehler.
// 2. Spielt Bot-Partien (2–4 Personen) über window.__ts durch und prüft
//    Invarianten (Leisten im gültigen Bereich, 8 Runden, Endabrechnung).
// 3. Spielt eine komplette Partie per Klick gegen 2 Bots.
// Aufruf (aus test/): node three-sisters-smoke.mjs [--shots <ordner>]
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const si = process.argv.indexOf("--shots");
const shots = si > 0 ? process.argv[si + 1] : null;
if (shots) mkdirSync(shots, { recursive: true });
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  let body; try { body = readFileSync(path.join(repoRoot, p)); } catch { res.writeHead(404); res.end("nf"); return; }
  res.writeHead(200, p.endsWith(".html") ? { "content-type": "text/html; charset=utf-8" } : {}); res.end(body);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/three-sisters/`;
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
const errors = [];
await page.route("**/fonts.googleapis.com/**", (r) => r.fulfill({ body: "", contentType: "text/css" }));
await page.route("**/fonts.gstatic.com/**", (r) => r.abort());
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error" && !/fonts\.gstatic/.test(m.text())) errors.push(`console.error: ${m.text()}`); });
const fail = (m) => { console.error("FEHLER:", m); errors.push(m); };

await page.goto(url, { waitUntil: "load" });
if (!(await page.locator("text=Garten anlegen").count())) fail("Startbildschirm fehlt");
if (shots) await page.screenshot({ path: `${shots}/ts-1-start.png`, fullPage: true });

const sim = await page.evaluate(() => {
  const out = [];
  const runs = [];
  for (const n of [2, 3, 4]) for (let seed = 1; seed <= 12; seed++) runs.push([n, seed * 104729 + n, false]);
  for (let seed = 1; seed <= 12; seed++) runs.push([1, seed * 7919, true]);
  for (const [n, seed, solo] of runs) {
    const r = window.__ts.simulate(n, seed, solo);
    const S = window.__ts.state(); const bad = [];
    if (!r.final) bad.push("keine Endabrechnung");
    if (S.round !== 8) bad.push("Runde " + S.round);
    for (const p of S.players) {
      p.g.forEach((zo, z) => ["c", "b", "s"].forEach((k) => zo[k].forEach((h) => { if (h < -1 || h > 4) bad.push("Pflanze " + z + k + h); })));
      if (p.compost < 0 || p.compost > 20 || p.goods < 0 || p.goods > 80 || p.tasks.length) bad.push(p.name + " Leisten");
      for (const f of Object.values(p.per)) if (f.n > f.cap) bad.push("Staude");
      for (const f of Object.values(p.yard)) if (f.n > f.cap) bad.push("Hof");
    }
    for (const row of r.final || []) if (!Number.isFinite(row.total)) bad.push("NaN");
    out.push({ n: solo ? "solo" : n, totals: (r.final || []).map((x) => x.total), bad });
  }
  window.__ts.reset();
  return out;
});
const bad = sim.filter((s) => s.bad.length);
if (bad.length) fail("Simulationen: " + JSON.stringify(bad.slice(0, 3)));
const avg = (a) => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
for (const n of [2, 3, 4, "solo"]) { const s = sim.filter((x) => x.n === n); console.log(`Bots ${n}: Ø Sieger ${avg(s.map((x) => Math.max(...x.totals)))}, Ø Punkte ${avg(s.flatMap((x) => x.totals))}`); }

async function playUi(label, expectPicks) {
  let picks = 0, tasks = 0, guard = 0, shot = false;
  while (guard++ < 2500) {
    if (await page.locator("text=Neue Partie").count()) break;
    if (await page.locator(".sheet").count() === 0) {
      if (await page.locator(".bar [data-a=task]").count()) { await page.click(".bar [data-a=task]"); continue; }
      const live = page.locator(".die.live");
      if (await live.count()) { await live.nth(picks % (await live.count())).click({ force: true }); continue; }
      await page.waitForTimeout(100); continue;
    }
    if (await page.locator("[data-a=takedie]").count()) {
      if (picks % 3 === 1 && (await page.locator("[data-a=adj][data-d='1']:not([disabled])").count())) await page.click("[data-a=adj][data-d='1']");
      await page.click("[data-a=takedie]"); picks++; continue;
    }
    tasks++;
    if (await page.locator("[data-a=zsel]").count()) { await page.locator("[data-a=zsel]").nth(tasks % 6).click(); continue; }
    if (!shot && shots && (await page.locator("[data-a=pk]").count())) { await page.screenshot({ path: `${shots}/ts-3-task-${label}.png` }); shot = true; }
    if ((await page.locator("[data-a=pk]").count()) && tasks % 3) {
      for (let i = 0; i < 2; i++) { const b = page.locator("[data-a=pk]"); if (await b.count()) await b.nth(tasks % (await b.count())).click(); }
      await page.click("[data-a=plant]"); continue;
    }
    if (await page.locator("[data-a=water]:not([disabled])").count()) { await page.click("[data-a=water]"); continue; }
    const o = page.locator(".sheet .opt:not(.off)");
    if (await o.count()) { await o.nth(tasks % (await o.count())).click(); continue; }
    await page.click("[data-a=tskip]");
  }
  if (!(await page.locator("text=Neue Partie").count())) fail(`UI-Partie ${label} nicht beendet (guard ${guard})`);
  if (picks !== expectPicks) fail(`${label}: erwartet ${expectPicks} Würfel, waren ${picks}`);
  console.log(`UI-Partie ${label}: ${picks} Würfel, ${tasks} Aktionen.`);
}

await page.click("text=2 Bots");
await page.click("text=Garten anlegen");
await page.waitForSelector(".rondel");
await page.click("[data-a=fast]").catch(() => {});
if (shots) await page.screenshot({ path: `${shots}/ts-2-game.png`, fullPage: true });
await playUi("2 Bots", 16);
const inbox = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:inbox:plays") || "[]"));
if (!inbox.some((e) => e.gameName === "Three Sisters" && e.bggId === "291845")) fail("Partie nicht im Eingangskorb");
if (shots) await page.screenshot({ path: `${shots}/ts-4-end.png`, fullPage: true });
// Solo gegen Farmerin Edith
await page.click("[data-a=newgame]");
await page.click("text=Solo gegen Edith");
await page.click("text=Garten anlegen");
await page.waitForSelector(".rondel");
await page.click("[data-a=fast]").catch(() => {});
await playUi("Solo", 16);
const inbox2 = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:inbox:plays") || "[]"));
const solo = inbox2.find((e) => e.solo);
if (!solo || solo.results.length !== 1 || solo.winners.length) fail("Solo-Partie falsch im Eingangskorb: " + JSON.stringify(solo));
if (shots) await page.screenshot({ path: `${shots}/ts-5-solo-end.png`, fullPage: true });
await browser.close(); server.close();
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("OK — Drei Schwestern: keine JS-Fehler, Bot- und UI-Partien vollständig.");
