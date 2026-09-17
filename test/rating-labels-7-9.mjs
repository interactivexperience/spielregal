// Prueft: die Bewertungs-Wortlaute fuer 7-9 (StarRating-Auswahl im Formular
// und Detailseiten-Anzeige) sind naeher an der BGG-Bedeutung ("meistens
// bereit mitzuspielen" / "schlaegt oft vor, lehnt nie ab" / "will fast
// immer spielen"), 1-6 und 10 bleiben unveraendert.
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

const games = [{ id: "g1", name: "Ark Nova", status: "owned", rating: "8", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" }];
await page.addInitScript((g) => {
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
}, games);

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);

// Detailseite: Bewertung 8 zeigt den neuen Wortlaut.
await page.locator('button:has-text("Sammlung")').last().click();
await page.waitForTimeout(800);
await page.locator('text=Ark Nova').first().click();
await page.waitForTimeout(800);
await page.locator('text=Mehr Details').click();
await page.waitForTimeout(400);
console.log("Detail (Bewertung 8): neuer Wortlaut sichtbar:", await page.locator('text=Schlage ich oft vor, lehne nie ab').count() > 0);

// Bearbeiten-Formular: StarRating zeigt bei Klick auf 7 und 9 die neuen Texte.
await page.locator('button[aria-label="Bearbeiten"]').first().click();
await page.waitForTimeout(700);
const star7 = page.locator('button[aria-label="7 von 10"]');
await star7.click();
await page.waitForTimeout(200);
console.log("Formular (7): neuer Wortlaut sichtbar:", await page.locator('text=Spiele ich meistens gern mit').count() > 0);
const star9 = page.locator('button[aria-label="9 von 10"]');
await star9.click();
await page.waitForTimeout(200);
console.log("Formular (9): neuer Wortlaut sichtbar:", await page.locator('text=Will ich fast immer spielen').count() > 0);

// 1-6 und 10 unveraendert.
const star10 = page.locator('button[aria-label="10 von 10"]');
await star10.click();
await page.waitForTimeout(200);
console.log("Formular (10): alter Wortlaut weiterhin da:", await page.locator("text=Wenn's brennt, rette ich zuerst dieses Spiel").count() > 0);
const star5 = page.locator('button[aria-label="5 von 10"]');
await star5.click();
await page.waitForTimeout(200);
console.log("Formular (5): alter Wortlaut weiterhin da:", await page.locator("text=Solides Mittelmaß").count() > 0);

await b.close(); server.close();
