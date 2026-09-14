// Prueft einen echten Bug: das VOLLBILD-Foto (Lightbox, oeffnet sich per Tap
// aufs Cover) lag NICHT in der data-swipe-exempt-Zone. Wiederholtes Wischen
// durch die Fotos dort hat deshalb gleichzeitig auch das Spiel gewechselt.
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
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript",
  body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));

const PIXEL_RED = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3Crect width='2' height='2' fill='%23f00'/%3E%3C/svg%3E";
const PIXEL_BLUE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3Crect width='2' height='2' fill='%2300f'/%3E%3C/svg%3E";
const PIXEL_GREEN = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3Crect width='2' height='2' fill='%230f0'/%3E%3C/svg%3E";
const games = [
  { id: "g1", name: "Erstes Spiel", status: "owned", images: [PIXEL_RED, PIXEL_BLUE, PIXEL_GREEN], categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
  { id: "g2", name: "Zweites Spiel", status: "owned", images: [], categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-02" },
];
await page.addInitScript((g) => {
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
}, games);

async function touchSwipe(x1, y1, x2, y2) {
  await page.evaluate(([x1, y1, x2, y2]) => {
    const el = document.elementFromPoint(x1, y1);
    const mk = (x, y) => new Touch({ identifier: 1, target: el, clientX: x, clientY: y, pageX: x, pageY: y });
    const t1 = mk(x1, y1);
    el.dispatchEvent(new TouchEvent("touchstart", { touches: [t1], targetTouches: [t1], changedTouches: [t1], bubbles: true, cancelable: true }));
    const t2 = mk(x2, y2);
    el.dispatchEvent(new TouchEvent("touchend", { touches: [], targetTouches: [], changedTouches: [t2], bubbles: true, cancelable: true }));
  }, [x1, y1, x2, y2]);
}
const title = () => page.locator("h1").last().innerText();

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);
await page.locator('button:has-text("Sammlung")').last().click();
await page.waitForTimeout(900);
await page.locator('text=Erstes Spiel').first().click();
await page.waitForTimeout(1000);
console.log("Start:", await title());

// Cover antippen -> Vollbild-Lightbox oeffnet sich. Das Karussell stapelt
// mehrere Karten uebereinander (Reihenfolge [2,1,0]) -- die vorderste, per
// onClick anklickbare, steht dadurch als LETZTES im DOM.
await page.locator('img[alt="Foto"]').last().click();
await page.waitForTimeout(500);
const lightboxOpen = await page.locator('img[alt="Foto vergrößert"]').count() > 0;
console.log("Lightbox geoeffnet:", lightboxOpen);
await page.screenshot({ path: `${SP}/lightbox_open.png` });

// Mehrfach durch die Fotos wischen (imitiert "swipe oft").
for (let i = 0; i < 4; i++) {
  await touchSwipe(340, 400, 60, 400);
  await page.waitForTimeout(350);
}
await page.screenshot({ path: `${SP}/lightbox_after_swipes.png` });
console.log("Lightbox noch offen (kein versehentliches Schliessen):", await page.locator('img[alt="Foto vergrößert"]').count() > 0);

// Lightbox schliessen, pruefen dass wir IMMER NOCH auf demselben Spiel sind.
await page.locator('img[alt="Foto vergrößert"]').first().click();
await page.waitForTimeout(500);
console.log("Nach dem Schliessen weiterhin 'Erstes Spiel' (nicht zu 'Zweites Spiel' gewechselt):", (await title()) === "Erstes Spiel");

await b.close(); server.close();
