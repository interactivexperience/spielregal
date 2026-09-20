// Prueft den Fix fuer: Drag-Handles zum Umsortieren per Touch (GripVertical-
// Icon) liessen sich nicht ziehen, obwohl der Indikator da war. Root Cause:
// React haengt onTouchMove standardmaessig als PASSIVEN Listener an -- das
// e.preventDefault() in den handleTouchMove-Funktionen schlaegt dadurch
// lautlos fehl ("Unable to preventDefault inside passive event listener
// invocation" in der Konsole), das native Scrollen gewinnt gegen das Ziehen,
// bevor JS ueberhaupt reagieren kann. Fix: style={touchAction: "none"}
// direkt und STATISCH auf dem Griff selbst (nicht nur bedingt auf dem
// Container waehrend des Ziehens) -- der Browser entscheidet schon beim
// touchstart anhand von touch-action, ob er scrollen darf, unabhaengig von
// JS/preventDefault.
//
// Betroffen waren drei Stellen mit demselben kopierten Drag-Pattern:
// 1. Partie-Formular, "Ergebnis"-Liste (der konkret gemeldete Bug)
// 2. Mitspieler-"Reihenfolge"-Screen
// 3. Dashboard-"Sektionen"-Screen (Anordnen & Ausblenden)
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
const context = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const page = await context.newPage();
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

// --- 1. Partie-Formular, "Ergebnis"-Liste ---
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

const resultHandle = page.locator('label:has-text("Ergebnis")').locator('xpath=following-sibling::div[1]').locator('div.text-dim.p-1').first();
const resultTouchAction = await resultHandle.evaluate((el) => getComputedStyle(el).touchAction);
console.log("Ergebnis-Liste (Partie-Formular): Griff hat touch-action none:", resultTouchAction === "none");

// Funktionaler Nachweis: tatsaechliches Ziehen per Touch-Event-Sequenz
// aendert die Reihenfolge (Anna -> Position von Clara).
const namesBefore = await page.locator('label:has-text("Ergebnis")').locator('xpath=following-sibling::div[1]').locator('span.text-ink').allInnerTexts();
const box = await resultHandle.boundingBox();
const rows = page.locator('label:has-text("Ergebnis")').locator('xpath=following-sibling::div[1]/div');
const thirdRowBox = await rows.nth(2).boundingBox();
const startX = box.x + box.width / 2, startY = box.y + box.height / 2;
const endY = thirdRowBox.y + thirdRowBox.height / 2;
const cdp = await context.newCDPSession(page);
await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: startX, y: startY }] });
for (let i = 1; i <= 10; i++) {
  const y = startY + (endY - startY) * (i / 10);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: startX, y }] });
  await page.waitForTimeout(25);
}
await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await page.waitForTimeout(400);
const namesAfter = await page.locator('label:has-text("Ergebnis")').locator('xpath=following-sibling::div[1]').locator('span.text-ink').allInnerTexts();
console.log("Ergebnis-Liste: Ziehen aendert tatsaechlich die Reihenfolge:", JSON.stringify(namesBefore) !== JSON.stringify(namesAfter));
await page.screenshot({ path: `${SP}/drag_result_list.png` });

// --- 2. Mitspieler-"Reihenfolge"-Screen ---
await page.locator('text=Reihenfolge').first().click();
await page.waitForTimeout(500);
const playerOrderHandle = page.locator('h2:has-text("Reihenfolge")').locator('xpath=ancestor::div[contains(@class,"rise-in") or contains(@class,"sheet-out")][1]').locator('div.text-dim.p-2').first();
const playerOrderTouchAction = await playerOrderHandle.evaluate((el) => getComputedStyle(el).touchAction);
console.log("Mitspieler-Reihenfolge-Screen: Griff hat touch-action none:", playerOrderTouchAction === "none");
await page.locator('button:has-text("Fertig")').first().click();
await page.waitForTimeout(300);
await b.close();

// --- 3. Dashboard-"Sektionen"-Screen -- die Sortier-Sheet-Navigation dahin
// ist in der Headless-Emulation ueberlagerungs-anfaellig (Bottom-Nav vs.
// dvh-Viewport, unabhaengig vom hier getesteten Fix), deshalb per
// Quelltext-Pruefung statt UI-Klickpfad: dieselbe Zeile wie bei den beiden
// oben live bewiesenen Stellen.
const source = readFileSync(path.join(repoRoot, "index.html"), "utf8");
const dashboardReorderFn = source.slice(source.indexOf("function DashboardReorderScreen("), source.indexOf("function DashboardReorderScreen(") + 4000);
console.log("Dashboard-Sektionen-Screen: Griff-Quelltext hat touchAction none:",
  /className="text-dim p-2 -mr-2"\s*\n\s*style=\{\{ touchAction: "none" \}\}/.test(dashboardReorderFn));

server.close();
