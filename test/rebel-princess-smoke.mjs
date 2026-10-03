// Smoke-Test für rebel-princess/index.html („Prinzessinnenball“).
// 1. Lädt die Seite im iPhone-Format und prüft auf JS-Fehler.
// 2. Spielt Bot-Partien (3–6 Personen) über window.__rp durch und prüft
//    Invarianten (5 Runden, alle Karten verteilt, Punkte konsistent).
// 3. Spielt eine komplette Partie per Klick gegen 3 Bots (inkl. Weitergeben).
// Aufruf (aus test/): node rebel-princess-smoke.mjs [--shots <ordner>]
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
const url = `http://127.0.0.1:${server.address().port}/rebel-princess/`;
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
const errors = [];
await page.route("**/fonts.googleapis.com/**", (r) => r.fulfill({ body: "", contentType: "text/css" }));
await page.route("**/fonts.gstatic.com/**", (r) => r.abort());
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error" && !/fonts\.gstatic/.test(m.text())) errors.push(`console.error: ${m.text()}`); });
const fail = (m) => { console.error("FEHLER:", m); errors.push(m); };

await page.goto(url, { waitUntil: "load" });
if (!(await page.locator("text=Zum Ball").count())) fail("Startbildschirm fehlt");
if (shots) await page.screenshot({ path: `${shots}/rp-1-start.png`, fullPage: true });

const sim = await page.evaluate(() => {
  const out = [];
  const keys = window.__rp.rules();
  const runs = [];
  for (const n of [3, 4, 5, 6]) for (let seed = 1; seed <= 12; seed++) runs.push({ n, seed: seed * 7727 + n });
  for (const k of keys) for (const n of [3, 4, 5, 6]) runs.push({ n, seed: n * 31 + k.length * 7 + k.charCodeAt(k.length - 1), rules: [k, k, k, k, k], k });
  for (const r0 of runs) {
    const r = window.__rp.simulate(r0.n, r0.seed, r0.rules ? { rules: r0.rules } : {});
    const S = window.__rp.state(); const bad = [];
    if (!r.final) bad.push("keine Endabrechnung");
    if (S.history.length !== 5) bad.push("Runden " + S.history.length);
    const deck = window.__rp.deck(r0.n);
    const all = S.players.flatMap((p) => p.won.concat(p.bid ? [p.bid] : [], p.low ? [p.low] : []));
    if (all.length !== deck.length || new Set(all).size !== deck.length) bad.push(`Karten ${all.length}/${new Set(all).size}/${deck.length}`);
    if (S.players.some((p) => p.hand.length || p.aside.length || p.late)) bad.push("Handkarten übrig");
    const sum = S.players.map((p, i) => S.history.reduce((s, h) => s + h.pts[i], 0));
    if (sum.some((x, i) => x !== S.players[i].total)) bad.push("Summen");
    if (S.players.some((p) => !Number.isFinite(p.total))) bad.push("NaN");
    out.push({ n: r0.n, k: r0.k || "", totals: S.players.map((p) => p.total), bad });
  }
  window.__rp.reset();
  return out;
});
const bad = sim.filter((s) => s.bad.length);
if (bad.length) fail("Simulationen: " + JSON.stringify(bad.slice(0, 4)));
const avg = (a) => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
for (const n of [3, 4, 5, 6]) { const s = sim.filter((x) => x.n === n && !x.k); console.log(`Bots ${n}P: Ø Sieger ${avg(s.map((x) => Math.min(...x.totals)))}, Ø Anträge ${avg(s.flatMap((x) => x.totals))}`); }
console.log(`Rundenkarten einzeln geprüft: ${new Set(sim.filter((x) => x.k).map((x) => x.k)).size}`);

