// Prueft: Spiele, die nur durch eine Browser-Partie (Saum, Glut, …) angelegt werden,
// bekommen das Cover der Umsetzung (<ordner>/cover.jpg), sodass die Partie es zeigt.
// Schon angelegte "Nur gespielt"-Spiele ohne Bild werden nachgetragen; Spiele mit
// Bild oder im Besitz bleiben unveraendert.
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



const base = { categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" };
const games = [
  { ...base, id: "gl", name: "Glut", status: "none", images: [] },                       // frueher angelegt, ohne Bild -> nachtragen
  { ...base, id: "ts", name: "Three Sisters Harvest", bggId: "291845", status: "owned", images: [] }, // im Besitz -> bleibt
  { ...base, id: "wp", name: "Wingspan", status: "none", images: [] },                   // kein Browser-Spiel -> bleibt
];
const inbox = [{ id: "sa1", source: "saum", app: "Saum", bggId: "", gameName: "Saum", date: "2026-10-02", human: "Mi", results: [{ name: "Mi", bot: false, total: 40 }, { name: "Fenn", bot: true, total: 30 }], winners: ["Mi"] }];
await page.addInitScript((d) => {
  if (localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1");
  localStorage.setItem("spielregal:games", JSON.stringify(d.games));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:inbox:plays", JSON.stringify(d.inbox));
  localStorage.setItem("spielregal:theme", "dark");
}, { games, inbox });
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);
const st = await page.evaluate(() => ({ games: JSON.parse(localStorage.getItem("spielregal:games")), plays: JSON.parse(localStorage.getItem("spielregal:plays")) }));
const by = (n) => st.games.find((g) => g.name === n);
console.log("Saum neu angelegt mit Cover saum/cover.jpg:", !!by("Saum") && by("Saum").status === "none" && JSON.stringify(by("Saum").images) === JSON.stringify(["saum/cover.jpg"]));
console.log("Glut (frueher ohne Bild) bekommt glut/cover.jpg nachgetragen:", JSON.stringify(by("Glut").images) === JSON.stringify(["glut/cover.jpg"]));
console.log("Spiel im Besitz bleibt ohne Bild:", by("Three Sisters Harvest").images.length === 0);
console.log("Fremdes Nur-gespielt-Spiel bleibt ohne Bild:", by("Wingspan").images.length === 0);
console.log("Partie verweist auf Saum:", st.plays.length === 1 && st.plays[0].gameId === by("Saum").id);
await page.locator('button:has-text("Partien")').last().click(); await page.waitForTimeout(900);
const img = page.locator('button:has-text("Saum") img').first();
console.log("Partien-Liste zeigt das Saum-Cover:", await img.count() === 1 && (await img.getAttribute("src")) === "saum/cover.jpg");
console.log("Cover-Datei wird wirklich geladen (nicht kaputt):", await img.evaluate((el) => el.complete && el.naturalWidth > 0));
await page.screenshot({ path: "/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad/digital_cover.png" });
await b.close(); server.close();
