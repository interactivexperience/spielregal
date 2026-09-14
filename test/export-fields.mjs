// Prueft die einzeln abwaehlbaren Datenfelder pro Spiel im KI-Export
// (Jahr, Verlag, Spieleranzahl, Dauer, Komplexitaet, Bewertung, Themen,
// Beschreibungstext) -- Grund: bei einer grossen Sammlung wird der Export
// sonst zu lang, um ihn noch sinnvoll in eine externe KI einzufuegen.
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
  { id: "g1", name: "Ark Nova", status: "owned", year: "2021", publishers: ["Feuerland"], minPlayers: "1", maxPlayers: "4",
    minTime: "90", maxTime: "150", complexity: "3.7", rating: "9", categories: ["Tiere"], mechanisms: ["Engine-Building"],
    summary: "Baue den besten Zoo.", designers: [], addedDate: "2026-01-01" },
];
await page.addInitScript((g) => {
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
}, games);

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);
await page.locator('button:has-text("Mehr")').last().click();
await page.waitForTimeout(700);
await page.locator('text=Für KI exportieren').click();
await page.waitForTimeout(700);

const exportTextarea = page.locator("textarea");
const t0 = await exportTextarea.inputValue();
console.log("Standard: Jahr drin:", t0.includes("2021"));
console.log("Standard: Verlag drin:", t0.includes("Feuerland"));
console.log("Standard: Spieleranzahl drin:", t0.includes("1-4 Spieler"));
console.log("Standard: Dauer drin:", t0.includes("90-150 Min."));
console.log("Standard: Komplexität drin:", t0.includes("Komplexität:"));
console.log("Standard: Bewertung drin:", t0.includes("Bewertung: 9/10"));
console.log("Standard: Themen drin:", t0.includes("Themen:"));
console.log("Standard: Beschreibung drin:", t0.includes("Baue den besten Zoo"));

// Einzelne Felder abwaehlen und pruefen, dass NUR das jeweilige Feld
// verschwindet, der Rest (insbesondere der Spielname) bleibt.
await page.locator('button:has-text("Jahr")').click();
await page.waitForTimeout(200);
let t = await exportTextarea.inputValue();
console.log("Nach Abwählen 'Jahr': Jahr weg, Name bleibt:", !t.includes("Jahr: 2021") && t.includes("Ark Nova"));

await page.locator('button:has-text("Verlag")').click();
await page.waitForTimeout(200);
t = await exportTextarea.inputValue();
console.log("Nach Abwählen 'Verlag': Feuerland weg:", !t.includes("Feuerland"));

await page.locator('button:has-text("Spieleranzahl")').click();
await page.waitForTimeout(200);
t = await exportTextarea.inputValue();
console.log("Nach Abwählen 'Spieleranzahl': weg:", !t.includes("1-4 Spieler"));

await page.locator('button:has-text("Spieldauer")').click();
await page.waitForTimeout(200);
t = await exportTextarea.inputValue();
console.log("Nach Abwählen 'Spieldauer': weg:", !t.includes("90-150 Min."));

await page.locator('button:has-text("Komplexität")').click();
await page.waitForTimeout(200);
t = await exportTextarea.inputValue();
console.log("Nach Abwählen 'Komplexität': weg:", !t.includes("Komplexität:"));

await page.locator('button:has-text("Deine Bewertung")').click();
await page.waitForTimeout(200);
t = await exportTextarea.inputValue();
console.log("Nach Abwählen 'Deine Bewertung': weg:", !t.includes("Bewertung: 9/10"));

await page.locator('button:has-text("Themen")').click();
await page.waitForTimeout(200);
t = await exportTextarea.inputValue();
console.log("Nach Abwählen 'Themen': weg:", !t.includes("Themen:"));
console.log("Nach Abwählen aller Felder: Spielname (Ark Nova) bleibt weiterhin:", t.includes("Ark Nova"));
console.log("Nach Abwählen aller Felder: Beschreibung ist weiterhin da (eigener Schalter, nicht betroffen):", t.includes("Baue den besten Zoo"));
await page.screenshot({ path: `${SP}/export_fields_all_off.png` });

// Reload: Wahl bleibt gemerkt.
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.locator('button:has-text("Mehr")').last().click();
await page.waitForTimeout(700);
await page.locator('text=Für KI exportieren').click();
await page.waitForTimeout(700);
const tAfterReload = await page.locator("textarea").inputValue();
console.log("Wahl bleibt nach Reload gemerkt (Jahr weiterhin weg):", !tAfterReload.includes("Jahr: 2021"));

await b.close(); server.close();