async function playUi(label, setup) {
  await page.click("[data-a=bots][data-n='3']");
  await setup();
  await page.click("text=Zum Ball");
  const ks = await page.locator("[data-a=pick]").evaluateAll((els) => els.map((e) => e.dataset.k));
  await page.click(`[data-a=pick][data-k=${ks[label.length % 2]}]`);
  if (shots) await page.screenshot({ path: `${shots}/rp-2-princess-${label}.png` });
  await page.click("[data-a=pickok]");
  await page.click("[data-a=fast]").catch(() => {});
  let plays = 0, asks = 0, powers = 0, guard = 0, shot = false;
  while (guard++ < 4000) {
    if (await page.locator("text=Neue Partie").count()) break;
    if (await page.locator("[data-a=nextround]").count()) { await page.click("[data-a=nextround]"); continue; }
    const sheet = page.locator(".sheet");
    if (await sheet.count()) {
      asks++;
      if (await sheet.locator("[data-a=rotpick]").count()) { await sheet.locator("[data-a=rotpick]").first().click(); await sheet.locator("[data-a=askok]").click(); continue; }
      if (await sheet.locator("[data-a=askopt]").count()) { const o = sheet.locator("[data-a=askopt]"); await o.nth(asks % (await o.count())).click(); continue; }
      if (await sheet.locator("[data-a=tsel]").count() || await sheet.locator("[data-a=hgt]").count()) { await sheet.locator("[data-a=askskip]").click(); continue; }
      if (await sheet.locator("[data-a=card]").count()) {
        const need = await page.evaluate(() => window.__rp.state().ask.n);
        for (let i = 0; i < need; i++) await sheet.locator(".card:not(.sel)").first().click();
        await sheet.locator("[data-a=askok]").click(); continue;
      }
      if (await sheet.locator("[data-a=close]").count()) { await sheet.locator("[data-a=close]").click(); continue; }
    }
    if (await page.locator("[data-a=askopen]").count()) { await page.click("[data-a=askopen]"); continue; }
    if (await page.locator(".handbar [data-a=askopt]").count()) { const o = page.locator(".handbar [data-a=askopt]"); await o.nth(asks++ % 2).click(); powers++; continue; }
    if (await page.locator(".handbar [data-a=askok]").count()) {
      const need = await page.evaluate(() => window.__rp.state().ask.n);
      for (let i = 0; i < need; i++) await page.locator(".cards .card.ok:not(.sel)").first().click();
      await page.click(".handbar [data-a=askok]"); asks++; continue;
    }
    if (await page.locator("[data-a=play]").count()) {
      if (plays % 7 === 3 && (await page.locator("[data-a=turnpower]").count())) { await page.click("[data-a=turnpower]"); powers++; continue; }
      if (plays % 5 === 2 && (await page.locator("[data-a=power]:not(.on)").count())) { await page.click("[data-a=power]"); powers++; }
      const ok = page.locator(".cards .card.ok");
      await ok.nth(plays % Math.max(1, await ok.count())).click();
      if (await page.locator("[data-a=play]:not([disabled])").count()) { await page.click("[data-a=play]"); plays++; }
      else if (await page.locator("[data-a=power].on").count()) await page.click("[data-a=power]");
      if (!shot && shots && plays === 3) { await page.waitForTimeout(300); await page.screenshot({ path: `${shots}/rp-3-game-${label}.png`, fullPage: true }); shot = true; }
      continue;
    }
    await page.waitForTimeout(80);
  }
  if (!(await page.locator("text=Neue Partie").count())) fail(`UI-Partie ${label} nicht beendet (guard ${guard})`);
  console.log(`UI-Partie ${label}: ${plays} Karten gespielt, ${asks} Dialoge, ${powers}× Fähigkeit.`);
  if (shots) await page.screenshot({ path: `${shots}/rp-4-end-${label}.png`, fullPage: true });
  await page.locator("[data-a=newgame]").evaluate((e) => e.scrollIntoView({ block: "center" })); await page.locator("[data-a=newgame]").click({ force: true });
}
await playUi("erste", async () => { await page.click("[data-a=mode][data-m=first]"); });
// Zweite Partie: Rundenkarten mit vielen Dialogen erzwingen
await page.evaluate(() => { window.__forceRules = ["b", "h", "m", "o", "ek"]; });
await playUi("dialoge", async () => { await page.click("[data-a=mode][data-m=random]"); });
const inbox = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:inbox:plays") || "[]"));
if (inbox.filter((e) => e.gameName === "Rebel Princess" && e.lowWins).length !== 2) fail("Partien nicht im Eingangskorb");
await browser.close(); server.close();
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("OK — Prinzessinnenball: keine JS-Fehler, Bot- und UI-Partien vollständig.");
