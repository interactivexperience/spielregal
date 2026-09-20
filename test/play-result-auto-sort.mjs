// Prueft: die "Ergebnis"-Liste im Partie-Formular sortiert sich automatisch
// nach Punktzahl (absteigend), sobald eine Punktzahl eingetragen/geaendert
// wird -- zusaetzlich zum manuellen Ziehen per Griff. Noch unbewertete
// Mitspieler bleiben unten (stabile Sortierung bei Gleichstand/leer).
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

const players = [{ id: "p1", name: "Anna" }, { id: "p2", name: "Ben" }, { id: "p3", name: "Clara" }];
const games = [{ id: "g1", name: "Ark Nova", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" }];
await page.addInitScript((data) => {
  localStorage.setItem("spielregal:games", JSON.stringify(data.games));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:players", JSON.stringify(data.players));
  localStorage.setItem("spielregal:theme", "dark");
}, { games, players });

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2000);
await page.locator('button:has-text("Partien")').last().click();
await page.waitForTimeout(800);
await page.locator('button[aria-label="Partie eintragen"]').click();
await page.waitForTimeout(600);
await page.locator('input[placeholder*="Spiel"], input[placeholder*="suchen"]').first().fill("Ark Nova");
await page.waitForTimeout(500);
await page.locator('text=Ark Nova').first().click();
await page.waitForTimeout(600);
for (const p of players) {
  await page.locator(`p:has-text("${p.name}")`).first().locator('xpath=preceding-sibling::button[1]').click();
  await page.waitForTimeout(150);
}
await page.waitForTimeout(400);

const resultNames = () => page.locator('label:has-text("Ergebnis")').locator('xpath=following-sibling::div[1]').locator('span.text-ink').allInnerTexts();
const scoreInput = (name) => page.locator('label:has-text("Ergebnis")').locator('xpath=following-sibling::div[1]')
  .locator('div', { has: page.locator(`span.text-ink:has-text("${name}")`) }).locator('input[placeholder="Punkte"]');

console.log("Start-Reihenfolge (Auswahlreihenfolge):", JSON.stringify(await resultNames()));

// Ben bekommt die hoechste Punktzahl -> muss nach oben springen.
await scoreInput("Ben").fill("50");
await page.waitForTimeout(300);
let names = await resultNames();
console.log("Nach Ben=50: Ben steht vorn:", names[0] === "Ben");
await page.screenshot({ path: `${SP}/play_result_autosort_1.png` });

// Clara bekommt noch mehr Punkte -> muss vor Ben rutschen.
await scoreInput("Clara").fill("90");
await page.waitForTimeout(300);
names = await resultNames();
console.log("Nach Clara=90: Reihenfolge Clara, Ben, Anna:", JSON.stringify(names) === JSON.stringify(["Clara", "Ben", "Anna"]));

// Anna (noch ohne Punktzahl) bleibt unten, bis sie selbst eine Punktzahl bekommt.
console.log("Anna (noch keine Punktzahl) weiterhin am Ende:", names[names.length - 1] === "Anna");

// Anna uebertrumpft alle -> muss an die Spitze.
await scoreInput("Anna").fill("100");
await page.waitForTimeout(300);
names = await resultNames();
console.log("Nach Anna=100: Reihenfolge Anna, Clara, Ben:", JSON.stringify(names) === JSON.stringify(["Anna", "Clara", "Ben"]));
await page.screenshot({ path: `${SP}/play_result_autosort_2.png` });
await b.close();

// --- Bestehende Partie bearbeiten: die gespeicherte playerIds-Reihenfolge
// entspricht NICHT den gespeicherten Punktzahlen (z.B. weil sie beim
// urspruenglichen Eintragen in Auswahlreihenfolge gespeichert wurde, bevor
// es die automatische Sortierung gab). Direkt beim Oeffnen zum Bearbeiten
// muss die Liste trotzdem schon richtig sortiert dastehen -- nicht erst
// nachdem man eine Punktzahl anfasst.
const b2 = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page2 = await b2.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
page2.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page2.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page2.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
await page2.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page2.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript",
  body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page2.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
const existingPlay = {
  id: "play1", gameId: "g1", gameName: "Ark Nova", date: "2026-09-01", mode: "physical-owned",
  playerIds: ["p1", "p2", "p3"], // unsortierte Auswahlreihenfolge
  scores: { p1: "103", p2: "211", p3: "173" }, // p2 (Ben) hat die hoechste Punktzahl
};
await page2.addInitScript((data) => {
  localStorage.setItem("spielregal:games", JSON.stringify(data.games));
  localStorage.setItem("spielregal:plays", JSON.stringify([data.existingPlay]));
  localStorage.setItem("spielregal:players", JSON.stringify(data.players));
  localStorage.setItem("spielregal:theme", "dark");
}, { games, players, existingPlay });
await page2.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page2.waitForTimeout(2000);
await page2.locator('button:has-text("Partien")').last().click();
await page2.waitForTimeout(800);
await page2.locator('text=Ark Nova').first().click();
await page2.waitForTimeout(700);
await page2.locator('text=01.09.2026').first().click();
await page2.waitForTimeout(700);
const namesOnOpen = await page2.locator('label:has-text("Ergebnis")').locator('xpath=following-sibling::div[1]').locator('span.text-ink').allInnerTexts();
console.log("Bestehende Partie beim Oeffnen bereits nach Punktzahl sortiert (Ben, Clara, Anna):", JSON.stringify(namesOnOpen) === JSON.stringify(["Ben", "Clara", "Anna"]));
await page2.screenshot({ path: `${SP}/play_result_autosort_on_open.png` });

await b2.close(); server.close();
