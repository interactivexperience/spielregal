// Prueft: in der Wunschlisten-Ansicht der Sammlung sind "nur digital
// vorgemerkte" Spiele (Reminder, kein Kaufwunsch) standardmaessig
// ausgeblendet -- muss aktiv im Filter eingeschaltet werden, um sie
// mitanzuzeigen. Gleiches Muster wie beim bestehenden Verkaufsstatus-Filter
// (auch dort standardmaessig ausgeblendet, bis aktiv ausgewaehlt).
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
  { id: "g1", name: "Wingspan", status: "wishlist", format: "analog", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
  { id: "g2", name: "Onirim", status: "wishlist", format: "digital", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-02" },
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

// Auf Wunschliste umstellen.
await page.locator('button[aria-label="Filter"]').first().click();
await page.waitForTimeout(500);
await page.locator('button:has-text("Wunschliste")').last().click();
await page.waitForTimeout(300);
console.log("Toggle 'Nur digital vorgemerkte' erscheint nur bei Status Wunschliste:", await page.locator('text=Nur digital vorgemerkte').count() > 0);
await page.locator('button:has-text("Anwenden")').click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${SP}/wishlist_digital_filter_default.png` });

console.log("Standard: Wingspan (physisch) sichtbar:", await page.locator('text=Wingspan').count() > 0);
console.log("Standard: Onirim (nur digital) NICHT sichtbar:", await page.locator('text=Onirim').count() === 0);

// "Mit anzeigen" aktivieren.
await page.locator('button[aria-label="Filter"]').first().click();
await page.waitForTimeout(500);
await page.locator('button:has-text("Mit anzeigen")').click();
await page.waitForTimeout(300);
await page.locator('button:has-text("Anwenden")').click();
await page.waitForTimeout(500);
console.log("Nach 'Mit anzeigen': Onirim jetzt sichtbar:", await page.locator('text=Onirim').count() > 0);
console.log("Nach 'Mit anzeigen': Wingspan weiterhin sichtbar:", await page.locator('text=Wingspan').count() > 0);
await page.screenshot({ path: `${SP}/wishlist_digital_filter_shown.png` });

// Reload: Wahl bleibt gemerkt.
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.locator('button:has-text("Sammlung")').last().click();
await page.waitForTimeout(800);
console.log("Wahl bleibt nach Reload gemerkt (Onirim weiterhin sichtbar):", await page.locator('text=Onirim').count() > 0);

// Zuruecksetzen setzt auch diesen Filter zurueck (Status geht auf Besitz,
// aber wir pruefen direkt, dass der gespeicherte Zustand nach Reset wieder
// dem Default entspricht, indem wir erneut auf Wunschliste stellen).
await page.locator('button[aria-label="Filter"]').first().click();
await page.waitForTimeout(500);
await page.locator('button:has-text("Zurücksetzen")').click();
await page.waitForTimeout(300);
await page.locator('button:has-text("Wunschliste")').last().click();
await page.waitForTimeout(300);
await page.locator('button:has-text("Anwenden")').click();
await page.waitForTimeout(500);
console.log("Nach Zuruecksetzen: Onirim (digital) wieder ausgeblendet:", await page.locator('text=Onirim').count() === 0);
console.log("Nach Zuruecksetzen: Wingspan weiterhin sichtbar:", await page.locator('text=Wingspan').count() > 0);

await b.close(); server.close();
