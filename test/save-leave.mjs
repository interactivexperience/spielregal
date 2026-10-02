// Prüft „Speichern & verlassen“ in allen drei Browser-Spielen: Partie starten,
// Pause tippen, Startbildschirm zeigt die gespeicherte Partie mit Zeitpunkt,
// nach Neuladen setzt „Fortsetzen“ denselben Stand fort; „Neue Partie“ fragt
// nach und überschreibt bei Abbrechen nichts; „verwerfen“ löscht den Stand.
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
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
const GAMES = [
  { dir: "grand-austria-hotel", hook: "__ghw", start: "Hotel eröffnen", ready: ".board" },
  { dir: "three-sisters", hook: "__ts", start: "Garten anlegen", ready: ".rondel" },
  { dir: "rebel-princess", hook: "__rp", start: "Zum Ball", ready: "[data-a=pick]" },
  { dir: "countryside", hook: "__lg", start: "Landgut übernehmen", ready: ".sheet" },
];
const errors = [];
const check = (ok, m) => { if (!ok) errors.push(m); };
for (const g of GAMES) {
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.route("**/fonts.googleapis.com/**", (r) => r.fulfill({ body: "", contentType: "text/css" }));
  await page.route("**/fonts.gstatic.com/**", (r) => r.abort());
  page.on("pageerror", (e) => errors.push(`${g.dir} pageerror: ${e.message}`));
  let dialogAnswer = false, dialogs = 0;
  page.on("dialog", (d) => { dialogs++; dialogAnswer ? d.accept() : d.dismiss(); });
  await page.goto(base + g.dir + "/", { waitUntil: "load" });
  await page.click(`text=${g.start}`);
  await page.waitForSelector(g.ready);
  if (g.dir === "grand-austria-hotel") {
    for (let i = 0; i < 6 && (await page.locator(".sheet [data-a=dpick]").count()); i++) { await page.locator(".sheet [data-a=dpick]").first().click(); await page.waitForTimeout(80); }
    if (await page.locator("[data-a=rpok]").count()) { for (const i of [0, 1, 2]) await page.locator(`.sheet [data-a=rpsel][data-i="${i}"]`).click({ force: true }); await page.click("[data-a=rpok]"); }
  }
  if (g.dir === "rebel-princess") { await page.locator("[data-a=pick]").first().click(); await page.click("[data-a=pickok]"); }
  if (g.dir === "countryside") await page.click(".sheet [data-a=close]");
  await page.waitForTimeout(400);
  const before = await page.evaluate((h) => { const S = window[h].state(); return JSON.stringify({ id: S.id, round: S.round }); }, g.hook);
  // offene Auswahl ausblenden (Prinzessinnenball: Rundenkarte mit Abfrage), dann Pause in der Kopfzeile
  if (await page.locator(".ov [data-a=askhide]").count()) await page.click(".ov [data-a=askhide]");
  await page.click(".top [data-a=menu]");
  await page.click(".sheet [data-a=leave]");
  check(await page.locator("[data-a=resume]").count() === 1, `${g.dir}: kein Fortsetzen-Knopf nach Verlassen`);
  check(await page.locator("text=Gespeichert heute").count() === 1, `${g.dir}: Zeitpunkt der Speicherung fehlt`);
  check(await page.locator("text=Partie gespeichert").count() === 1, `${g.dir}: Hinweis nach dem Verlassen fehlt`);
  // Neuladen und fortsetzen
  await page.reload();
  await page.click("[data-a=resume]");
  await page.waitForTimeout(200);
  const after = await page.evaluate((h) => { const S = window[h].state(); return S ? JSON.stringify({ id: S.id, round: S.round }) : null; }, g.hook);
  check(after === before, `${g.dir}: Stand nach Fortsetzen anders (${before} → ${after})`);
  // Über das Menü verlassen (Landgut: offenen Startdialog vorher wegklicken)
  if (g.dir === "countryside") await page.click(".sheet [data-a=close]");
  await page.click(".top [data-a=menu]");
  check(await page.locator(".sheet [data-a=leave]").count() === 1, `${g.dir}: „Speichern & verlassen“ fehlt im Menü`);
  check(await page.locator(".sheet a[href='../']").count() === 1, `${g.dir}: „Speichern & zum Spielregal“ fehlt im Menü`);
  await page.click(".sheet [data-a=leave]");
  // Neue Partie: Rückfrage, Abbrechen behält den Stand
  await page.click(`text=${g.start}`);
  check(dialogs === 1, `${g.dir}: keine Rückfrage vor dem Überschreiben`);
  check(await page.locator("[data-a=resume]").count() === 1, `${g.dir}: Abbrechen hat die gespeicherte Partie verloren`);
  const kept = await page.evaluate((h) => window[h].state(), g.hook);
  check(kept === null, `${g.dir}: trotz Abbrechen neue Partie gestartet`);
  // Verwerfen
  dialogAnswer = true;
  await page.click("[data-a=discard]");
  await page.waitForTimeout(100);
  await page.click("text=Spielregeln lesen").catch(() => {});
  await page.reload();
  check(await page.locator("[data-a=resume]").count() === 0, `${g.dir}: Verwerfen hat nicht gelöscht`);
  console.log(`${g.dir}: geprüft`);
  await page.context().close();
}
await browser.close(); server.close();
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("OK — Speichern & verlassen funktioniert in allen vier Spielen.");
