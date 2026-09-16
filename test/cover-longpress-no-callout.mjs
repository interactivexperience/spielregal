// Prueft den Fix fuer: Long-Press auf ein Cover in der Sammlung zeigt zwar
// korrekt das Bearbeiten-/Loeschen-Menue, aber das Cover selbst vergroesserte
// sich dabei kurz -- iOS' eigene Bild-Vorschau/Drag-Ghost-Vorschau feuerte
// parallel zum eigenen Long-Press-Handler. Nicht per getComputedStyle
// pruefbar (Chromium kennt -webkit-touch-callout gar nicht, nur Safari/iOS),
// deshalb: Attribut/Klasse auf dem <img> UND die tatsaechliche CSS-Regel im
// Stylesheet selbst nachweisen.
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

const PIXEL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3Crect width='2' height='2' fill='%23f00'/%3E%3C/svg%3E";
const games = [
  { id: "g1", name: "Ark Nova", status: "owned", images: [PIXEL], categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
];
await page.addInitScript((g) => {
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
}, games);

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);
await page.locator('button:has-text("Sammlung")').last().click();
await page.waitForTimeout(900);

const coverImg = page.locator('img[alt="Ark Nova"]').first();
console.log("Cover-<img> hat draggable=false (kein Browser-Drag-Ghost):", await coverImg.evaluate((el) => el.draggable) === false);
console.log("Cover-<img> hat die no-callout-Klasse:", (await coverImg.getAttribute("class") || "").includes("no-callout"));

// Chromium kennt -webkit-touch-callout gar nicht (nur Safari/iOS) und
// streicht die Deklaration beim Parsen aus der CSSOM-Serialisierung --
// getComputedStyle/cssRules wuerden sie hier faelschlich als "fehlend"
// melden. Deshalb direkt den Quelltext pruefen statt den geparsten Regelsatz.
const source = readFileSync(path.join(repoRoot, "index.html"), "utf8");
const ruleMatch = source.match(/\.no-callout\s*\{([^}]*)\}/);
const ruleBody = ruleMatch ? ruleMatch[1] : "";
console.log("CSS-Regel .no-callout enthaelt -webkit-touch-callout: none:", /-webkit-touch-callout:\s*none/.test(ruleBody));
console.log("CSS-Regel .no-callout enthaelt user-select: none:", /(?<!-webkit-)user-select:\s*none/.test(ruleBody));

await b.close(); server.close();
