// Beim Neustart des Rankings kann der alte Stand gespeichert werden; gespeicherte Staende sind einsehbar und loeschbar.
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
const page = await b.newPage({ viewport: { width: 390, height: 844 } });
let ok = true; const check = (l, c) => { console.log(l + ":", !!c); if (!c) ok = false; };
page.on("pageerror", (e) => { console.log("PAGEERROR", e.message); ok = false; });
page.on("dialog", (d) => d.accept());
await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript", body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
const base = { categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-01" };
const games = [
  { ...base, id: "b1", name: "Everdell", status: "owned" },
  { ...base, id: "e1", name: "Pearlbrook Wunsch", status: "wishlist", expansionOf: "b1" },
  { ...base, id: "e2", name: "Spirecrest Besitz", status: "owned", expansionOf: "b1" },
  { ...base, id: "b2", name: "Wingspan Wunschbasis", status: "wishlist" },
  { ...base, id: "e3", name: "Asia Wunsch", status: "wishlist", expansionOf: "b2" }];
const FILTER = process.env.FILTER || "wishlist";
await page.addInitScript((d) => { if (localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1");
  localStorage.setItem("spielregal:games", JSON.stringify(d.games)); localStorage.setItem("spielregal:plays", JSON.stringify([])); localStorage.setItem("spielregal:theme", "dark"); localStorage.setItem("spielregal:collectionStatusFilter", JSON.stringify(d.f)); }, { games, f: FILTER });
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }); await page.waitForTimeout(1500);
await page.locator('button:has-text("Sammlung")').last().click(); await page.waitForTimeout(900);
const has = async (n) => (await page.locator(`text=${n}`).count()) > 0;
if (FILTER === "wishlist") {
  check("Wunschliste: Erweiterung eines besessenen Basisspiels als eigene Karte", await has("Pearlbrook Wunsch"));
  check("Wunschliste: Wunschbasis sichtbar", await has("Wingspan Wunschbasis"));
  check("Wunschliste: Erweiterung der Wunschbasis steckt im Karussell der Basis (nicht doppelt als Karte)", (await page.locator("text=Asia Wunsch").count()) <= 1 && !(await page.locator("h3:has-text('Asia Wunsch'), p:has-text('Asia Wunsch')").count() > 1));
  check("Wunschliste: besessene Spiele nicht dabei", !(await has("Spirecrest Besitz")) && !(await has("Everdell")));
} else {
  check("Besitz: Basisspiel sichtbar, Erweiterung nur im Karussell (nicht als eigene Karte)", await has("Everdell") && (await page.locator("p:has-text('Spirecrest Besitz'), h3:has-text('Spirecrest Besitz')").count()) <= 1);
  check("Besitz: Wunsch-Erweiterung nicht als Karte", !(await has("Pearlbrook Wunsch")));
}
const cards = await page.evaluate(() => [...document.querySelectorAll("p,h3,span")].map((e) => e.textContent.trim()).filter((t) => /Pearlbrook|Spirecrest|Asia|Wingspan|Everdell/.test(t)));
console.log("Sichtbare Texte:", JSON.stringify([...new Set(cards)]));
await b.close(); server.close();
console.log(ok ? "Erweiterungen-Test bestanden" : "FEHLER"); process.exit(ok ? 0 : 1);
