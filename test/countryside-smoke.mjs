// Smoke-Test für countryside/index.html („Landgut“).
// 1. Lädt die Seite im iPhone-Format und prüft auf JS-Fehler.
// 2. Simuliert Bot-Partien (2–4 Personen und Solo) über window.__lg und prüft
//    Invarianten (Münzen + Körbe ≤ 15, Gebietsplätze, Spielende, Kartenzahl).
// 3. Spielt eine komplette Partie per Klick gegen einen Bot und eine Solo-Partie.
// Aufruf (aus test/): node countryside-smoke.mjs [--shots <ordner>]
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
const url = `http://127.0.0.1:${server.address().port}/countryside/`;
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
const errors = [];
await page.route("**/fonts.googleapis.com/**", (r) => r.fulfill({ body: "", contentType: "text/css" }));
await page.route("**/fonts.gstatic.com/**", (r) => r.abort());
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error" && !/fonts\.gstatic/.test(m.text())) errors.push(`console.error: ${m.text()}`); });
const fail = (m) => { console.error("FEHLER:", m); errors.push(m); };

await page.goto(url, { waitUntil: "load" });
if (!(await page.locator("text=Landgut übernehmen").count())) fail("Startbildschirm fehlt");
if (shots) await page.screenshot({ path: `${shots}/lg-1-start.png`, fullPage: true });

const sim = await page.evaluate(() => {
  const out = [];
  const runs = [];
  for (const n of [2, 3, 4]) for (let seed = 1; seed <= 8; seed++) runs.push([n, seed * 4099 + n, false]);
  for (let seed = 1; seed <= 8; seed++) runs.push([1, seed * 613, true]);
  for (const [n, seed, solo] of runs) {
    const r = window.__lg.simulate(n, seed, solo);
    const S = window.__lg.state(); const bad = [];
    if (!r.final) bad.push("kein Spielende (guard " + r.guard + ")");
    for (const p of S.players) {
      const g = Object.values(p.goods).reduce((a, b) => a + b, 0);
      if (p.coins < 0 || p.coins + g > 15 || Object.values(p.goods).some((x) => x < 0)) bad.push(p.name + " Körbe/Münzen");
      for (const t of p.terrs) if (t.cards.length > window.__lg.cap(t.id)) bad.push("Gebiet überfüllt");
      if (p.hand.length > 12) bad.push("Hand > 12");
      if (p.placed.length > 4) bad.push("Arbeitskräfte");
    }
    const cards = S.deck.length + S.discard.length + S.display.length + (S.soloStacks || []).flat().length + S.players.reduce((s, p) => s + p.hand.length + p.terrs.reduce((a, t) => a + t.cards.length, 0), 0);
    if (cards !== 126) bad.push("Kartenzahl " + cards);
    out.push({ n: solo ? "solo" : n, vp: S.players.map((p) => p.vp), guard: r.guard, bad });
  }
  window.__lg.reset();
  return out;
});
const bad = sim.filter((s) => s.bad.length);
if (bad.length) fail("Simulationen: " + JSON.stringify(bad.slice(0, 3)));
const avg = (a) => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
for (const n of [2, 3, 4, "solo"]) { const s = sim.filter((x) => x.n === n); console.log(`Bots ${n}: Ø Sieger ${avg(s.map((x) => Math.max(...x.vp)))}, Ø Punkte ${avg(s.flatMap((x) => x.vp))}, Ø Züge ${avg(s.map((x) => x.guard))}`); }

