// Prueft: die Bearbeiten-Seite eines Spiels ist in Reiter geteilt (Basis, Details,
// Notizen, Bilder). Titel + Reiterleiste + Speichern bleiben immer sichtbar, jeder Reiter
// ist deutlich kuerzer als das alte Gesamtformular, und Eingaben aus allen Reitern
// werden gespeichert.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const vendor = (...p) => path.join(__dirname, "node_modules", ...p);
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



const game = { id: "g1", name: "Ark Nova", germanName: "", status: "owned", bggId: "342942", year: "2021", rating: "8", images: ["data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3Crect width='2' height='2' fill='%23f00'/%3E%3C/svg%3E"],
  categories: ["Tiere"], mechanisms: ["Kartenspiel"], publishers: ["Feuerland"], designers: ["Mathias Wigge"], playerTypes: [], addedDate: "2026-01-01", minPlayers: "1", maxPlayers: "4", minTime: "90", maxTime: "150", notes: "", summary: "<p>Zoo bauen.</p>" };
await page.addInitScript((g) => {
  if (localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1");
  localStorage.setItem("spielregal:games", JSON.stringify([g]));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
}, game);
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2000);
await page.locator('button:has-text("Sammlung")').last().click(); await page.waitForTimeout(800);
await page.locator('text=Ark Nova').first().click(); await page.waitForTimeout(800);
await page.locator('button[aria-label="Bearbeiten"]').first().click(); await page.waitForTimeout(900);

const panel = (k) => page.locator(`[data-tab-panel="${k}"]`);
const visible = async () => { const r = []; for (const k of ["basis", "details", "notes", "pictures"]) if (await panel(k).isVisible()) r.push(k); return r; };
const tab = async (k) => { await page.locator(`[data-form-tab="${k}"]`).click(); await page.waitForTimeout(250); };
console.log("4 Reiter: Basis, Details, Notizen, Bilder:", JSON.stringify(await page.locator("[data-form-tab]").allInnerTexts()) === '["Basis","Details","Notizen","Bilder"]');
console.log("Start im Reiter 'Basis' (nur dieser sichtbar):", JSON.stringify(await visible()) === '["basis"]');
const titleIn = page.locator('input[placeholder="Titel *"]');
const saveBtn = page.locator('button:has-text("Speichern")').last();
const inView = async (loc) => { const b = await loc.boundingBox(); return !!b && b.y >= 0 && b.y + b.height <= 844; };
const heights = {};
for (const k of ["basis", "details", "notes", "pictures"]) {
  await tab(k);
  heights[k] = await panel(k).evaluate((el) => el.scrollHeight);
  console.log(`Reiter ${k}: nur er sichtbar, Titel + Speichern bleiben im Bild:`, JSON.stringify(await visible()) === JSON.stringify([k]) && await inView(titleIn) && await inView(saveBtn));
}
const total = Object.values(heights).reduce((a, b) => a + b, 0);
console.log("Hoechster Reiter ist deutlich kuerzer als alle Reiter zusammen (alte Seite):", Math.max(...Object.values(heights)) < total * 0.6, JSON.stringify(heights));

// Inhalte je Reiter
await tab("basis");
console.log("Basis: Bewertung, Status, Spielerzahl, Dauer, Komplexitaet:", await page.locator('text=Deine Bewertung').isVisible() && await page.locator('text=Spieleranzahl (min–max)').isVisible() && await page.locator('text=Dauer in Minuten').isVisible() && await page.locator('text=Komplexität').first().isVisible() && await page.locator('button:has-text("Wunschliste")').isVisible());
await tab("details");
console.log("Details: Verlag, Designer, Mechanismen, Kategorien, Zusammenfassung, Erweiterung von:", await page.locator('label:has-text("Verlag")').isVisible() && await page.locator('label:has-text("Designer")').isVisible() && await page.locator('label:has-text("Mechanismen")').isVisible() && await page.locator('label:has-text("Kategorien")').isVisible() && await page.locator('label:has-text("Zusammenfassung")').isVisible() && await page.locator('label:has-text("Erweiterung von")').isVisible());
await tab("notes");
console.log("Notizen: Notizen, Kampagnenspiel, Verliehen:", await page.locator('label:has-text("Notizen, Hausregeln")').isVisible() && await page.locator('text=Kampagnenspiel').first().isVisible() && await page.locator('text=Verliehen').first().isVisible());
await tab("pictures");
console.log("Bilder: Galerie mit Foto hinzufuegen:", await page.locator('button[aria-label="Foto hinzufügen"]').first().isVisible());
await page.locator('[data-open-pictures]').click(); await page.waitForTimeout(200);
console.log("Vorschaubild oben fuehrt zum Reiter Bilder:", JSON.stringify(await visible()) === '["pictures"]');
await page.screenshot({ path: "/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad/form_tabs_pictures.png" });
await tab("basis");
await page.screenshot({ path: "/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad/form_tabs_basis.png" });

// Eingaben aus mehreren Reitern speichern
await titleIn.fill("Ark Nova 2");
await page.locator('input[placeholder="Erscheinungsjahr"]').fill("2022");
await tab("details");
await page.locator('.ProseMirror, [contenteditable="true"]').first().click().catch(() => {});
await tab("notes");
await page.locator('text=Verliehen').first().click(); await page.waitForTimeout(200);
await page.locator('input[placeholder="An wen?"]').fill("Anna");
await saveBtn.click(); await page.waitForTimeout(1200);
const g = (await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:games"))))[0];
console.log("Gespeichert: Titel (Kopf), Jahr (Basis), verliehen an (Notizen):", g.name === "Ark Nova 2" && g.year === "2022" && String(g.lentTo).trim() === "Anna");
console.log("Unveraendert aus anderen Reitern: Verlag, Designer, Bewertung:", JSON.stringify(g.publishers) === '["Feuerland"]' && JSON.stringify(g.designers) === '["Mathias Wigge"]' && g.rating === "8");
await b.close(); server.close();
