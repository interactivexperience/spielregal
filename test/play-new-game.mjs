// Prueft: im Partie-Formular kann man ein Spiel, das nicht in der Sammlung
// steht, direkt anlegen und die Partie eintragen. Das Spiel bekommt den Status
// "Nur gespielt" (nicht im Regal), die Partie referenziert es.
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
const games = [{ id: "g1", name: "Ark Nova", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" }];
await page.addInitScript((g) => {
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
}, games);
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2000);
await page.locator('button:has-text("Partien")').last().click();
await page.waitForTimeout(800);
await page.locator('button[aria-label="Partie eintragen"]').click();
await page.waitForTimeout(600);
const search = page.locator('input[placeholder="Spiel suchen…"]');
const createBtn = page.locator('button:has-text("neu anlegen")');

await search.fill("Ark Nova"); await page.waitForTimeout(200);
console.log("Vorhandener Name: kein 'neu anlegen'-Knopf:", await createBtn.count() === 0);
await search.fill("ark nova"); await page.waitForTimeout(200);
console.log("Vorhandener Name in anderer Schreibweise: kein Knopf:", await createBtn.count() === 0);
await search.fill("Cascadia"); await page.waitForTimeout(200);
console.log("Unbekannter Name: Knopf '„Cascadia“ neu anlegen' da:", await page.locator('button:has-text("Cascadia“ neu anlegen")').count() === 1);
await page.screenshot({ path: "/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad/play_new_game.png" });
await createBtn.click(); await page.waitForTimeout(500);
console.log("Nach Anlegen: Formular geht weiter (Datum-Feld da, Spiel gewaehlt):", await page.locator('label:has-text("Datum")').count() > 0 && await page.locator('span.font-medium:has-text("Cascadia")').count() > 0);
await page.locator('button:has-text("Partie speichern")').click(); await page.waitForTimeout(800);

const stored = await page.evaluate(() => ({ games: JSON.parse(localStorage.getItem("spielregal:games")), plays: JSON.parse(localStorage.getItem("spielregal:plays")) }));
const nu = stored.games.find((g) => g.name === "Cascadia");
console.log("Spiel gespeichert mit Status 'none' (Nur gespielt):", !!nu && nu.status === "none");
console.log("Partie gespeichert und verweist auf das neue Spiel:", stored.plays.length === 1 && !!nu && stored.plays[0].gameId === nu.id && stored.plays[0].gameName === "Cascadia");
console.log("Ark Nova unveraendert vorhanden (kein Duplikat):", stored.games.filter((g) => g.name === "Ark Nova").length === 1 && stored.games.length === 2);

await page.locator('button:has-text("Übersicht")').last().click(); await page.waitForTimeout(800);
const regal = await page.locator('button', { hasText: "Spiele im Regal" }).innerText();
console.log("'Spiele im Regal' zaehlt weiter nur 1 (Cascadia nicht im Regal):", regal.split("\n").includes("1"));
await b.close(); server.close();
