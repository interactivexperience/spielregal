// Prueft buildCollectionContextForAI direkt im gerenderten Browser-Kontext:
// Wunschlisten-Zeilen sollen jetzt dieselben Eckdaten wie Besitz-Zeilen haben,
// nicht nur den nackten Namen.
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
const page = await b.newPage({ viewport: { width: 390, height: 844 } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript",
  body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);

const result = await page.evaluate(() => {
  const games = [
    { id: "g1", name: "Ark Nova", status: "owned", minPlayers: "1", maxPlayers: "4", minTime: "90", maxTime: "150",
      complexity: 3.7, categories: ["Tiere"], mechanisms: ["Engine-Building"], rating: "9", summary: "Zoo aufbauen." },
    { id: "g2", name: "Wingspan", status: "wishlist", minPlayers: "1", maxPlayers: "5", minTime: "40", maxTime: "70",
      complexity: 2.4, categories: ["Vögel"], mechanisms: ["Kartenspiel"], summary: "Vogelreservat aufbauen." },
    { id: "g3", name: "Ödes Wunschspiel", status: "wishlist" },
  ];
  const ctx = window.buildCollectionContextForAI(games, []);
  return { hasFn: typeof window.buildCollectionContextForAI === "function", ctx };
});
console.log("Funktion gefunden:", result.hasFn);
console.log(result.ctx);
console.log("---");
console.log("Wingspan hat Eckdaten:", /Wingspan.*1-5 Spieler.*40-70 Min/.test(result.ctx));
console.log("Wingspan hat Beschreibung:", result.ctx.includes("Vogelreservat aufbauen"));
console.log("Ark Nova weiterhin mit Bewertung:", /Ark Nova.*deine Bewertung 9\/10/.test(result.ctx));
console.log("Spiel ohne Daten faellt nicht raus:", result.ctx.includes("Ödes Wunschspiel"));
console.log("Wunschliste als 'NICHT im Besitz' markiert:", result.ctx.includes("NICHT im Besitz"));
await b.close(); server.close();
