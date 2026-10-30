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
const url = `http://127.0.0.1:${server.address().port}/welcome-to/${process.env.WT_FILE || ""}`;
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

// Ein Schritt der Partie per Klick
async function step(i) {
  if (await cnt("[data-a=reshufno]")) { await tap(i % 2 ? "[data-a=reshufyes]" : "[data-a=reshufno]"); return; }
  if (await cnt(".kard[data-a=pick]:not([disabled])")) { await tap(".kard[data-a=pick]:not([disabled])"); return; }
  if (await cnt(".kard[data-a=pickeff]:not([disabled])")) { await tap(i % 5 === 0 ? "[data-a=noeff]" : ".kard[data-a=pickeff]:not([disabled])"); return; }
  if (await cnt("[data-a=refuse]")) { await tap("[data-a=refuse]"); return; }
  if (await cnt(".chip[data-a=adj]:not([disabled])")) { await tap(".chip[data-a=adj]:not([disabled])"); return; }
  if (await cnt(".house.ok")) { await tap(".house.ok"); return; }
  if (await cnt(".gap")) { await tap(".gap"); return; }
  if (await cnt(".chip[data-a=size]:not([disabled])")) { await tap(".chip[data-a=size]:not([disabled])"); return; }
  if (await cnt("[data-a=skip]")) { await tap("[data-a=skip]"); return; }
  await page.waitForTimeout(20);
}
async function play(maxSteps = 1500) {
  for (let i = 0; i < maxSteps; i++) { if (await cnt(".result")) return true; await step(i); }
  return false;
}

try {
  await page.goto(url, { waitUntil: "load" });
  check(await cnt(".start") === 1 && await cnt("#coverArt") === 1, "Startseite oder Cover fehlt");
  check(await cnt("[data-a=start]") === 2 && await cnt("[data-a=tut]") === 1, "Start-/Lernspiel-Knopf fehlt");
  // Spielregeln von der Startseite
  await tap("[data-a=rules]");
  check((await page.locator(".sheet").innerText()).includes("Ende und Wertung"), "Spielregeln fehlen");
  await tap(".xbtn");

  // Partie 1: spielen bis zum Ende
  await tap("[data-a=start][data-mode=solo]");
  check(await cnt(".street") === 3 && await cnt(".plan") === 3 && await cnt(".kard") === 3, "Spielfeld unvollständig");
  check((await page.evaluate(() => localStorage.getItem("welcome-to:save"))) !== null, "kein Spielstand nach Start");
  // Info-Blase per langem Drücken
  const plan = page.locator(".plan").first(); const bb = await plan.boundingBox();
  await page.mouse.move(bb.x + 20, bb.y + 20); await page.mouse.down(); await page.waitForTimeout(600);
  check(await cnt(".bub") === 1, "Info-Blase erscheint nicht"); await page.mouse.up();
  // Menü
  await tap("[data-a=menu]"); check(await cnt("[data-a=saveleave]") === 1, "Menü unvollständig"); await tap(".xbtn");

  for (let i = 0; i < 14; i++) await step(i);
  const sv = await page.evaluate(() => JSON.parse(localStorage.getItem("welcome-to:save") || "null"));
  check(sv && sv.screen === "game", "Spielstand ohne screen:'game' (Dashboard-Kennung)");
  const filled = await cnt(".house.full");
  await page.goto(url + "?resume=1", { waitUntil: "load" });
  check(await cnt(".street") === 3 && await cnt(".house.full") === filled, "Fortsetzen stellt Stand nicht wieder her");
  const rb = await page.locator(".pill b").first().innerText();
  check(parseInt(rb, 10) >= 1, "Rundenzähler fehlt");

  check(await play(), "Partie 1 endet nicht");
  check((await page.locator(".result .why").innerText()).length > 10, "Endgrund fehlt");
  check(await cnt(".result h2") === 1, "Ergebnis fehlt");
  const inbox = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:inbox:plays") || "[]"));
  check(inbox.length === 1 && inbox[0].source === "welcome-to" && inbox[0].human === "Mi" && inbox[0].solo === true && Array.isArray(inbox[0].winners) && inbox[0].winners.length === 0 && inbox[0].bggId === "233867", "Eingangskorb-Eintrag falsch: " + JSON.stringify(inbox));
  const shown = +(await page.locator(".result h2").innerText()).split(" ")[0];
  check(inbox[0] && inbox[0].results[0].total === shown, "gemeldete Punkte ≠ angezeigte Punkte");

  // Neue Partie, dann Basisspiel (drei Kombinationen, Neumischen), dann Dauertest
  await tap(".result [data-a=newsame]");
  check(await cnt(".result") === 0 && await cnt(".kard") === 3, "Neue Partie startet nicht");
  check(await play(), "Partie 2 endet nicht");
  const inbox2 = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:inbox:plays") || "[]"));
  check(inbox2.length === 2 && inbox2[1].id !== inbox2[0].id, "zweite Partie nicht einzeln gemeldet");
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate(() => localStorage.removeItem("welcome-to:save"));
  await page.goto(url, { waitUntil: "load" });
  await tap("[data-a=start][data-mode=base]");
  check(await cnt(".kard[data-a=pick]") === 3 && await cnt(".kard[data-a=pickeff]") === 0, "Basisspiel zeigt keine drei Kombinationen");
  check(await play(), "Basisspiel endet nicht");
  for (let g = 0; g < 3; g++) { await tap(".result [data-a=newsame]"); check(await play(), "Dauertest-Partie " + g + " endet nicht"); }
  check((await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:inbox:plays") || "[]"))).length === 6, "Meldungen nach Dauertest falsch");

  // Lernspiel
  await page.goto(url, { waitUntil: "load" });
  await tap("[data-a=tut]");
  check(await cnt(".coach") === 1, "Lernspiel-Coach fehlt");
  const before = await page.evaluate(() => localStorage.getItem("welcome-to:save"));
  for (let i = 0; i < 80 && await cnt(".coach"); i++) {
    if (await cnt(".coach [data-a=tutnext]")) await tap(".coach [data-a=tutnext]");
    else if (await cnt(".coach [data-a=tutquit]")) { await tap(".coach [data-a=tutquit]"); break; }
    else if (await cnt(".tut-hl")) await tap(".tut-hl");
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
