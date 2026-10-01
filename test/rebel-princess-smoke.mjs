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
  for (const n of [3, 4, 5, 6]) for (let seed = 1; seed <= 20; seed++) {
    const r = window.__rp.simulate(n, seed * 7727 + n);
    const S = window.__rp.state(); const bad = [];
    if (!r.final) bad.push("keine Endabrechnung");
    if (S.history.length !== 5) bad.push("Runden " + S.history.length);
    const won = S.players.flatMap((p) => p.won);
    const expected = n === 5 ? 45 : 48;
    if (won.length !== expected || new Set(won).size !== expected) bad.push(`Karten ${won.length}/${new Set(won).size}`);
    if (S.players.some((p) => p.hand.length)) bad.push("Handkarten übrig");
    const sum = S.players.map((p, i) => S.history.reduce((s, h) => s + h.pts[i], 0));
    if (sum.some((x, i) => x !== S.players[i].total)) bad.push("Summen");
    out.push({ n, totals: S.players.map((p) => p.total), bad });
  }
  window.__rp.reset();
  return out;
});
const bad = sim.filter((s) => s.bad.length);
if (bad.length) fail("Simulationen: " + JSON.stringify(bad.slice(0, 3)));
const avg = (a) => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
for (const n of [3, 4, 5, 6]) { const s = sim.filter((x) => x.n === n); console.log(`Bots ${n}P: Ø Sieger ${avg(s.map((x) => Math.min(...x.totals)))}, Ø Anträge ${avg(s.flatMap((x) => x.totals))}`); }

await page.click("[data-a=bots][data-n='3']");
await page.click("text=Zum Ball");
// Eine Prinzessin mit Ausspiel-Fähigkeit wählen, damit der Schalter getestet wird
const playable = ["schnee", "dorn", "meer", "rapunzel", "rosen"];
const ks = await page.locator("[data-a=pick]").evaluateAll((els) => els.map((e) => e.dataset.k));
const k = ks.find((x) => playable.includes(x)) || ks[0];
await page.click(`[data-a=pick][data-k=${k}]`);
if (shots) await page.screenshot({ path: `${shots}/rp-2-princess.png` });
await page.click("[data-a=pickok]");
await page.click("[data-a=fast]").catch(() => {});
let plays = 0, passes = 0, powers = 0, guard = 0, shot = false;
while (guard++ < 3000) {
  if (await page.locator("text=Neue Partie").count()) break;
  if (await page.locator("[data-a=nextround]").count()) { await page.click("[data-a=nextround]"); continue; }
  if (await page.locator("[data-a=ascheyes]").count()) { await page.click("[data-a=ascheyes]"); continue; }
  if (await page.locator("[data-a=dopass]").count()) {
    const need = await page.evaluate(() => window.__rp.state().rules[window.__rp.state().round - 1] === "rechts3" ? 3 : 2);
    for (let i = 0; i < need; i++) await page.locator(".cards .card:not(.sel)").first().click();
    await page.click("[data-a=dopass]"); passes++; continue;
  }
  if (await page.locator("[data-a=play]").count()) {
    if (plays % 5 === 2 && (await page.locator("[data-a=power]:not(.on)").count())) { await page.click("[data-a=power]"); powers++; }
    await page.locator(".cards .card.ok").first().click();
    await page.click("[data-a=play]"); plays++;
    if (!shot && shots && plays === 3) { await page.waitForTimeout(300); await page.screenshot({ path: `${shots}/rp-3-game.png`, fullPage: true }); shot = true; }
    continue;
  }
  await page.waitForTimeout(100);
}
if (!(await page.locator("text=Neue Partie").count())) fail(`UI-Partie nicht beendet (guard ${guard})`);
if (plays !== 60) fail(`Erwartet 60 eigene Karten, waren ${plays}`);
console.log(`UI-Partie: ${plays} Karten gespielt, ${passes}× weitergegeben, ${powers}× Fähigkeit angeschaltet.`);
const inbox = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:inbox:plays") || "[]"));
if (!inbox.some((e) => e.gameName === "Rebel Princess" && e.lowWins)) fail("Partie nicht im Eingangskorb");
if (shots) await page.screenshot({ path: `${shots}/rp-4-end.png`, fullPage: true });
await browser.close(); server.close();
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("OK — Prinzessinnenball: keine JS-Fehler, Bot- und UI-Partien vollständig.");
