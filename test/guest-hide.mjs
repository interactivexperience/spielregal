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
const base = { categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-01", status: "owned" };
const games = [{ ...base, id: "a", name: "Azul Frei" }, { ...base, id: "b", name: "Brass Verliehen", lentTo: "Tom" },
  { ...base, id: "c", name: "Catan Wunsch", status: "wishlist" }, { ...base, id: "d", name: "Dixit Verkauft", saleStatus: "sold" }, { ...base, id: "e", name: "Everdell Frei" }];
const GUEST = process.env.GUEST !== "0";
await page.addInitScript((d) => { if (localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1");
  localStorage.setItem("spielregal:games", JSON.stringify(d.games)); localStorage.setItem("spielregal:plays", JSON.stringify([])); localStorage.setItem("spielregal:theme", "dark");
  if (d.guest) localStorage.setItem("spielregal:guestMode", JSON.stringify(true)); else localStorage.setItem("spielregal:collectionStatusFilter", JSON.stringify("all")); }, { games, guest: GUEST });
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }); await page.waitForTimeout(1800);
if (!GUEST) await page.locator('button:has-text("Sammlung")').last().click();
await page.waitForTimeout(900);
const has = async (n) => (await page.locator(`text=${n}`).count()) > 0;
if (GUEST) {
  check("Gast: freie besessene Spiele sichtbar", await has("Azul Frei") && await has("Everdell Frei"));
  check("Gast: verliehenes Spiel ausgeblendet", !(await has("Brass Verliehen")));
  check("Gast: Wunschliste und verkaufte weiter ausgeblendet", !(await has("Catan Wunsch")) && !(await has("Dixit Verkauft")));
  await page.locator('button[aria-label="Filter"]').first().click(); await page.waitForTimeout(600);
  check("Gast: Filter ohne Status/Besitz", (await page.locator("label:has-text('Status')").count()) === 0 && (await page.locator('button:has-text("Besitz")').count()) === 0);
  check("Gast: restliche Filter weiter da (Sortierung)", (await page.locator("text=Sortieren").count()) + (await page.locator("select").count()) > 0);
} else {
  check("Normal: verliehenes Spiel sichtbar", await has("Brass Verliehen") && await has("Catan Wunsch"));
  await page.locator('button[aria-label="Filter"]').first().click(); await page.waitForTimeout(600);
  check("Normal: Status-Filter mit Besitz vorhanden", (await page.locator("label:has-text('Status')").count()) === 1 && (await page.locator('button:has-text("Besitz")').count()) >= 1);
}
await b.close(); server.close();
console.log(ok ? "Gast-Test bestanden" : "FEHLER"); process.exit(ok ? 0 : 1);
