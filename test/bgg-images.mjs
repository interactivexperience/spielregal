// Prueft "Offizielle Bilder von BGG": Button erscheint nur mit bggId, holt
// die Editionsbilder (versions=1, NICHT die freie Bildergalerie), Auswahl
// landet als weitere Fotos im Formular.
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

// 1x1-PNG als Daten-URL, damit die Bilder im Sheet tatsaechlich laden (echte
// BGG-Bild-URLs sind offline nicht erreichbar).
const PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const PIXEL2 = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
const fakeVersionsXml = `<?xml version="1.0"?><items>
  <item type="boardgame" id="224517">
    <name type="primary" value="Brass: Birmingham" />
    <image>${PIXEL}</image>
  </item>
  <item type="boardgameversion" id="v1">
    <name type="primary" value="Deutsche Ausgabe" />
    <yearpublished value="2019" />
    <image>${PIXEL}</image>
  </item>
  <item type="boardgameversion" id="v2">
    <name type="primary" value="Deluxe Edition" />
    <yearpublished value="2021" />
    <image>${PIXEL2}</image>
  </item>
  <item type="boardgameversion" id="v3">
    <name type="primary" value="Ohne Bild" />
  </item>
</items>`;
await page.route("**/xmlapi2/thing?id=224517&versions=1*", r => r.fulfill({ body: fakeVersionsXml, contentType: "text/xml" }));

const games = [
  { id: "g1", name: "Brass: Birmingham", status: "owned", bggId: "224517", images: [], categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
  { id: "g2", name: "Handgemacht", status: "owned", bggId: "", images: [], categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-02" },
];
await page.addInitScript((g) => {
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
}, games);

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);
await page.locator('button:has-text("Sammlung")').last().click();
await page.waitForTimeout(900);

// Spiel OHNE bggId: der Knopf darf gar nicht erst auftauchen.
await page.locator('text=Handgemacht').first().click();
await page.waitForTimeout(1000);
let edit = page.locator('button[aria-label="Bearbeiten"], button:has-text("Bearbeiten")').first();
if (await edit.count()) { await edit.click(); await page.waitForTimeout(1000); }
const addPhotoBtn = page.locator('button[aria-label="Foto hinzufügen"]');
await addPhotoBtn.click();
await page.waitForTimeout(500);
console.log("Kein BGG-Knopf ohne bggId:", await page.locator('text=Offizielle Bilder von BGG').count() === 0);
await page.locator('button:has-text("Abbrechen")').click();
await page.waitForTimeout(400);
await page.locator('button[aria-label="Zurück"]').first().click();
await page.waitForTimeout(700);

// Spiel MIT bggId: Knopf da, Sheet laedt die Editionsbilder, Auswahl landet
// im Formular.
await page.locator('text=Brass: Birmingham').first().click();
await page.waitForTimeout(1000);
edit = page.locator('button[aria-label="Bearbeiten"], button:has-text("Bearbeiten")').first();
if (await edit.count()) { await edit.click(); await page.waitForTimeout(1000); }
await page.locator('button[aria-label="Foto hinzufügen"]').click();
await page.waitForTimeout(500);
console.log("BGG-Knopf sichtbar mit bggId:", await page.locator('text=Offizielle Bilder von BGG').count() > 0);
await page.locator('text=Offizielle Bilder von BGG').click();
await page.waitForTimeout(1000);
await page.screenshot({ path: `${SP}/bgg_images_sheet.png` });
console.log("Deutsche Ausgabe gelistet:", await page.locator('text=Deutsche Ausgabe').count() > 0);
console.log("Deluxe Edition gelistet:", await page.locator('text=Deluxe Edition').count() > 0);
console.log("Version ohne Bild NICHT gelistet:", await page.locator('text=Ohne Bild').count() === 0);

const tiles = page.locator('button:has(img[alt="Deutsche Ausgabe"]), button:has(img[alt="Deluxe Edition"])');
await tiles.nth(0).click();
await tiles.nth(1).click();
await page.waitForTimeout(300);
await page.locator('button:has-text("Hinzufügen")').click();
await page.waitForTimeout(700);
await page.screenshot({ path: `${SP}/bgg_images_after.png` });

const edit2 = page.locator('button[aria-label="Bearbeiten"], button:has-text("Bearbeiten")').first();
console.log("Speichern-Button da:", await page.locator('button:has-text("Speichern")').count() > 0);
await page.locator('button:has-text("Speichern")').first().click();
await page.waitForTimeout(700);
const gespeichert = await page.evaluate(() => (JSON.parse(localStorage.getItem("spielregal:games"))||[]).find(g => g.id === "g1"));
console.log("2 zusaetzliche Bilder gespeichert:", (gespeichert.images || []).length === 2);

await b.close(); server.close();
