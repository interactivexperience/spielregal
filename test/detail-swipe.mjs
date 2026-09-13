// Prueft Swipe-Navigation auf der Spiel-Detailseite: links/rechts wischen
// wechselt zum naechsten/vorherigen Spiel in der aktuellen Liste. Die
// Cover-Flaeche (eigenes Foto-Karussell) ist davon ausgenommen, sonst
// wuerden sich "Foto weiterblaettern" und "Spiel wechseln" ins Gehege kommen.
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

const games = [
  { id: "g1", name: "Erstes Spiel", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-01" },
  { id: "g2", name: "Zweites Spiel", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-02" },
  { id: "g3", name: "Drittes Spiel", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-03" },
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

await page.locator('text=Erstes Spiel').first().click();
await page.waitForTimeout(1000);
console.log("Start:", await title());

// Ueber dem Cover wischen -> darf NICHT das Spiel wechseln (Karussell-Zone).
await touchSwipe(340, 300, 60, 300);
await page.waitForTimeout(500);
console.log("Wisch ueber Cover wechselt NICHT das Spiel:", (await title()) === "Erstes Spiel");

// Unterhalb des Covers (im normalen Content) nach links wischen -> naechstes Spiel.
await touchSwipe(340, 700, 60, 700);
await page.waitForTimeout(500);
console.log("Wisch links -> naechstes Spiel:", (await title()) === "Zweites Spiel");

await touchSwipe(340, 700, 60, 700);
await page.waitForTimeout(500);
console.log("Nochmal links -> drittes Spiel:", (await title()) === "Drittes Spiel");

// Am Ende der Liste: weiter nach links wischen darf nichts tun (kein naechstes).
await touchSwipe(340, 700, 60, 700);
await page.waitForTimeout(500);
console.log("Am Ende der Liste bleibt es beim letzten Spiel:", (await title()) === "Drittes Spiel");

// Nach rechts wischen -> zurueck zum vorherigen.
await touchSwipe(60, 700, 340, 700);
await page.waitForTimeout(500);
console.log("Wisch rechts -> zurueck zum zweiten Spiel:", (await title()) === "Zweites Spiel");
await page.screenshot({ path: `${SP}/detail_swipe.png` });

// Ueberwiegend vertikaler Wisch (Scrollen) darf nicht als Navigation zaehlen.
await touchSwipe(340, 700, 320, 400);
await page.waitForTimeout(500);
console.log("Ueberwiegend vertikaler Wisch navigiert nicht:", (await title()) === "Zweites Spiel");

await b.close(); server.close();