async function playUi(label, bots) {
  await page.click(`[data-a=bots][data-n='${bots}']`);
  await page.click("text=Landgut übernehmen");
  await page.waitForSelector(".sheet");
  // Mitspieler-Tempo liegt im Menü (nicht als flüchtiger Knopf in der Fußleiste) und bleibt gespeichert
  if (await page.locator(".bar [data-a=fast]").count()) fail("Tempo-Knopf noch in der Fußleiste");
  await page.waitForTimeout(400);
  if (await page.locator(".sheet").count()) await page.click("[data-a=close]", { force: true }).catch(() => {});
  await page.waitForTimeout(400);
  await page.click("[data-a=menu]", { force: true });
  await page.waitForSelector(".sheet [data-a=fast]");
  const fastBefore = await page.evaluate(() => U.fast);
  await page.click(".sheet [data-a=fast]", { force: true });
  await page.waitForTimeout(200);
  const fastSaved = await page.evaluate(() => localStorage.getItem("spielregal:botFast"));
  if (fastSaved !== (fastBefore ? "0" : "1") || !(await page.locator(".sheet [data-a=fast]").innerText()).includes(fastBefore ? "normal" : "schnell")) fail("Mitspieler-Tempo im Menü schaltet/speichert nicht");
  await page.click("[data-a=close]", { force: true });
  await page.waitForTimeout(500);
  await page.evaluate(() => { U.fast = true; });
  let acts = 0, asks = 0, mk = 0, mr = 0, dp = 0, guard = 0, shot = false, zooms = 0, swipes = 0;
  while (guard++ < 3000) {
    if (await page.locator("text=Neue Partie").count()) break;
    const sheet = page.locator(".sheet");
    if (await sheet.count()) {
      asks++;
      const t = await page.evaluate(() => window.__lg.state().ask && window.__lg.state().ask.t);
      if (!t) { await page.click("[data-a=close]", { force: true }).catch(() => {}); continue; }
      if (!shot && shots && t === "play") { await page.screenshot({ path: `${shots}/lg-3-play-${label}.png` }); }
      if (t === "setupTerr") { for (let i = 0; i < 3; i++) await sheet.locator("[data-a=tsel]").nth(i).click({ force: true }); await sheet.locator("[data-a=askok]").click({ force: true }); continue; }
      if (t === "discardN") { const n = await page.evaluate(() => Math.min(window.__lg.state().ask.n, window.__lg.state().players.find((p) => !p.bot).hand.length)); for (let i = 0; i < n; i++) await sheet.locator("[data-a=hsel]").nth(i).click({ force: true }); await sheet.locator("[data-a=askok]").click({ force: true }); continue; }
      if (t === "discardSun") { await sheet.locator("[data-a=askok]").click({ force: true }); continue; }
      if (t === "take") { await sheet.locator("[data-a=dsel]").nth(asks % (await sheet.locator("[data-a=dsel]").count())).click({ force: true }); await sheet.locator("[data-a=askok]").click({ force: true }); continue; }
      if (t === "play") {
        if (asks % 5 === 0) { await sheet.locator("[data-a=askskip]").click({ force: true }); continue; }
        await sheet.locator("[data-a=csel]").first().click({ force: true }); await sheet.locator("[data-a=tplay]").first().click({ force: true }); continue;
      }
      if (t === "terrDraw") { await sheet.locator("[data-a=ssel]").first().click({ force: true }); await sheet.locator("[data-a=ssel]").last().click({ force: true }); await sheet.locator("[data-a=askok]").click({ force: true }); continue; }
      if (t === "sell") { const p = sheet.locator("[data-a=sellc][data-d='1']"); if (await p.count()) await p.first().click({ force: true }); await sheet.locator("[data-a=askok]").click({ force: true }); continue; }
      if (t === "count") { await sheet.locator("[data-a=askval]").click({ force: true }); continue; }
      const v = sheet.locator("[data-a=askval], [data-a=tplay]");
      if (await v.count()) { await v.nth(asks % (await v.count())).click({ force: true }); continue; }
      if (await sheet.locator("[data-a=askskip]").count()) { await sheet.locator("[data-a=askskip]").click({ force: true }); continue; }
      fail("Unbekannter Dialog " + t); break;
    }
    const dpk = page.locator(".dpick");
    if (await dpk.count()) {
      dp++;
      const dt = await page.evaluate(() => window.__lg.state().ask && window.__lg.state().ask.t);
      if (dt === "orders" && dp % 4 === 0) await page.click(".bar [data-a=askskip]", { force: true });
      else await dpk.nth(dp % (await dpk.count())).click({ force: true });
      continue;
    }
    const mrk = page.locator(".fld.mpick");
    if (await mrk.count()) { mr++; await mrk.nth(mr % (await mrk.count())).click({ force: true }); continue; }
    const mkt = page.locator(".market [data-a=askval]:not([disabled])");
    if (await mkt.count()) { mk++; await mkt.nth(mk % (await mkt.count())).click({ force: true }); continue; }
    if (await page.locator("[data-a=askopen]").count()) { await page.locator("[data-a=askopen]").first().click({ force: true }); continue; }
    if (await page.locator("[data-a=endday]").count()) {
      acts++;
      // Kartenhand: antippen (Vorschau), gedrückt am Fächer entlangfahren, nach oben wischen = einsetzen
      const hc = page.locator(".hcard:not(.dim)");
      if (acts % 3 === 1 && (await hc.count())) {
        const c = await hc.last().boundingBox();
        await page.mouse.move(c.x + c.width - 14, c.y + 16); await page.mouse.down(); await page.waitForTimeout(300);
        if (await page.locator(".hprev").count()) zooms++;
        await page.mouse.move(c.x + c.width - 14, c.y - 130, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(350);
        swipes++;
        continue;
      }
      const live = page.locator(".fld.live");
      const n = await live.count();
      if (n && acts % 4 !== 0) { const f = live.nth(acts % n); await f.evaluate((e) => e.scrollIntoView({ block: "center" })); await f.click({ force: true }); }
      else await page.click("[data-a=endday]", { force: true });
      if (!shot && shots && acts === 6) { await page.waitForTimeout(200); await page.screenshot({ path: `${shots}/lg-2-game-${label}.png`, fullPage: true }); shot = true; }
      continue;
    }
    await page.waitForTimeout(80);
  }
  if (!(await page.locator("text=Neue Partie").count())) fail(`UI-Partie ${label} nicht beendet (guard ${guard}, Aktionen ${acts})`);
  console.log(`UI-Partie ${label}: ${acts} Züge, ${asks} Dialoge, ${mk}× Markt direkt, ${mr}× Marker direkt, ${dp}× Auftrag/Gebiet/Arbeitskraft direkt, ${zooms}× Karte groß, ${swipes}× eingesetzt per Wisch.`);
  if (!zooms) fail(`${label}: Handkarten-Fächer nie benutzt`);
  if (!mk) fail(`${label}: Marktaktion nie direkt am Markt gewählt`);
  if (shots) await page.screenshot({ path: `${shots}/lg-4-end-${label}.png`, fullPage: true });
  await page.click("[data-a=newgame]");
}
await playUi("1 Bot", 1);
await playUi("Solo", 0);
const inbox = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:inbox:plays") || "[]"));
if (inbox.filter((e) => e.gameName === "Countryside").length !== 2) fail("Partien nicht im Eingangskorb");
await browser.close(); server.close();
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("OK — Landgut: keine JS-Fehler, Bot- und UI-Partien vollständig.");
