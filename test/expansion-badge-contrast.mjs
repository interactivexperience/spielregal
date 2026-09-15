// Prueft zwei echte Kontrast-Bugs im 4-Spalten-Grid, beide derselben Ursache:
// eine theme-abhaengige Textfarbe (text-ink bzw. text-gold) auf einem festen
// bg-black/70-Hintergrund. Im Hellmodus faerbt sich text-ink fast schwarz
// (Erweiterungs-Badge wirkte "leer") und text-gold wird ein dunkleres,
// matteres Braun-Gold (Bewertungs-Badge "immer noch nicht gut sichtbar").
// Beide Badges nutzen jetzt festes text-white (der Stern im Bewertungs-
// Badge bleibt als Akzent gold-gefaerbt, nur die eigentliche Zahl ist weiss).
// Die Nachbar-Badges (Digital, Sprachenzahl) nutzten schon immer text-white
// und waren nie betroffen.
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
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript",
  body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));

const games = [
  { id: "base1", name: "The Isle of Cats", status: "owned", rating: "8", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
  { id: "exp1", name: "The Isle of Cats: Furry Allies", status: "owned", expansionOf: "base1", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-02" },
];
await page.addInitScript((g) => {
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  // Bugreport war im Hellmodus (Screenshot mit hellem Hintergrund).
  localStorage.setItem("spielregal:theme", "light");
  localStorage.setItem("spielregal:collectionGridCols", "4");
}, games);

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);
await page.locator('button:has-text("Sammlung")').last().click();
await page.waitForTimeout(900);

// --- Bewertungs-Badge (oben links, Basisspiel-Kachel, Slide 0) ---
const ratingBadge = page.locator('span', { hasText: "8" }).filter({ has: page.locator("svg") }).first();
console.log("Bewertungs-Badge sichtbar:", await ratingBadge.count() > 0);
const ratingColor = await ratingBadge.evaluate((el) => getComputedStyle(el).color);
console.log("DEBUG Bewertungs-Badge-Textfarbe:", ratingColor);
console.log("Bewertungs-Zahl ist WEISS (nicht das matte Hellmodus-Gold):", ratingColor === "rgb(255, 255, 255)");

// Erweiterungen stehen nicht als eigene Kachel in der Liste (list.filter(g
// => !g.expansionOf)) -- sie werden ueber das Karussell der Basisspiel-Kachel
// erreicht, wenn man sie durchwischt. Auf die erste Kachel (Basisspiel) wischen.
// Auf den konkreten Kachel-Button zielen (statt elementFromPoint), damit das
// Event garantiert am richtigen Karussell-Handler ankommt.
async function touchSwipeFirstTile(dx) {
  await page.evaluate(([dx]) => {
    // Kein <img> vorhanden (Testspiel ohne Foto -- Dices-Platzhalter), daher
    // ueber den Grid-Container direkt auf den ersten Kachel-Button zielen.
    const el = document.querySelector(".grid-cols-4 button");
    const rect = el.getBoundingClientRect();
    const y = rect.top + rect.height / 2;
    const x1 = rect.left + rect.width / 2;
    const x2 = x1 + dx;
    const mk = (x, y) => new Touch({ identifier: 1, target: el, clientX: x, clientY: y, pageX: x, pageY: y });
    const t1 = mk(x1, y);
    el.dispatchEvent(new TouchEvent("touchstart", { touches: [t1], targetTouches: [t1], changedTouches: [t1], bubbles: true, cancelable: true }));
    // GameGridCard's Karussell berechnet das Delta ausschliesslich in
    // handleTouchMove (dragDeltaX.current) -- ohne ein echtes touchmove-Event
    // dazwischen bleibt dragDeltaX bei 0 und touchend wischt gar nicht.
    const t2 = mk(x2, y);
    el.dispatchEvent(new TouchEvent("touchmove", { touches: [t2], targetTouches: [t2], changedTouches: [t2], bubbles: true, cancelable: true }));
    el.dispatchEvent(new TouchEvent("touchend", { touches: [], targetTouches: [], changedTouches: [t2], bubbles: true, cancelable: true }));
  }, [dx]);
}
await touchSwipeFirstTile(-60);
await page.waitForTimeout(400);
await page.screenshot({ path: `${SP}/expansion_badge_light.png` });

const badge = page.locator('[title="Erweiterung"]').first();
console.log("Erweiterungs-Badge sichtbar:", await badge.count() > 0);
const color = await badge.evaluate((el) => getComputedStyle(el).color);
console.log("DEBUG Badge-Textfarbe:", color);
console.log("Badge-Icon ist WEISS (kontrastreich auf dunklem Hintergrund), nicht die dunkle Hellmodus-ink-Farbe:", color === "rgb(255, 255, 255)");
console.log("Badge-Icon ist NICHT die (im Hellmodus fast-schwarze) ink-Farbe 36,31,27:", color !== "rgb(36, 31, 27)");

await b.close(); server.close();
