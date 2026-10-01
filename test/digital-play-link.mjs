import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const vendor = (...p) => path.join(__dirname, "node_modules", ...p);

const server = http.createServer((req, res) => {
  // Ordner-URLs wie GitHub Pages auf index.html abbilden
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  let body;
  try { body = readFileSync(path.join(repoRoot, p)); } catch { res.writeHead(404); res.end("nf"); return; }
  res.writeHead(200, p.endsWith(".html") ? { "content-type": "text/html; charset=utf-8" } : {});
  res.end(body);
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


// Prueft den Link "Im Browser spielen" auf der Detailseite: erscheint nur bei
// Spielen mit eigener Browser-Umsetzung (hier Grand Austria Hotel) und fuehrt
// zur Spielseite grand-austria-hotel/.
const SP = process.argv[2];
const games = [
  { id: "g1", name: "Grand Austria Hotel", bggId: "182874", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-01" },
  { id: "g2", name: "Anderes Spiel", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-02" },
  { id: "g3", name: "Three Sisters", bggId: "291845", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-03" },
  { id: "g4", name: "Rebel Princess", bggId: "381249", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-04" },
  { id: "g5", name: "Landgut", bggId: "424242", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-05" },
];
await page.addInitScript((g) => {
  if (location.pathname.endsWith("/index.html") && !location.pathname.includes("grand-austria")) {
    localStorage.setItem("spielregal:games", JSON.stringify(g));
    localStorage.setItem("spielregal:plays", JSON.stringify([]));
  }
}, games);
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);
await page.locator('button:has-text("Sammlung")').last().click();
await page.waitForTimeout(500);
let fehler = 0;
await page.locator("text=Anderes Spiel").first().click();
await page.waitForTimeout(800);
if (await page.locator("text=Im Browser spielen").count()) { console.log("FEHLER: Link bei falschem Spiel"); fehler++; }
await page.locator('[aria-label="Zurück"]').first().click();
await page.waitForTimeout(500);
for (const [name, href] of [["Three Sisters", "three-sisters/"], ["Rebel Princess", "rebel-princess/"], ["Landgut", "countryside/"]]) {
  await page.locator(`text=${name}`).first().click();
  await page.waitForTimeout(800);
  const l = page.locator("a:has-text('Im Browser spielen')");
  if ((await l.count()) !== 1 || (await l.getAttribute("href")) !== href) { console.log(`FEHLER: Link bei ${name}`); fehler++; }
  await page.locator('[aria-label="Zurück"]').first().click();
  await page.waitForTimeout(500);
}
await page.locator("text=Grand Austria Hotel").first().click();
await page.waitForTimeout(800);
const link = page.locator("a:has-text('Im Browser spielen')");
if ((await link.count()) !== 1) { console.log("FEHLER: Link fehlt"); fehler++; }
else {
  await link.scrollIntoViewIfNeeded();
  if (SP) await page.screenshot({ path: `${SP}/detail-link.png` });
  await link.click();
  await page.waitForURL(/grand-austria-hotel\/$/, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(800);
  if (!(await page.locator("text=Hotel eröffnen").count())) { console.log("FEHLER: Spielseite nicht geladen: " + page.url()); fehler++; }
}
await b.close(); server.close();
if (fehler) process.exit(1);
console.log("OK — Links erscheinen nur bei Spielen mit Browser-Umsetzung und öffnen das Spiel.");
