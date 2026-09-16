// Prueft: im KI-Export sind bereits verkaufte Spiele (saleStatus "sold")
// standardmaessig aus dem "Im Besitz"-Abschnitt ausgeblendet -- analog zum
// bestehenden Sammlung-Filter. "Zum Verkauf markiert" (noch aktuell
// besessen) bleibt dagegen immer drin. Erst aktives Einschalten von
// "Bereits verkaufte Spiele" zeigt sie mit dazu.
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
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript",
  body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));

const games = [
  { id: "g1", name: "Ark Nova", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
  { id: "g2", name: "Trubel im Turm", status: "owned", saleStatus: "sold", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-02" },
  { id: "g3", name: "Sternenreich", status: "owned", saleStatus: "forSale", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-03" },
];
await page.addInitScript((g) => {
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
}, games);

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);
await page.locator('button:has-text("Mehr")').last().click();
await page.waitForTimeout(700);
await page.locator('text=Für KI exportieren').click();
await page.waitForTimeout(700);

const exportTextarea = page.locator("textarea");
const t0 = await exportTextarea.inputValue();
console.log("Standard: Ark Nova (normal) drin:", t0.includes("Ark Nova"));
console.log("Standard: Sternenreich (zum Verkauf, noch besessen) drin:", t0.includes("Sternenreich"));
console.log("Standard: Trubel im Turm (bereits verkauft) NICHT drin:", !t0.includes("Trubel im Turm"));
await page.screenshot({ path: `${SP}/export_sold_default.png` });

await page.locator('button:has-text("Bereits verkaufte Spiele")').click();
await page.waitForTimeout(300);
const t1 = await exportTextarea.inputValue();
console.log("Nach Einschalten: Trubel im Turm jetzt drin:", t1.includes("Trubel im Turm"));
console.log("Nach Einschalten: Ark Nova weiterhin drin:", t1.includes("Ark Nova"));
await page.screenshot({ path: `${SP}/export_sold_shown.png` });

// Reload: Wahl bleibt gemerkt.
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.locator('button:has-text("Mehr")').last().click();
await page.waitForTimeout(700);
await page.locator('text=Für KI exportieren').click();
await page.waitForTimeout(700);
const t2 = await page.locator("textarea").inputValue();
console.log("Wahl bleibt nach Reload gemerkt (Trubel im Turm weiterhin drin):", t2.includes("Trubel im Turm"));

await b.close(); server.close();
