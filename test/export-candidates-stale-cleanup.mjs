// Prueft den Fix fuer: Im "Neue Spiele"-Export-Modus blieben per "Aus
// Wunschliste uebernehmen" gepickte Kandidaten-Namen fuer immer im Textfeld
// stehen, auch nachdem das zugehoerige Spiel komplett aus der Sammlung
// geloescht wurde -- man konnte im Text nicht erkennen, dass ein Kandidat
// gar nicht mehr existiert.
// Fix: Picks aus der Wunschliste werden zusaetzlich mit ihrer Spiel-ID
// gemerkt (exportWishlistPicks); sobald das Spiel geloescht wird oder nicht
// mehr auf der Wunschliste steht, wird die Zeile automatisch aus dem
// Kandidaten-Text entfernt. Frei getippte Kandidaten (kein Picker-Ursprung)
// werden NIE automatisch angefasst -- das ist bewusst so, weil man dort
// auch Spiele eintippen koennen soll, die man noch gar nicht besitzt.
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

const games = [
  { id: "g1", name: "Ark Nova", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
  { id: "g2", name: "Wingspan", status: "wishlist", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-02" },
  { id: "g3", name: "Cascadia", status: "wishlist", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-03" },
];
await page.addInitScript((g) => {
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
}, games);

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2000);
await page.locator('button:has-text("Mehr")').last().click();
await page.waitForTimeout(700);
await page.locator('text=Für KI exportieren').click();
await page.waitForTimeout(700);
await page.locator('button:has-text("Neue Spiele")').click();
await page.waitForTimeout(400);

// Frei getippten Kandidaten hinzufuegen, der NIE in der Sammlung war --
// muss fuer immer unangetastet bleiben.
const candidatesInput = page.locator("textarea").first();
await candidatesInput.fill("Everdell");
await page.waitForTimeout(200);

// Wingspan + Cascadia aus der Wunschliste uebernehmen (ueberschreibt den Text).
await page.locator('text=Aus Wunschliste übernehmen').click();
await page.waitForTimeout(500);
const picker = page.locator('div.z-\\[66\\]');
await picker.locator('button', { hasText: "Wingspan" }).click();
await page.waitForTimeout(150);
await picker.locator('button', { hasText: "Cascadia" }).click();
await page.waitForTimeout(150);
await picker.locator('button:has-text("Fertig")').click();
await page.waitForTimeout(500);

// Danach noch "Everdell" manuell dazuschreiben (simuliert: Nutzer ergaenzt
// nach dem Picker einen weiteren, frei getippten Kandidaten).
const afterPick = await candidatesInput.inputValue();
await candidatesInput.fill(`${afterPick}\nEverdell`);
await page.waitForTimeout(300);
console.log("Vor Löschen: Wingspan, Cascadia, Everdell alle im Text:",
  (await candidatesInput.inputValue()).includes("Wingspan") &&
  (await candidatesInput.inputValue()).includes("Cascadia") &&
  (await candidatesInput.inputValue()).includes("Everdell"));

// Wingspan komplett aus der Sammlung loeschen.
await page.locator('button:has-text("Sammlung")').last().click();
await page.waitForTimeout(700);
await page.locator('button[aria-label="Filter"]').first().click();
await page.waitForTimeout(400);
await page.locator('button:has-text("Wunschliste")').click();
await page.waitForTimeout(150);
await page.locator('button:has-text("Anwenden")').click();
await page.waitForTimeout(500);
await page.locator('text=Wingspan').first().click();
await page.waitForTimeout(600);
await page.locator('button[aria-label="Bearbeiten"]').first().click();
await page.waitForTimeout(600);
await page.locator('button:has-text("Spiel entfernen")').click();
await page.waitForTimeout(500);

// Zurueck zum Export, "Neue Spiele"-Modus ist gemerkt.
await page.locator('button:has-text("Mehr")').last().click();
await page.waitForTimeout(700);
await page.locator('text=Für KI exportieren').click();
await page.waitForTimeout(700);
const finalText = await page.locator("textarea").first().inputValue();
console.log("Nach Löschen von Wingspan -- finaler Kandidaten-Text:", JSON.stringify(finalText));
console.log("Wingspan (geloescht, aus Picker) automatisch entfernt:", !finalText.includes("Wingspan"));
console.log("Cascadia (weiterhin auf Wunschliste, aus Picker) bleibt:", finalText.includes("Cascadia"));
console.log("Everdell (frei getippt, nie in Sammlung) bleibt unangetastet:", finalText.includes("Everdell"));

await b.close(); server.close();
