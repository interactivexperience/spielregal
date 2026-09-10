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
const fontCss = readFileSync(path.join(SP, "fonts", "embed.css"), "utf8");
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
for (const [pat, f] of [["react.production.min.js",["react","umd","react.production.min.js"]],
  ["react-dom.production.min.js",["react-dom","umd","react-dom.production.min.js"]],
  ["babel.min.js",["@babel","standalone","babel.min.js"]]])
  await p.route(`**/cdnjs.cloudflare.com/**/${pat}`, r => r.fulfill({ path: vendor(...f), contentType: "application/javascript" }));
await p.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript",
  body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await p.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: fontCss, contentType: "text/css" }));
await p.goto(url, { waitUntil: "networkidle" }); await p.waitForTimeout(2200);
await p.locator('button:has-text("Mehr")').last().click(); await p.waitForTimeout(600);
await p.locator('button:has-text("Vorschau-Modus")').first().click(); await p.waitForTimeout(500);
await p.locator('button:has-text("Demo-Vorschau anzeigen")').first().click(); await p.waitForTimeout(1000);
await p.locator('button:has-text("Sammlung")').last().click(); await p.waitForTimeout(800);
await p.evaluate(() => {
  // Hochformatiges Cover (600x900) wie ein echtes BGG-Bild
  const svg = "data:image/svg+xml;utf8," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='900'><rect width='600' height='900' fill='#8B4513'/></svg>");
  document.querySelectorAll("img").forEach((im, i) => { if (i % 2 === 0) im.src = svg; });
});
await p.locator('button:has-text("Zu zweit")').first().click(); await p.waitForTimeout(1200);
await p.evaluate(() => {
  const svg = "data:image/svg+xml;utf8," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='900'><rect width='600' height='900' fill='#8B4513'/></svg>");
  document.querySelectorAll("img").forEach((im) => { im.src = svg; });
});
await p.waitForTimeout(800);
await p.screenshot({ path: `${SP}/list_view.png` });
const m = await p.evaluate(() => {
  const grid = [...document.querySelectorAll('.grid-cols-2')].pop();
  if (!grid) return "kein Grid";
  return [...grid.children].slice(0,4).map(c => {
    const btn = c.querySelector('button');
    const box = btn && btn.querySelector('div');
    const r = e => { const b = e.getBoundingClientRect(); return `${b.width.toFixed(0)}x${b.height.toFixed(0)} @${b.x.toFixed(0)},${b.y.toFixed(0)}`; };
    return { zelle: r(c), knopf: btn ? r(btn) : "-", cover: box ? r(box) : "-" };
  });
});
console.log(JSON.stringify(m, null, 2));
await b.close(); server.close();
