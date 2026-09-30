// Prueft zwei Aenderungen am KI-Export ("Fuer KI exportieren"):
// 1. Zum-Verkauf-markierte (und bei aktivem Schalter auch bereits
//    verkaufte) Spiele waren zwar schon immer in der Liste enthalten, aber
//    OHNE jede sichtbare Kennzeichnung -- man konnte im Text nicht
//    unterscheiden, ob ein Spiel noch ganz normal in der Sammlung ist oder
//    gerade zum Verkauf steht/schon weg ist. Zum-Verkauf-Spiele bekommen einen
//    "STATUS: ..."-Hinweis, bereits verkaufte stehen in einem eigenen
//    Abschnitt "BEREITS VERKAUFT" statt unter "IM BESITZ".
// 2. Beschreibungstext ist jetzt standardmaessig AUS (kuerzerer Export),
//    der Schalter "Beschreibungstext" existiert weiterhin zum manuellen
//    Einschalten.
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
  { id: "g1", name: "Ark Nova", status: "owned", summary: "<p>Eine Aufbau-Erfahrung im Zoo.</p>", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
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
console.log("Standard: Sternenreich (zum Verkauf) im Export enthalten:", t0.includes("Sternenreich"));
console.log("Standard: Sternenreich zeigt STATUS-Hinweis 'zum Verkauf markiert':", /Sternenreich[^\n]*STATUS: zum Verkauf markiert/.test(t0));
console.log("Standard: Ark Nova (normal, kein Verkaufsstatus) OHNE STATUS-Hinweis:", !/Ark Nova[^\n]*STATUS:/.test(t0));
console.log("Standard: Beschreibungstext NICHT enthalten (neuer Default aus):", !t0.includes("Beschreibung:"));
await page.screenshot({ path: `${SP}/export_sale_status_default.png` });

// Bereits verkaufte Spiele einschalten -> Trubel im Turm erscheint MIT
// STATUS-Hinweis "bereits verkauft".
await page.locator('button:has-text("Bereits verkaufte Spiele")').click();
await page.waitForTimeout(300);
const t1 = await exportTextarea.inputValue();
const soldSection = t1.split("=== BEREITS VERKAUFT")[1] || "";
const ownedSection = (t1.split("=== IM BESITZ")[1] || "").split("===")[0];
console.log("Nach Einschalten 'Bereits verkaufte Spiele': Trubel im Turm steht im eigenen Abschnitt BEREITS VERKAUFT:", soldSection.includes("Trubel im Turm"));
console.log("Nach Einschalten: Trubel im Turm steht NICHT unter IM BESITZ:", !ownedSection.includes("Trubel im Turm"));

// Beschreibungstext manuell einschalten -> Beschreibung erscheint wieder.
await page.locator('button:has-text("Beschreibungstext")').click();
await page.waitForTimeout(300);
const t2 = await exportTextarea.inputValue();
console.log("Nach Einschalten 'Beschreibungstext': Beschreibung wieder da:", t2.includes("Aufbau-Erfahrung im Zoo"));
await page.screenshot({ path: `${SP}/export_sale_status_toggled.png` });

await b.close(); server.close();
