// Prueft die Personalisierung des KI-Exports: Besitz steht immer drin,
// Wunschliste/Nur-Gespielt/Beschreibung sind an-/abwaehlbar und die Wahl
// wird gemerkt (localStorage).
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
  { id: "g1", name: "Ark Nova", status: "owned", summary: "Baue den besten Zoo.", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
  { id: "g2", name: "Wingspan", status: "wishlist", summary: "Sammle Voegel.", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-02" },
  { id: "g3", name: "Catan", status: "none", summary: "Handel und baue.", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-03" },
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
await page.screenshot({ path: `${SP}/export_default.png` });

const exportTextarea = page.locator("textarea");
const textDefault = await exportTextarea.inputValue();
console.log("Standard: Ark Nova (Besitz) drin:", textDefault.includes("Ark Nova"));
console.log("Standard: Wingspan (Wunschliste) drin:", textDefault.includes("Wingspan"));
console.log("Standard: Catan (nur gespielt) drin:", textDefault.includes("Catan"));
console.log("Standard: Beschreibung drin:", textDefault.includes("Baue den besten Zoo"));

// "Im Besitz" ist NICHT als Umschalter anfassbar (kein toggle-Button, nur ein Hinweis).
console.log("'Im Besitz' zeigt 'immer dabei', kein Umschalter:", await page.locator('text=immer dabei').count() > 0);

// Wunschliste abwaehlen.
await page.locator('button:has-text("Wunschliste")').click();
await page.waitForTimeout(300);
const textNoWishlist = await exportTextarea.inputValue();
console.log("Nach Abwaehlen: Wingspan raus:", !textNoWishlist.includes("Wingspan"));
console.log("Nach Abwaehlen: Ark Nova bleibt (Besitz immer drin):", textNoWishlist.includes("Ark Nova"));

// Beschreibung abwaehlen.
await page.locator('button:has-text("Beschreibungstext je Spiel")').click();
await page.waitForTimeout(300);
const textNoSummary = await exportTextarea.inputValue();
console.log("Nach Abwaehlen: Beschreibung raus:", !textNoSummary.includes("Baue den besten Zoo"));
console.log("Nach Abwaehlen: Spielname bleibt:", textNoSummary.includes("Ark Nova"));
await page.screenshot({ path: `${SP}/export_customized.png` });

// Wahl wird gemerkt (Reload).
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.locator('button:has-text("Mehr")').last().click();
await page.waitForTimeout(700);
await page.locator('text=Für KI exportieren').click();
await page.waitForTimeout(700);
const textAfterReload = await page.locator("textarea").inputValue();
console.log("Wahl bleibt nach Reload gemerkt (Wingspan weiterhin raus):", !textAfterReload.includes("Wingspan"));
console.log("Wahl bleibt nach Reload gemerkt (Beschreibung weiterhin raus):", !textAfterReload.includes("Baue den besten Zoo"));

await b.close(); server.close();
