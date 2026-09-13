// Prueft "Alle auswaehlen" in "Fotos verwalten": bisher musste man auf
// Mobile jedes Foto einzeln antippen, um mehrere zum Loeschen auszuwaehlen.
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

const PIXEL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect width='1' height='1' fill='%23f00'/%3E%3C/svg%3E";
const PIXEL2 = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect width='1' height='1' fill='%2300f'/%3E%3C/svg%3E";
const PIXEL3 = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect width='1' height='1' fill='%230f0'/%3E%3C/svg%3E";
const games = [
  { id: "g1", name: "Ark Nova", status: "owned", images: [PIXEL, PIXEL2, PIXEL3], categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
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
await page.locator('text=Ark Nova').first().click();
await page.waitForTimeout(1000);
await page.locator('button[aria-label="Bearbeiten"], button:has-text("Bearbeiten")').first().click();
await page.waitForTimeout(1000);
await page.locator('text=Fotos verwalten').click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${SP}/photo_select_all_before.png` });

console.log("Startzustand: 'Fotos auswählen', Knopf zeigt 'Alle':", (await page.locator('text=Fotos auswählen').count()) > 0 && (await page.locator('button:has-text("Alle")').count()) > 0);

await page.locator('button:has-text("Alle")').click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${SP}/photo_select_all_after.png` });
console.log("Alle 3 ausgewaehlt:", await page.locator('text=3 ausgewählt').count() > 0);
console.log("Knopf zeigt jetzt 'Keine':", await page.locator('button:has-text("Keine")').count() > 0);
console.log("Löschen-Button zeigt 3:", (await page.locator('button:has-text("löschen")').innerText()).includes("3"));

await page.locator('button:has-text("Keine")').click();
await page.waitForTimeout(400);
console.log("Wieder 0 ausgewaehlt:", await page.locator('text=Fotos auswählen').count() > 0);
console.log("Löschen-Button verschwunden bei 0 Auswahl:", await page.locator('button:has-text("löschen")').count() === 0);

// Tatsaechlich alle loeschen und pruefen, dass sie weg sind.
await page.locator('button:has-text("Alle")').click();
await page.waitForTimeout(300);
await page.locator('button:has-text("löschen")').click();
await page.waitForTimeout(700);
await page.locator('button:has-text("Speichern")').first().click();
await page.waitForTimeout(700);
const nachher = await page.evaluate(() => (JSON.parse(localStorage.getItem("spielregal:games"))||[]).find(g => g.id === "g1"));
console.log("Alle 3 Fotos tatsächlich geloescht:", (nachher.images || []).length === 0);

await b.close(); server.close();
