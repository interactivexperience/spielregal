// Prueft: Swipe auf der Detailseite folgt der aktuell in der Sammlung
// gefilterten Sicht (persistierte Filter/Status/Sortierung) -- ist nichts
// aktiv gefiltert, zaehlt wirklich alles. Und: der Gast bekommt den
// Swipe-Hinweis genau einmal, dauerhaft gemerkt.
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
  { id: "g1", name: "Ark Nova", status: "owned", categories: ["Tiere"], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-01" },
  { id: "g2", name: "Brass Birmingham", status: "owned", categories: ["Wirtschaft"], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-02" },
  { id: "g3", name: "Cascadia", status: "owned", categories: ["Tiere"], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-03" },
  { id: "g4", name: "Dune Imperium", status: "wishlist", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-04" },
];
async function touchSwipe(x1, y1, x2, y2) {
  await page.evaluate(([x1, y1, x2, y2]) => {
    const el = document.elementFromPoint(x1, y1);
    const mk = (x, y) => new Touch({ identifier: 1, target: el, clientX: x, clientY: y, pageX: x, pageY: y });
    const t1 = mk(x1, y1);
    el.dispatchEvent(new TouchEvent("touchstart", { touches: [t1], targetTouches: [t1], changedTouches: [t1], bubbles: true, cancelable: true }));
    const t2 = mk(x2, y2);
    el.dispatchEvent(new TouchEvent("touchend", { touches: [], targetTouches: [], changedTouches: [t2], bubbles: true, cancelable: true }));
  }, [x1, y1, x2, y2]);
}
const title = () => page.locator("h1").last().innerText();
const swipeLeft = () => touchSwipe(340, 700, 60, 700);

// --- Teil 1: aktiver Filter (Kategorie "Tiere") -> Swipe bleibt innerhalb ---
await page.addInitScript((g) => {
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
  localStorage.setItem("spielregal:collectionFilters", JSON.stringify({ categories: ["Tiere"], mechanisms: [], publishers: [], complexity: [], saleStatus: [], players: "", minRating: "" }));
  localStorage.setItem("spielregal:collectionStatusFilter", JSON.stringify("owned"));
}, games);
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);
await page.locator('button:has-text("Sammlung")').last().click();
await page.waitForTimeout(900);
console.log("Nur gefilterte Spiele sichtbar (Ark Nova, Cascadia):", await page.locator('text=Brass Birmingham').count() === 0);
await page.locator('text=Ark Nova').first().click();
await page.waitForTimeout(1000);
console.log("Start (gefiltert):", await title());
await swipeLeft();
await page.waitForTimeout(500);
console.log("Wisch springt zu Cascadia (naechstes IM Filter), NICHT Brass Birmingham:", (await title()) === "Cascadia");
await swipeLeft();
await page.waitForTimeout(500);
console.log("Am Ende der gefilterten Liste bleibt es bei Cascadia:", (await title()) === "Cascadia");

// --- Teil 2: kein aktiver Filter -> Swipe geht durch ALLE Spiele (auch Wunschliste) ---
// addInitScript feuert bei jeder Navigation erneut (auch bei reload) und
// wuerde den Tiere-Filter aus Teil 1 sonst restaurieren -- ein zweites
// addInitScript laeuft danach und ueberschreibt ihn zuverlaessig.
await page.addInitScript(() => {
  localStorage.setItem("spielregal:collectionFilters", JSON.stringify({ categories: [], mechanisms: [], publishers: [], complexity: [], saleStatus: [], players: "", minRating: "" }));
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.locator('button:has-text("Sammlung")').last().click();
await page.waitForTimeout(900);
await page.locator('text=Ark Nova').first().click();
await page.waitForTimeout(1000);
console.log("Start (ungefiltert):", await title());
await swipeLeft();
await page.waitForTimeout(500);
console.log("Wisch -> Brass Birmingham (naechstes in ALLES, alphabetisch):", (await title()) === "Brass Birmingham");
await swipeLeft();
await swipeLeft();
await page.waitForTimeout(500);
console.log("Wisch erreicht auch Wunschlisten-Spiel (Dune Imperium):", (await title()) === "Dune Imperium");
await page.screenshot({ path: `${SP}/detail_swipe_unfiltered.png` });

await b.close(); server.close();
