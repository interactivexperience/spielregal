// Prueft, ob der Erweiterungs-Vorschlag in Detailansicht und Formular sichtbar ist.
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
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript",
  body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));

const games = [
  { id: "base1", name: "Brass: Birmingham", status: "owned", bggId: "224517", expansionBggIds: ["300001"], categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
  { id: "exp1", name: "Brass: Birmingham – Eisenbahn", status: "owned", bggId: "300001", baseGameBggId: "224517", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-02" },
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
await page.locator('text=Brass: Birmingham').first().click();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${SP}/exp_detail.png` });
const dt = await page.locator('text=laut BoardGameGeek').count();
console.log("Detail-Vorschlag sichtbar:", dt > 0);
if (dt > 0) console.log("  box:", JSON.stringify(await page.locator('text=laut BoardGameGeek').first().boundingBox()));

// Verknuepfen antippen und pruefen, ob die Verknuepfung greift
await page.locator('button:has-text("Verknüpfen")').first().click();
await page.waitForTimeout(900);
console.log("Vorschlag danach weg:", await page.locator('text=laut BoardGameGeek').count() === 0);
console.log("Chip vorhanden:", await page.locator('button:has-text("Brass: Birmingham – Eisenbahn")').count() > 0);
console.log("gespeichert:", await page.evaluate(() => (JSON.parse(localStorage.getItem("spielregal:games"))||[]).map(g=>[g.name,g.expansionOf||null])));
await page.screenshot({ path: `${SP}/exp_detail_after.png` });

// Formular oeffnen
const edit = page.locator('button[aria-label="Bearbeiten"], button:has-text("Bearbeiten")').first();
if (await edit.count()) { await edit.click(); await page.waitForTimeout(1200); }
await page.evaluate(() => { const el = document.querySelector('[class*="overflow-y"]'); });
const lbl = page.locator('text=Erweiterungen dieses Spiels');
console.log("Formular-Block vorhanden:", await lbl.count() > 0);
if (await lbl.count()) {
  await lbl.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SP}/exp_form.png` });
  const f = page.locator('text=Laut BoardGameGeek');
  console.log("Formular-Vorschlag sichtbar:", await f.count() > 0, await f.count() ? JSON.stringify(await f.first().boundingBox()) : "");
}
await b.close(); server.close();
