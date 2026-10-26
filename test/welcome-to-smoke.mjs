// Smoke-Test für welcome-to/index.html („Siedlerhain“, Solo-Flip-&-Write im Naive-Stil).
// 1. Lädt Startseite und Spiel im iPhone-Format, prüft auf JS-Fehler und 404er.
// 2. Spielt per Klick komplette Partien (Kombi wählen, Zeitarbeit, Feld, Zaun, Makler, Doppelhaus, Ablehnen).
// 3. Prüft Speichern/Fortsetzen (?resume=1), Spielstand-Kennung fürs Dashboard (welcome-to:save),
//    Eintrag im Spielregal-Eingangskorb, Menü, Spielregeln, Lernspiel und Info-Blase.
// Aufruf (aus test/): node welcome-to-smoke.mjs
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
const url = `http://127.0.0.1:${server.address().port}/welcome-to/`;
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { try { if (!sessionStorage.getItem("s")) { localStorage.setItem("spielregal:players", JSON.stringify([{ id: "p", name: "Mi" }])); sessionStorage.setItem("s", "1"); } } catch (_) {} });
const page = await ctx.newPage();
const errors = [];
await page.route("**/fonts.googleapis.com/**", (r) => r.fulfill({ body: "", contentType: "text/css" }));
await page.route("**/fonts.gstatic.com/**", (r) => r.abort());
page.on("response", (r) => { if (r.status() === 404) errors.push("404: " + r.url()); });
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push("console: " + m.text()); });
let fehler = 0;
const check = (ok, msg) => { if (!ok) { console.log("FEHLER: " + msg); fehler++; } };
const cnt = (s) => page.locator(s).count();
const tap = (s) => page.locator(s).first().dispatchEvent("click"); // dispatchEvent: Wackel-Animationen stören Playwrights Stabilitätsprüfung
const pts = async () => +(await page.locator(".pill.pts b").innerText());

// Eine Partie per Klick zu Ende spielen
async function play(maxSteps = 600, quickRefuse = false) {
  for (let i = 0; i < maxSteps; i++) {
    if (await cnt(".result")) return true;
    if (await cnt(".combo")) {
      const alive = await page.locator(".combo:not([disabled])").count();
      if (!alive || quickRefuse || i % 17 === 5) {
        await tap('[data-a=refuse]'); if (await cnt(".btn.arm")) await tap('[data-a=refuse]');
      } else await tap(".combo:not([disabled])");
    } else if (await cnt(".chip[data-a=adj]")) await tap(".chip[data-a=adj]:not([disabled])");
    else if (await cnt(".house.ok")) await tap(".house.ok");
    else if (await cnt(".gap")) await tap(".gap");
    else if (await cnt(".chip[data-a=size]:not([disabled])")) await tap(".chip[data-a=size]:not([disabled])");
    else if (await cnt("[data-a=skip]")) await tap("[data-a=skip]");
    else await page.waitForTimeout(20);
  }
  return false;
}

