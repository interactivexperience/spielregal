// Test für das Lernspiel in glut/index.html („Ottilie“, eine geführte Runde).
// Folgt Schritt für Schritt dem Coach: „Weiter“ tippen, sonst das hervorgehobene Element (.tut-hl) antippen.
// Prüft: Ablauf bis „Echtes Spiel starten“, gesperrte Aktionen (Hinweis), Ergebnis der Runde (7 Ruhm, Runde 2, Lotte beginnt),
// Lernspiel wird weder gespeichert (glut:save) noch gemeldet (Eingangskorb), „Lernspiel beenden“ führt zurück zur Startseite,
// „Echtes Spiel starten“ beginnt eine normale Partie ohne Coach.
// Aufruf (aus test/): node glut-tutorial.mjs
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
const url = `http://127.0.0.1:${server.address().port}/glut/`;
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { try { localStorage.setItem("spielregal:botFast", "1"); } catch (_) {} });
const page = await ctx.newPage();
const errors = [];
await page.route("**/fonts.googleapis.com/**", (r) => r.fulfill({ body: "", contentType: "text/css" }));
await page.route("**/fonts.gstatic.com/**", (r) => r.abort());
page.on("response", (r) => { if (r.status() === 404) errors.push("404: " + r.url()); });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`); });
let fehler = 0;
const check = (ok, msg) => { if (!ok) { console.log("FEHLER: " + msg); fehler++; } };
const cnt = async (s) => await page.locator(s).count();

try {
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate(() => { try { localStorage.removeItem("glut:save"); localStorage.removeItem("spielregal:inbox:plays"); } catch (_) {} });
  await page.goto(url, { waitUntil: "load" });
  check(await cnt("[data-a=tutor]") === 1, "Lernspiel-Knopf fehlt auf der Startseite");

  // --- 1. Durchlauf: dem Coach folgen ---
  await page.click("[data-a=tutor]");
  check(await cnt("#coach") === 1, "Coach erscheint nicht");
  let it = 0, steps = new Set(), blocked = false, last = null;
  while (it++ < 500) {
    const info = await page.evaluate(() => ({ i: TUT ? TUT.i : -1, n: TUT_STEPS.length }));
    if (info.i < 0) break;
    steps.add(info.i);
    if (await cnt(".coach [data-a=tutend]")) { last = info; break; }
    // einmal eine nicht erlaubte Aktion versuchen (Schritt „Würfel wählen“ erlaubt nur die 6)
    if (!blocked && info.i === 4) {
      await page.click(".dicerow .die[data-i='1']");
      check(await cnt(".toast") === 1, "Gesperrte Aktion zeigt keinen Hinweis");
      check(await page.evaluate(() => U.sel.length) === 0, "Gesperrte Aktion hat trotzdem etwas ausgewählt");
      blocked = true; continue;
    }
    if (await cnt(".coach [data-a=tutnext]")) { await page.click(".coach [data-a=tutnext]"); continue; }
    const hl = page.locator(".tut-hl:not(.sel)");
    if (await hl.count()) { await hl.first().click(); await page.waitForTimeout(80); continue; }
    await page.waitForTimeout(120); // Lotte ist dran
  }
  check(last && last.i === last.n - 1, "Lernspiel kam nicht bis zum letzten Schritt (Schritt " + [...steps].pop() + ")");
  check(steps.size === (last ? last.n : -1), `nicht alle Schritte durchlaufen: ${steps.size}/${last ? last.n : "?"}`);
  const st = await page.evaluate(() => ({ ruhm: S.players[0].ruhm, round: S.round, first: S.first, pieces: S.players[0].pieces.length, duk: S.players[0].res.duk, holz: S.players[0].res.holz, tut: S.tut }));
  check(st.ruhm === 7, `Ruhm nach dem Auftrag ist ${st.ruhm}, erwartet 7`);
  check(st.round === 2 && st.first === 1, `Neue Runde: Runde ${st.round}, Beginner ${st.first} (erwartet 2 und Lotte)`);
  check(st.pieces === 0 && st.holz === 0, `Krug wurde nicht geliefert/angefacht (Stücke ${st.pieces}, Holz ${st.holz})`);
  check(await page.evaluate(() => !localStorage.getItem("glut:save")), "Lernspiel wurde gespeichert");
  check(await page.evaluate(() => !localStorage.getItem("spielregal:inbox:plays")), "Lernspiel wurde gemeldet");
  check(await cnt(".foot [data-a=undo]") === 0, "Lernspiel bietet Zug rückgängig an");

  // --- 2. Echtes Spiel starten ---
  await page.click(".coach [data-a=tutend]");
  check(await cnt("#coach") === 0 && await page.evaluate(() => S && !S.tut && S.round === 1), "„Echtes Spiel starten“ beginnt keine normale Partie");

  // --- 3. Lernspiel beenden über Menü und Coach ---
  await page.click("[data-a=menu]"); await page.click(".sheet [data-a=restart]").catch(() => {});
  page.once("dialog", (d) => d.accept());
  await page.click(".sheet [data-a=restart]").catch(() => {});
  await page.waitForTimeout(150);
  if (!(await cnt("[data-a=tutor]"))) { await page.goto(url, { waitUntil: "load" }); }
  await page.click("[data-a=tutor]");
  await page.click("[data-a=menu]");
  check(await cnt(".sheet [data-a=tutquit]") === 1 && await cnt(".sheet [data-a=restart]") === 0, "Menü im Lernspiel falsch (Lernspiel beenden / kein Neustart erwartet)");
  await page.click(".sheet .xbtn");
  await page.click(".coach .cquit");
  check(await cnt("[data-a=tutor]") === 1 && await page.evaluate(() => S === null && TUT === null), "Lernspiel beenden führt nicht zur Startseite");
} catch (e) { console.log("Test-Abbruch:", e.message); fehler++; }
for (const e of errors) { console.log("FEHLER: " + e); fehler++; }
await browser.close(); server.close();
if (fehler) { console.log(`\n${fehler} Fehler.`); process.exit(1); }
console.log("OK – Glut-Lernspiel: alle Schritte durchlaufen, Ergebnis stimmt, nichts gespeichert oder gemeldet.");
