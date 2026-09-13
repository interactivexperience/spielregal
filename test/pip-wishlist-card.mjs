// Prueft den kompletten Weg: Pip empfiehlt ein Wunschlisten-Spiel per
// SPIEL:-Marker -> Karte zeigt Cover, Titel UND das "Auf der Wunschliste"-
// Badge (bisher nur bei fremden BGG-Spielen, jetzt auch bei eigenen
// Wunschlisten-Spielen, damit nie der Eindruck entsteht, das Spiel stuende
// schon im Regal).
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

let call = 0;
const antwortMitBegruendung = `**Wingspan**\nEin ruhiges Kartenspiel, in dem du ein Vogelreservat aufbaust — 1-5 Spieler, 40-70 Min.\n\nDas passt zu dir, weil du Ark Nova stark magst (9/10) und dort schon Engine-Building/Sammel-Mechanik feierst — Wingspan bedient dieselbe Nische, nur leichter und kürzer. Wo es NICHT perfekt passt: du hast mit Ark Nova schon ein großes Engine-Building-Spiel im Regal, Wingspan könnte sich dagegen etwas duenn anfuehlen.\nSPIEL: Wingspan`;
await page.route("**/fake-pip-worker.test/**", (route) => {
  call += 1;
  const body = call === 1
    ? JSON.stringify({ text: "Hey, ich bin Pip! Worum soll's heute gehen?" })
    : JSON.stringify({ text: antwortMitBegruendung });
  route.fulfill({ contentType: "application/json", body });
});

const games = [
  { id: "g1", name: "Ark Nova", status: "owned", bggId: "342942", minPlayers: "1", maxPlayers: "4", minTime: "90", maxTime: "150",
    complexity: 3.7, categories: ["Tiere"], mechanisms: ["Engine-Building"], rating: "9", addedDate: "2026-01-01" },
  { id: "g2", name: "Wingspan", status: "wishlist", bggId: "266192", minPlayers: "1", maxPlayers: "5", minTime: "40", maxTime: "70",
    complexity: 2.4, categories: ["Vögel"], mechanisms: ["Kartenspiel"], addedDate: "2026-01-02" },
];
await page.addInitScript((g) => {
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
  localStorage.setItem("spielregal:aiWorkerUrl", "https://fake-pip-worker.test/chat");
}, games);

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);
await page.locator('button:has-text("Ideen")').last().click();
await page.waitForTimeout(1500);

const input = page.locator('input[placeholder="Schreib Pip…"]').last();
await input.fill("Empfiehl mir ein Spiel, das zu Ark Nova passt");
await page.keyboard.press("Enter");
await page.waitForTimeout(1500);

await page.screenshot({ path: `${SP}/pip_wishlist_card.png` });
console.log("Karte mit Wingspan-Titel:", await page.locator('text=Wingspan').count() > 0);
console.log("Wunschlisten-Badge sichtbar:", await page.locator('text=Auf der Wunschliste').count() > 0);
console.log("Begründungstext (passt zu dir) sichtbar:", await page.locator('text=Das passt zu dir').count() > 0);
console.log("SPIEL:-Marker NICHT sichtbar (wurde geparst/entfernt):", await page.locator('text=SPIEL:').count() === 0);

// Klick auf die Karte muss in die Detailansicht des Wunschlisten-Spiels fuehren
await page.locator('text=Wingspan').last().click();
await page.waitForTimeout(1000);
await page.screenshot({ path: `${SP}/pip_wishlist_detail.png` });
console.log("Detailansicht geoeffnet:", await page.locator('text=Wunschliste').count() > 0);

await b.close(); server.close();