try {
  await page.goto(url, { waitUntil: "load" });
  check(await cnt(".start") === 1 && await cnt("#coverArt") === 1, "Startseite oder Cover fehlt");
  check(await cnt("[data-a=start]") === 1 && await cnt("[data-a=tut]") === 1, "Start-/Lernspiel-Knopf fehlt");
  // Spielregeln von der Startseite
  await tap("[data-a=rules]");
  check((await page.locator(".sheet").innerText()).includes("Ende und Wertung"), "Spielregeln fehlen");
  await tap(".xbtn");

  // Partie 1: spielen bis zum Ende
  await tap("[data-a=start]");
  check(await cnt(".street") === 3 && await cnt(".plan") === 3 && await cnt(".combo") === 3, "Spielfeld unvollständig");
  check((await page.evaluate(() => localStorage.getItem("welcome-to:save"))) !== null, "kein Spielstand nach Start");
  // Info-Blase per langem Drücken
  const plan = page.locator(".plan").first(); const bb = await plan.boundingBox();
  await page.mouse.move(bb.x + 20, bb.y + 20); await page.mouse.down(); await page.waitForTimeout(600);
  check(await cnt(".bub") === 1, "Info-Blase erscheint nicht"); await page.mouse.up();
  // Menü
  await tap("[data-a=menu]"); check(await cnt("[data-a=saveleave]") === 1, "Menü unvollständig"); await tap(".xbtn");

  // ein paar Züge, dann Reload mit ?resume=1
  for (let i = 0; i < 12; i++) { if (await cnt(".combo:not([disabled])")) await tap(".combo:not([disabled])"); else if (await cnt(".chip[data-a=adj]")) await tap(".chip[data-a=adj]:not([disabled])"); else if (await cnt(".house.ok")) await tap(".house.ok"); else if (await cnt(".gap")) await tap(".gap"); else if (await cnt(".chip[data-a=size]:not([disabled])")) await tap(".chip[data-a=size]:not([disabled])"); else if (await cnt("[data-a=skip]")) await tap("[data-a=skip]"); }
  const sv = await page.evaluate(() => JSON.parse(localStorage.getItem("welcome-to:save") || "null"));
  check(sv && sv.screen === "game", "Spielstand ohne screen:'game' (Dashboard-Kennung)");
  const filled = await cnt(".house.filled");
  await page.goto(url + "?resume=1", { waitUntil: "load" });
  check(await cnt(".street") === 3 && await cnt(".house.filled") === filled, "Fortsetzen stellt Stand nicht wieder her");
  const rb = await page.locator(".pill b").first().innerText();
  check(+rb >= 1, "Rundenzähler fehlt");

  check(await play(), "Partie 1 endet nicht");
  check(await cnt(".result h2") === 1, "Ergebnis fehlt");
  const inbox = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:inbox:plays") || "[]"));
  check(inbox.length === 1 && inbox[0].source === "welcome-to" && inbox[0].human === "Mi" && inbox[0].solo === true && inbox[0].bggId === "233867", "Eingangskorb-Eintrag falsch: " + JSON.stringify(inbox));
  const shown = +(await page.locator(".result h2").innerText()).split(" ")[0];
  check(inbox[0] && inbox[0].results[0].total === shown, "gemeldete Punkte ≠ angezeigte Punkte");

  // Neue Partie; schnell durch dreimaliges Ablehnen beenden
  await tap(".result [data-a=newyes]");
  check(await cnt(".result") === 0 && await cnt(".combo") === 3, "Neue Partie startet nicht");
  check(await play(60, true), "Dreimal ablehnen beendet nicht");
  check((await page.locator(".result .why").innerText()).includes("Ablehnung") || (await page.locator(".result .why").innerText()).includes("abgelehnt"), "Endgrund Ablehnung fehlt");
  const inbox2 = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:inbox:plays") || "[]"));
  check(inbox2.length === 2 && inbox2[1].id !== inbox2[0].id, "zweite Partie nicht einzeln gemeldet");

  // weitere Partien als Dauertest
  for (let g = 0; g < 4; g++) { await tap(".result [data-a=newyes]"); check(await play(), "Dauertest-Partie " + g + " endet nicht"); }

  // Lernspiel
  await page.goto(url, { waitUntil: "load" });
  await tap("[data-a=tut]");
  check(await cnt(".coach") === 1, "Lernspiel-Coach fehlt");
  const before = await page.evaluate(() => localStorage.getItem("welcome-to:save"));
  for (let i = 0; i < 60 && await cnt(".coach"); i++) {
    if (await cnt(".coach [data-a=tutnext]")) await tap(".coach [data-a=tutnext]");
    else if (await cnt(".coach [data-a=tutquit]")) { await tap(".coach [data-a=tutquit]"); break; }
    else if (await cnt(".combo.tut-hl")) await tap(".combo.tut-hl");
    else if (await cnt(".house.ok")) await tap(".house.ok");
    else if (await cnt(".gap")) await tap(".gap");
    else if (await cnt("[data-a=skip]")) await tap("[data-a=skip]");
    else await page.waitForTimeout(20);
  }
  check(await cnt(".coach") === 0 && await cnt(".start") === 1, "Lernspiel kommt nicht bis zum Ende");
  check((await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:inbox:plays") || "[]"))).length === 6, "Lernspiel hat Partie gemeldet oder Zähler falsch");
  check((await page.evaluate(() => localStorage.getItem("welcome-to:save"))) === before, "Lernspiel hat den Spielstand verändert");
} catch (e) { console.log("FEHLER: " + e.message); fehler++; }
for (const e of errors) { console.log("FEHLER: " + e); fehler++; }
await browser.close(); server.close();
if (fehler) process.exit(1);
console.log("OK — Siedlerhain: Start, Spielen, Fortsetzen, Meldung, Lernspiel.");
