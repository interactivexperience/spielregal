// Smoke-Test für saum/index.html („Saum“, eigenes Spielkonzept).
// 1. Lädt die Seite im iPhone-Format und prüft auf JS-Fehler.
// 2. Spielt per Klick eine komplette Partie gegen einen Bot: Startplättchen-Draft,
//    Plättchen bauen / unterschieben / nicht bauen, Aktionen, Ausruhen mit Karte, Abschluss.
// 3. Prüft Spielende, Spielstand-Kennung fürs Dashboard und den Eintrag im Spielregal-Eingangskorb.
// Aufruf (aus test/): node saum-smoke.mjs
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  let body; try { body = readFileSync(path.join(repoRoot, p)); } catch { res.writeHead(404); res.end("nf"); return; }
  res.writeHead(200, p.endsWith(".html") ? { "content-type": "text/html; charset=utf-8" } : {}); res.end(body);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/saum/`;
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
const errors = [];
await page.route("**/fonts.googleapis.com/**", (r) => r.fulfill({ body: "", contentType: "text/css" }));
await page.route("**/fonts.gstatic.com/**", (r) => r.abort());
page.on("response", (r) => { if (r.status() === 404) errors.push("404: " + r.url()); });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`); });
let fehler = 0;
const check = (ok, msg) => { if (!ok) { console.log("FEHLER: " + msg); fehler++; } };
const en = (s) => page.locator(s + ":not([disabled])");
const cnt = async (s) => await en(s).count();

try {
  await page.goto(url, { waitUntil: "load" });
  check(await page.locator('a.leave[href="../"]').count() === 1, "Beenden-Knopf fehlt auf dem Startbildschirm");
  await page.click("[data-a=start][data-n='1']");
  let it = 0, drafts = 0, builds = 0, tucks = 0, takes = 0, sawGame = false;
  while (it++ < 2500) {
    if (await cnt("[data-a=intro-ok]")) { await page.click("[data-a=intro-ok]"); continue; }
    const st = await page.evaluate(() => ({ over: S.over, cur: S.cur, phase: U.phase, sel: !!U.sel, mode: U.mode, draft: S.draft ? S.draft.order[S.draft.step] : null }));
    if (st.over) break;
    if (!sawGame && st.phase === "land") sawGame = (await page.evaluate(() => JSON.parse(localStorage.getItem("saum:save") || "{}").screen)) === "game";
    if (st.phase === "draft") {
      if (st.draft !== 0) { await page.waitForTimeout(120); continue; }
      if (!st.sel) { await page.locator(".card[data-a=gpick]").first().click(); continue; }
      await en("[data-a=gplace]").first().click(); drafts++; continue;
    }
    if (st.cur !== 0) { await page.waitForTimeout(120); continue; }
    if (st.mode === "tuck") { const t = page.locator(".tile.pick"); if (await t.count()) { await t.nth(it % (await t.count())).click(); tucks++; } else await page.click("[data-a=cancel]"); continue; }
    if (st.mode === "take") { await page.locator(".card[data-a=market]").first().click(); takes++; continue; }
    if (st.phase === "land") {
      if (!st.sel) { const m = page.locator(".card[data-a=market]:not(.off)"), n = await m.count(), h = page.locator(".card[data-a=hand]"), hn = await h.count();
        if (n && it % 2) await m.nth(it % n).click(); else if (hn) await h.nth(it % hn).click(); else if (n) await m.first().click(); else await page.click("[data-a=noland]"); continue; }
      if (await cnt("[data-a=build]")) { await en("[data-a=build]").first().click(); builds++; continue; }
      if (it % 3 && await cnt("[data-a=tuckmode]")) { await page.click("[data-a=tuckmode]"); continue; }
      if (await cnt("[data-a=brache]")) { await page.click("[data-a=brache]"); continue; }
      await page.click("[data-a=unsel]"); continue;
    }
    if (st.phase === "tat") {
      if (!st.sel && it % 5 === 0 && await cnt("[data-a=takemode]")) { await page.click("[data-a=takemode]"); continue; }
      if (!st.sel) { const h = page.locator(".card[data-a=hand]"), hn = await h.count(); if (hn) await h.nth(it % hn).click(); else await page.click("[data-a=ruhe]"); continue; }
      if (await cnt("[data-a=act]")) { const hl = page.locator("[data-a=act][data-hl]:not([disabled])"); if (await hl.count()) await hl.first().click(); else await en("[data-a=act]").last().click(); continue; }
      if (await cnt("[data-a=play]")) { await page.click("[data-a=play]"); continue; }
      await page.click("[data-a=unsel]"); await page.click("[data-a=ruhe]"); continue;
    }
    if (st.phase === "ende") {
      if (st.sel) { if (await cnt("[data-a=tuckmode]")) { await page.click("[data-a=tuckmode]"); continue; } if (await cnt("[data-a=buy]")) { await page.click("[data-a=buy]"); continue; } await page.click("[data-a=unsel]"); await page.click("[data-a=endturn]"); continue; }
      const up = await page.evaluate(() => ({ b: U.bought }));
      if (it % 2) { const h = page.locator(".card[data-a=hand]:not(.off)"); if (await h.count()) { await h.first().click(); continue; } }
      if (!up.b && it % 3) { const m = page.locator(".card[data-a=market]:not(.off)"); if (await m.count()) { await m.first().click(); continue; } }
      if (await cnt("[data-a=endturn]")) await page.click("[data-a=endturn]");
      continue;
    }
    await page.waitForTimeout(100);
  }
  const fin = await page.evaluate(() => ({ over: S.over, rounds: S.round + 1, scores: S.players.map((p) => finalScore(p)) }));
  const inbox = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:inbox:plays") || "[]"));
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem("saum:save") || "{}"));
  check(fin.over, "Partie nicht beendet nach " + it + " Schritten");
  check(drafts === 2, "Draft: " + drafts + " statt 2 Startplättchen gewählt");
  check(sawGame, "Spielstand trägt während der Partie nicht screen: 'game' (Dashboard-Hinweis „Partie läuft“)");
  check(save.screen !== "game", "Spielstand meldet nach Spielende noch eine laufende Partie");
  const e = inbox.find((x) => x.source === "saum");
  check(e && e.gameName === "Saum" && e.results.length === 2 && e.results.some((r) => r.bot) && Array.isArray(e.winners), "Eingangskorb-Eintrag fehlt oder unvollständig: " + JSON.stringify(e));
  check(await page.locator('a[href="../"]:has-text("Zum Spielregal")').count() === 1, "Link „Zum Spielregal“ fehlt auf dem Endbildschirm");
  console.log(`Partie: ${fin.rounds} Runden, Punkte ${fin.scores.join(" / ")}, gebaut ${builds}, untergeschoben ${tucks}, Karte beim Ausruhen ${takes}`);
} catch (e) { console.log("FEHLER: " + e.message); fehler++; }
await browser.close(); server.close();
for (const e of errors) { console.log("FEHLER: " + e); fehler++; }
if (fehler) process.exit(1);
console.log("OK — Saum: Draft, komplette Partie, Spielende und Spielregal-Meldung funktionieren.");
