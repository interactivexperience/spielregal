// Prueft einen echten Datenverlust-Bug: Firebase antwortet bei abgelehntem
// Cloud-Zugriff (z.B. abgelaufene Anmeldung) mit HTTP 200 und
// { error: "Permission denied" } im Body -- KEIN Fehler-Statuscode. Die App
// hat das vorher als "Cloud ist eben leer" gewertet und die lokale Sammlung
// beim Start stillschweigend geloescht, obwohl nur der Abruf fehlgeschlagen
// war. Jetzt darf ein leerer/abgelehnter Pull eine bereits vorhandene lokale
// Sammlung nie mehr ueberschreiben -- stattdessen wird ein Fehler angezeigt.
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

async function open({ games, syncBody, syncStatus = 200 }) {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript",
    body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
  await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
  // Simuliert die echte Firebase-RTDB-Fake-Domain aus dem Bugreport -- kein
  // echtes Netzwerk, nur die Antwortform, die den Bug ausgeloest hat.
  await page.route("**/fake-sync.test/data.json*", r => r.fulfill({ status: syncStatus, contentType: "application/json", body: JSON.stringify(syncBody) }));
  await page.addInitScript((g) => {
    localStorage.setItem("spielregal:games", JSON.stringify(g));
    localStorage.setItem("spielregal:plays", JSON.stringify([]));
    localStorage.setItem("spielregal:theme", "dark");
    localStorage.setItem("spielregal:syncUrl", "https://fake-sync.test/");
    // Bewusst KEIN apiKey gesetzt -- getValidIdToken liefert dann sofort "",
    // der Pull laeuft unauthentifiziert genau wie im echten Bugfall.
  }, games);
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2500);
  return { b, page };
}

const localGames = [
  { id: "g1", name: "Ark Nova", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
  { id: "g2", name: "Wingspan", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-02" },
];

// --- Bugfall: Firebase antwortet mit HTTP 200 + {error: "Permission denied"} ---
{
  const { b, page } = await open({ games: localGames, syncBody: { error: "Permission denied" } });
  await page.locator('button:has-text("Sammlung")').last().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SP}/sync_permission_denied.png` });
  console.log("Permission-denied-Antwort: Ark Nova bleibt sichtbar (NICHT geloescht):", await page.locator('text=Ark Nova').count() > 0);
  console.log("Permission-denied-Antwort: Wingspan bleibt sichtbar:", await page.locator('text=Wingspan').count() > 0);

  const stillInStorage = await page.evaluate(() => (JSON.parse(localStorage.getItem("spielregal:games"))||[]).length);
  console.log("localStorage haelt weiterhin beide Spiele (nicht ueberschrieben):", stillInStorage === 2);

  await page.locator('button:has-text("Mehr")').last().click();
  await page.waitForTimeout(700);
  await page.locator('text=Synchronisation').click();
  await page.waitForTimeout(700);
  console.log("Sync-Seite zeigt Fehler statt 'Synchronisiert':", await page.locator('text=Patzer beim Synchronisieren').count() > 0);
  await page.screenshot({ path: `${SP}/sync_permission_denied_settings.png` });
  await b.close();
}

// --- Cloud antwortet mit echtem null (leer, aber kein Fehler) -- lokale Daten trotzdem nie ueberschreiben ---
{
  const { b, page } = await open({ games: localGames, syncBody: null });
  await page.locator('button:has-text("Sammlung")').last().click();
  await page.waitForTimeout(800);
  console.log("Echtes 'null' von der Cloud: Ark Nova bleibt trotzdem sichtbar:", await page.locator('text=Ark Nova').count() > 0);
  await b.close();
}

// --- Erfolgsfall (Regression): echte Cloud-Daten uebernehmen lokale Daten wie vorgesehen ---
{
  const cloudGames = [
    { id: "c1", name: "Cascadia", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
  ];
  const { b, page } = await open({ games: localGames, syncBody: { games: cloudGames, plays: [] } });
  await page.locator('button:has-text("Sammlung")').last().click();
  await page.waitForTimeout(800);
  console.log("Erfolgreicher Pull uebernimmt Cloud-Spiel (Cascadia):", await page.locator('text=Cascadia').count() > 0);
  console.log("Erfolgreicher Pull ersetzt lokalen Stand (Ark Nova nicht mehr da):", await page.locator('text=Ark Nova').count() === 0);
  await b.close();
}

server.close();
