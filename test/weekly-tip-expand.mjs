// Prueft "Tipp der Woche": langer Begruendungstext startet eingeklappt
// (line-clamp-2) mit "Mehr anzeigen"-Knopf, Klick blendet den vollen Text
// ein (Knopf wird zu "Weniger"), Klick auf die Karte selbst navigiert
// weiterhin zum Spiel. Kurzer Text zeigt gar keinen Knopf.
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

async function open({ games, weeklyTip }) {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript",
    body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
  await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
  await page.addInitScript(({ games, weeklyTip }) => {
    localStorage.setItem("spielregal:games", JSON.stringify(games));
    localStorage.setItem("spielregal:plays", JSON.stringify([]));
    localStorage.setItem("spielregal:theme", "dark");
    // Kein aiWorkerUrl gesetzt -- der Fetch-Effekt fuer einen neuen Tipp
    // bricht dadurch sofort ab, der vorab gesetzte weeklyTip bleibt stehen.
    localStorage.setItem("spielregal:weeklyTip", JSON.stringify(weeklyTip));
  }, { games, weeklyTip });
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2500);
  return { b, page };
}

const games = [
  { id: "g1", name: "Ark Nova", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
];

// --- Langer Text: startet eingeklappt, laesst sich aufklappen ---
{
  const longReason = "Ark Nova wartet schon länger darauf, mal wieder auf den Tisch zu kommen, und mit dem aktuellen Wochenrhythmus passt ein etwas längeres Engine-Building-Spiel gerade richtig gut zu deiner Spiellaune der letzten Wochen.";
  const weeklyTip = { gameId: "g1", gameName: "Ark Nova", image: null, reason: longReason, generatedAt: Date.now(), fingerprint: "x" };
  const { b, page } = await open({ games, weeklyTip });

  console.log("'Tipp der Woche' sichtbar:", await page.locator('text=Tipp der Woche').count() > 0);
  const toggleBtn = page.locator('button:has-text("Mehr anzeigen")');
  console.log("Langer Text: 'Mehr anzeigen'-Knopf da:", await toggleBtn.count() > 0);

  const reasonP = page.locator('p', { hasText: "Ark Nova wartet" });
  const clampedClass = await reasonP.first().getAttribute("class");
  console.log("Eingeklappt: line-clamp-2 aktiv:", (clampedClass || "").includes("line-clamp-2"));
  const collapsedBox = await reasonP.first().boundingBox();

  await toggleBtn.click();
  await page.waitForTimeout(300);
  console.log("Nach Klick: Knopf zeigt 'Weniger':", await page.locator('button:has-text("Weniger")').count() > 0);
  const expandedClass = await reasonP.first().getAttribute("class");
  console.log("Aufgeklappt: line-clamp-2 NICHT mehr aktiv:", !(expandedClass || "").includes("line-clamp-2"));
  const expandedBox = await reasonP.first().boundingBox();
  console.log("Aufgeklappter Text ist sichtbar hoeher als eingeklappt:", expandedBox.height > collapsedBox.height);
  await page.screenshot({ path: `${SP}/weekly_tip_expanded.png` });

  // Klick auf die Karte selbst (Titel, nicht den Mehr/Weniger-Knopf) navigiert weiterhin.
  await page.locator('text=Ark Nova').first().click();
  await page.waitForTimeout(800);
  console.log("Klick auf Karte oeffnet weiterhin die Detailansicht:", await page.locator('button[aria-label="Bearbeiten"], button:has-text("Bearbeiten")').count() > 0);

  await b.close();
}

// --- Kurzer Text: kein Knopf, sofort vollstaendig sichtbar ---
{
  const shortReason = "Passt gut zu deinem Geschmack.";
  const weeklyTip = { gameId: "g1", gameName: "Ark Nova", image: null, reason: shortReason, generatedAt: Date.now(), fingerprint: "x" };
  const { b, page } = await open({ games, weeklyTip });
  console.log("Kurzer Text: kein 'Mehr anzeigen'-Knopf:", await page.locator('button:has-text("Mehr anzeigen")').count() === 0);
  console.log("Kurzer Text vollstaendig sichtbar:", await page.locator('text=Passt gut zu deinem Geschmack').count() > 0);
  await b.close();
}

server.close();
