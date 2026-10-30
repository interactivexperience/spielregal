// Update-Snackbar: erscheint oben, wenn der Server einen neueren Build meldet; Klick laedt neu und blendet sie aus.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const vendor = (...p) => path.join(__dirname, "node_modules", ...p);
let build = "old-1";
const server = http.createServer((req, res) => {
  try { let t = readFileSync(path.join(root, decodeURIComponent(req.url.split("?")[0])), "utf8").replace("__BUILD_ID__", build); res.writeHead(200, {"content-type":"text/html"}); res.end(t); }
  catch { res.writeHead(404); res.end("nf"); }
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await b.newPage({ viewport: { width: 390, height: 844 } });
await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript", body: "window.tailwind={config:{}};" }));
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
let ok = true; const check = (c, m) => { console.log((c ? "OK   " : "FEHLER ") + m); if (!c) ok = false; };
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
check(await page.locator("#update-banner").count() === 0, "ohne neuen Build keine Snackbar");
build = "new-2";
await page.evaluate(() => window.dispatchEvent(new Event("pageshow")));
await page.waitForSelector("#update-banner", { timeout: 5000 });
const box = await page.locator("#update-banner").boundingBox();
check(box && box.y < 20, "Snackbar sitzt oben (y=" + box?.y + ")");
check(await page.locator("#update-banner button").innerText() === "Aktualisieren", "Knopf 'Aktualisieren'");
await page.locator("#update-banner button").click();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1200);
check(await page.evaluate(() => document.querySelector('meta[name="app-build"]').content) === "new-2", "neuer Build geladen");
check(await page.locator("#update-banner").count() === 0, "Snackbar nach dem Update weg");
await b.close(); server.close(); process.exit(ok ? 0 : 1);
