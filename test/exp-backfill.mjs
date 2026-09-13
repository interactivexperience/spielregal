// Prueft den eigentlichen Bugreport: bei einem "alten" Spiel (bggId vorhanden,
// aber expansionBggList fehlt, weil es die BGG-Erweiterungsliste noch nie
// abgerufen hat) muss "Verknuepfen" trotzdem von selbst auftauchen -- ohne
// dass man manuell "BGG-Daten holen" antippen muss.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const vendor = (...p) => path.join(__dirname, "node_modules", ...p);
const SP = "/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad";

const server = http.createServer((req, res) => {
  try { res.writeHead(200); res.end(readFileSync(path.join(repoRoot, decodeURIComponent(req.url.split("?")[0])))); }
  catch { res.writeHead(404); res.end("nf"); }
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;
const twCss = readFileSync(path.join(__dirname, "tw-built.css"), "utf8");

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript",
  body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));

// "Altes" Basisspiel OHNE expansionBggList -- genau der Fall aus dem Bugreport.
// Die zugehoerige Erweiterung ist bereits (ohne BGG-Daten) in der Sammlung.
const games = [
  { id: "base1", name: "Brass: Birmingham", status: "owned", bggId: "224517", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
  { id: "exp1", name: "Brass: Birmingham – Eisenbahn", status: "owned", bggId: "300001", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-02" },
];
const fakeThingXml = `<?xml version="1.0"?><items><item id="224517"><name type="primary" value="Brass: Birmingham" /><yearpublished value="2018" /><minplayers value="2" /><maxplayers value="4" /><minplaytime value="60" /><maxplaytime value="120" /><minage value="14" /><link type="boardgameexpansion" id="300001" value="Brass: Birmingham – Eisenbahn" /></item></items>`;
await page.route("**/xmlapi2/thing?id=224517*", r => r.fulfill({ body: fakeThingXml, contentType: "text/xml" }));
await page.addInitScript((g) => {
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
}, games);

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);
await page.locator('button:has-text("Sammlung")').last().click();
await page.waitForTimeout(900);
await page.locator('text=Brass: Birmingham').first().click();
await page.waitForTimeout(2000); // Hintergrund-Nachlad + Re-Render abwarten

await page.screenshot({ path: `${SP}/exp_backfill_detail.png` });
const chip = page.locator('button:has-text("Erweiterung"):has-text("gefunden")');
console.log("Kompakter Chip erscheint von selbst (ohne 'BGG-Daten holen'):", await chip.count() > 0);
console.log("Persistiert (expansionBggList jetzt im Speicher):",
  await page.evaluate(() => Array.isArray((JSON.parse(localStorage.getItem("spielregal:games"))||[]).find(g=>g.id==="base1").expansionBggList)));
if (await chip.count()) {
  await chip.first().click();
  await page.waitForTimeout(500);
  console.log("Sheet zeigt den Verknüpfen-Button:",
    await page.locator('button[aria-label="Brass: Birmingham – Eisenbahn verknüpfen"]').count() > 0);
  await page.locator('button:has-text("Fertig")').first().click();
  await page.waitForTimeout(400);
}

// Auch im Bearbeiten-Formular sollte der Chip von selbst auftauchen.
const edit = page.locator('button[aria-label="Bearbeiten"], button:has-text("Bearbeiten")').first();
if (await edit.count()) { await edit.click(); await page.waitForTimeout(1500); }
const lbl = page.locator('text=Erweiterungen dieses Spiels');
if (await lbl.count()) { await lbl.first().scrollIntoViewIfNeeded(); await page.waitForTimeout(400); }
console.log("Formular: Chip von selbst sichtbar:", await page.locator('button:has-text("Erweiterung"):has-text("gefunden")').count() > 0);
await page.screenshot({ path: `${SP}/exp_backfill_form.png` });

await b.close(); server.close();
