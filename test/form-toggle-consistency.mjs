// Prueft das Aufraeumen der Bearbeiten-Seite: die drei Toggle-Zeilen
// (Digital/Kampagnenspiel/Verliehen) liefen vorher auf text-base (16px) und
// wichen damit von aehnlichen Zeilen (z.B. "Erweiterungen verknuepfen…",
// "Spiel entfernen") ab, die text-sm (14px) nutzen -- dadurch brach
// "Kampagnenspiel (Fortschritts-Historie)" haesslich um. Jetzt teilen sich
// alle drei dieselbe ToggleRow-Komponente mit einheitlicher Schriftgroesse.
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

const games = [
  { id: "g1", name: "Lairs", status: "owned", format: "analog", isCampaign: false, lentTo: "", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
];
await page.addInitScript((g) => {
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
}, games);

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);
await page.locator('button:has-text("Sammlung")').last().click();
await page.waitForTimeout(800);
await page.locator('text=Lairs').first().click();
await page.waitForTimeout(1000);
const edit = page.locator('button[aria-label="Bearbeiten"], button:has-text("Bearbeiten")').first();
if (await edit.count()) { await edit.click(); await page.waitForTimeout(1000); }

const fontSize = async (text) => page.locator('span', { hasText: text }).first().evaluate((el) => getComputedStyle(el).fontSize);

const digitalSize = await fontSize("Digitale Version");
const campaignSize = await fontSize("Kampagnenspiel");
const lentSize = await fontSize("Verliehen");
const linkExpansionsSize = await page.locator('button:has-text("Erweiterungen verknüpfen")').evaluate((el) => getComputedStyle(el).fontSize);
console.log("Digital-Toggle-Label ist 14px (text-sm):", digitalSize === "14px");
console.log("Kampagnenspiel-Toggle-Label ist 14px (text-sm):", campaignSize === "14px");
console.log("Verliehen-Toggle-Label ist 14px (text-sm):", lentSize === "14px");
console.log("Alle drei stimmen mit 'Erweiterungen verknüpfen' (14px) ueberein:", digitalSize === linkExpansionsSize && campaignSize === linkExpansionsSize && lentSize === linkExpansionsSize);

// "Erweiterung von"-Suchfeld: Platzhalter war doppelt/zu lang ("Eigenstaendiges
// Spiel — Basisspiel suchen…", wiederholte quasi den Feld-Label). Die Schrift
// selbst bleibt bewusst bei 16px -- eine globale Regel
// (input,textarea,select{font-size:16px!important}) verhindert iOS-Autozoom
// beim Fokussieren und darf hier nicht unterlaufen werden. Optisch angeglichen
// wird stattdessen ueber die Feldhoehe (h-11 wie der Nachbar-Knopf statt h-12
// wie echte Dateneingabe-Felder).
const baseGameInput = page.locator('input[placeholder="Basisspiel suchen…"]');
console.log("'Erweiterung von'-Feld hat kurzen, nicht-doppelten Platzhalter:", await baseGameInput.count() === 1);
const baseGameInputSize = await baseGameInput.evaluate((el) => getComputedStyle(el).fontSize);
console.log("'Erweiterung von'-Feld bleibt bei 16px (iOS-Zoom-Schutz nicht unterlaufen):", baseGameInputSize === "16px");
const baseGameInputBox = await baseGameInput.boundingBox();
const linkExpansionsBox = await page.locator('button:has-text("Erweiterungen verknüpfen")').boundingBox();
console.log("'Erweiterung von'-Feld hat dieselbe Hoehe wie 'Erweiterungen verknüpfen' (h-11):", Math.abs(baseGameInputBox.height - linkExpansionsBox.height) < 1);

const campaignBox = await page.locator('span', { hasText: "Kampagnenspiel" }).first().boundingBox();
console.log("'Kampagnenspiel (Fortschritts-Historie)' bricht nicht mehr um (Hoehe < 22px):", campaignBox.height < 22);
await page.locator('button', { hasText: "Kampagnenspiel" }).scrollIntoViewIfNeeded();
await page.screenshot({ path: `${SP}/form_toggles_after.png` });

// Funktional weiterhin unveraendert: Toggles lassen sich schalten und speichern.
await page.locator('button', { hasText: "Kampagnenspiel" }).click();
await page.waitForTimeout(200);
await page.locator('button', { hasText: "Verliehen" }).click();
await page.waitForTimeout(200);
await page.locator('input[placeholder="An wen?"]').fill("Ben");
await page.waitForTimeout(200);
await page.locator('button:has-text("Speichern")').first().click();
await page.waitForTimeout(700);
const saved = await page.evaluate(() => (JSON.parse(localStorage.getItem("spielregal:games"))||[]).find(g => g.id === "g1"));
console.log("Kampagnenspiel-Toggle funktioniert weiterhin (gespeichert):", saved.isCampaign === true);
console.log("Verliehen-Toggle funktioniert weiterhin (gespeichert):", saved.lentTo.trim() === "Ben");

await b.close(); server.close();
