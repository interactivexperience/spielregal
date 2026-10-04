import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const vendor = (...p) => path.join(__dirname, "node_modules", ...p);

const server = http.createServer((req, res) => {
  // Ordner-URLs wie GitHub Pages auf index.html abbilden
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  let body;
  try { body = readFileSync(path.join(repoRoot, p)); } catch { res.writeHead(404); res.end("nf"); return; }
  res.writeHead(200, p.endsWith(".html") ? { "content-type": "text/html; charset=utf-8" } : {});
  res.end(body);
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


// Prueft den Dashboard-Abschnitt „Digital spielen“ (Cover + Name) und die Zuordnung von
// Three Sisters zur Harvest Edition (Link auf der Detailseite, Tracking).
let fehler = 0;
const check = (ok, msg) => { if (!ok) { console.log("FEHLER: " + msg); fehler++; } };
const games = [
  { id: "ts", name: "Three Sisters: Harvest Edition", bggId: "999001", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-01" },
  { id: "tsx", name: "Three Sisters: Rock Garden", expansionOf: "ts", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-02" },
];
const plays = [{ id: "p1", gameId: "ts", gameName: "Three Sisters: Harvest Edition", date: "2026-09-30", mode: "bga", players: "Mi", playerIds: [], winner: "", notes: "", images: [], source: "drei-schwestern" }];
await page.addInitScript(([g, pl]) => {
  if (!sessionStorage.getItem("seeded")) {
    localStorage.setItem("spielregal:games", JSON.stringify(g));
    localStorage.setItem("spielregal:plays", JSON.stringify(pl));
    // alte gespeicherte Dashboard-Reihenfolge ohne den neuen Abschnitt
    localStorage.setItem("spielregal:dashboardOrder", JSON.stringify(["month", "records", "bestof", "wishlist", "lent", "topRated", "dust", "digital"]));
    localStorage.setItem("grand-hotel-wien-v1", JSON.stringify({ v: 1, screen: "game", round: 3 }));
    sessionStorage.setItem("seeded", "1");
  }
}, [games, plays]);
try {
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2500);
  check(await page.locator("text=Digital spielen").count() >= 1, "Abschnitt „Digital spielen“ fehlt im Dashboard");
  for (const href of ["grand-austria-hotel/", "three-sisters/", "rebel-princess/", "countryside/", "saum/"])
    check(await page.locator(`a[href^="${href}?v="] img[src^="${href}cover.jpg"]`).count() === 1, `Dashboard-Cover ${href} fehlt`);
  const covers = await page.evaluate(() => [...document.querySelectorAll("a img[src*='cover.jpg']")].map((i) => i.complete && i.naturalWidth > 0));
  check(covers.length === 5 && covers.every(Boolean), "Cover-Bilder laden nicht: " + JSON.stringify(covers));
  check(await page.locator('a[href^="grand-austria-hotel/?v="]:has-text("Partie läuft")').count() === 1, "laufende Grand-Hotel-Partie nicht angezeigt");
  check(await page.locator('a[href^="three-sisters/?v="]:has-text("Partie läuft")').count() === 0, "Drei Schwestern fälschlich als laufend markiert");
  if (process.env.SHOT) { await page.emulateMedia({ colorScheme: "dark" }); await page.locator("text=Digital spielen").first().scrollIntoViewIfNeeded(); await page.waitForTimeout(400); await page.screenshot({ path: process.env.SHOT }); }
  for (const n of ["Grand Hotel Wien", "Drei Schwestern", "Prinzessinnenball", "Landgut", "Saum"]) check(await page.locator(`a:has-text("${n}")`).count() >= 1, `Name ${n} fehlt`);
  await page.locator('button:has-text("Sammlung")').last().click();
  await page.waitForTimeout(500);
  await page.locator("text=Three Sisters: Harvest Edition").first().click();
  await page.waitForTimeout(800);
  check(await page.locator("a[href^='three-sisters/?v=']:has-text('Im Browser spielen')").count() === 1, "Link fehlt bei der Harvest Edition");
  await page.locator('[aria-label="Zurück"]').first().click();
  await page.waitForTimeout(500);
  // Tracking: Drei-Schwestern-Partie landet bei der Harvest Edition
  await page.evaluate(() => localStorage.setItem("spielregal:inbox:plays", JSON.stringify([{ id: "ts-test", source: "drei-schwestern", app: "Drei Schwestern", bggId: "291845", gameName: "Three Sisters", date: "2026-10-01", human: "Mi", results: [{ name: "Mi", bot: false, total: 80 }, { name: "Onkel Kohl", bot: true, total: 70 }], winners: ["Mi"] }])));
  await page.reload(); await page.waitForTimeout(2500);
  const p2 = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:plays") || "[]"));
  const g2 = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:games") || "[]"));
  const neu = p2.find((x) => x.id === "ts-test");
  check(neu && neu.gameId === "ts", "Drei-Schwestern-Partie nicht der Harvest Edition zugeordnet: " + JSON.stringify(neu));
  check(g2.length === 2, "unnötig neues Spiel angelegt: " + g2.map((g) => g.name).join(", "));
} catch (e) { console.log("FEHLER: " + e.message); fehler++; }
await b.close(); server.close();
if (fehler) process.exit(1);
console.log("OK — Dashboard zeigt die Browser-Spiele als Cover, Three Sisters greift bei der Harvest Edition.");
