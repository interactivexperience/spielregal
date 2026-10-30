// (Vorlage) Prueft das Aufraeumen der Bearbeiten-Seite: die drei Toggle-Zeilen
// (Digital/Kampagnenspiel/Verliehen) liefen vorher auf text-base (16px) und
// wichen damit von aehnlichen Zeilen (z.B. "Erweiterungen verknuepfen…",
// "Spiel entfernen") ab, die text-sm (14px) nutzen -- dadurch brach
// "Kampagnenspiel (Fortschritts-Historie)" haesslich um. Jetzt teilen sich
// alle drei dieselbe ToggleRow-Komponente mit einheitlicher Schriftgroesse.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const vendor = (...p) => path.join(__dirname, "node_modules", ...p);

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
  { id: "g1", name: "Lairs", status: "owned", format: "analog", isCampaign: false, lentTo: "", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
];
await page.addInitScript((g) => {
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
}, games);

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);
await page.locator('button:has-text("Sammlung")').last().click();
await page.waitForTimeout(800);
await page.locator('text=Lairs').first().click();
await page.waitForTimeout(1000);
const edit = page.locator('button[aria-label="Bearbeiten"], button:has-text("Bearbeiten")').first();
if (await edit.count()) { await edit.click(); await page.waitForTimeout(1000); }


let ok = true; const check = (c, m) => { console.log((c ? "OK   " : "FEHLER ") + m); if (!c) ok = false; };
check(await page.locator('text=Basisspiel suchen').count() === 0 && await page.locator('text=Gekauft bei').count() === 1, "Formular zeigt 'Gekauft bei'");
for (const l of ["Privat / Secondhand", "Onlineshop", "Spieleladen", "Spielemesse"]) check(await page.locator(`button:has-text("${l}")`).count() === 1, "Chip " + l);
await page.locator('input[placeholder="0"]').first().fill("29,90");
await page.locator('button:has-text("Spieleladen")').click();
await page.locator('button:has-text("Speichern")').last().click();
await page.waitForTimeout(800);
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:games")).find(g => g.id === "g1"));
check(saved.purchasePrice === "29,90" && saved.purchasePlace === "store", "gespeichert: " + saved.purchasePrice + " / " + saved.purchasePlace);
if (!(await page.locator('button:has-text("Mehr Details")').count())) { await page.locator("text=Lairs").first().click(); await page.waitForTimeout(900); }
const more = page.locator('button:has-text("Mehr Details")');

await page.waitForTimeout(400);
check(await page.locator('text=Kaufpreis: ').count() === 0, "Preis ist zugeklappt versteckt");
await more.click(); await page.waitForTimeout(400);
check(await page.locator('text=Kaufpreis: ').count() > 0 && await page.locator('text=Spieleladen').count() > 0, "Detailseite zeigt Preis und Ort");
await b.close(); server.close();
process.exit(ok ? 0 : 1);
