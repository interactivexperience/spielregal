// Spielt die Lernspiele (Tutorials) aller drei Browser-Spiele komplett durch:
// klickt jeweils „Weiter“ oder das markierte Element, bis „Echtes Spiel
// starten“ erscheint. Prüft auf JS-Fehler, dass jeder Schritt erreichbar ist,
// und dass eine vorher gespeicherte echte Partie das Lernspiel überlebt.
// Aufruf (aus test/): node tutorials.mjs [--shots <ordner>]
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
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
const GAMES = [
  { dir: "grand-austria-hotel", key: "grand-hotel-wien-v1", start: "Hotel eröffnen" },
  { dir: "three-sisters", key: "drei-schwestern-v1", start: "Garten anlegen" },
  { dir: "rebel-princess", key: "prinzessinnenball-v1", start: "Zum Ball" },
];
const errors = [];
for (const g of GAMES) {
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  await page.route("**/fonts.googleapis.com/**", (r) => r.fulfill({ body: "", contentType: "text/css" }));
  await page.route("**/fonts.gstatic.com/**", (r) => r.abort());
  page.on("pageerror", (e) => errors.push(`${g.dir} pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !/fonts\.gstatic/.test(m.text())) errors.push(`${g.dir} console.error: ${m.text()}`); });
  await page.goto(base + g.dir + "/", { waitUntil: "load" });
  // eine echte Partie als Spielstand vormerken
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ v: 1, screen: "game", round: 3, marker: "echte-partie" })), g.key);
  await page.reload();
  await page.click("[data-a=tutorial]");
  let guard = 0, maxStep = 0, total = 0, blocked = 0;
  while (guard++ < 400) {
    const info = await page.evaluate(() => { const c = document.querySelector(".coach .cstep"); return c ? c.textContent : null; });
    if (info) { const m = info.match(/(\d+)\/(\d+)/); maxStep = Math.max(maxStep, +m[1]); total = +m[2]; }
    if (await page.locator("[data-a=tutend]").count()) {
      if (shots) await page.screenshot({ path: `${shots}/tut-${g.dir}-end.png` });
      await page.click("[data-a=tutend]"); break;
    }
    if (await page.locator("[data-a=tutnext]").count()) {
      if (shots && maxStep <= 2) await page.screenshot({ path: `${shots}/tut-${g.dir}-${maxStep}.png` });
      await page.click("[data-a=tutnext]"); continue;
    }
    const hl = page.locator(".tut-hl");
    if (await hl.count()) {
      if (shots && [4, 6, 8].includes(maxStep)) await page.screenshot({ path: `${shots}/tut-${g.dir}-${maxStep}.png` });
      await hl.first().click({ force: true });
      if (await page.locator(".toast:has-text('Folge dem markierten')").count()) blocked++;
      await page.waitForTimeout(60);
      continue;
    }
    await page.waitForTimeout(150);
  }
  const back = await page.locator(`text=${g.start}`).count();
  const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), g.key);
  const inbox = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:inbox:plays") || "[]"));
  console.log(`${g.dir}: Schritt ${maxStep}/${total}, ${guard} Klicks, ${blocked}× blockiert`);
  if (maxStep !== total || !total) errors.push(`${g.dir}: Lernspiel nicht bis zum Ende (${maxStep}/${total})`);
  if (!back) errors.push(`${g.dir}: nach dem Lernspiel kein Startbildschirm`);
  if (!saved || saved.marker !== "echte-partie") errors.push(`${g.dir}: gespeicherte Partie wurde überschrieben`);
  if (inbox.length) errors.push(`${g.dir}: Lernspiel wurde in Spielregal eingetragen`);
  if (blocked) errors.push(`${g.dir}: markiertes Element war gesperrt (${blocked}×)`);
  await page.context().close();
}
await browser.close(); server.close();
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("OK — alle drei Lernspiele laufen vollständig durch.");
