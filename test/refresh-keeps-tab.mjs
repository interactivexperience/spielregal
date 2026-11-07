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
const games = [{ ...base, id: "a", name: "Azul" }, { ...base, id: "b", name: "Brass" }];
const plays = games.map((g) => ({ id: "p" + g.id, gameId: g.id, gameName: g.name, date: "2026-09-01", mode: "physical-owned", players: "", playerIds: [], winner: "", scores: {}, notes: "", images: [] }));
await page.addInitScript((d) => { if (localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1"); localStorage.setItem("spielregal:games", JSON.stringify(d.games)); localStorage.setItem("spielregal:plays", JSON.stringify(d.plays)); localStorage.setItem("spielregal:theme", "dark"); }, { games, plays });
await page.goto(url, { waitUntil: "networkidle" }); await page.waitForTimeout(1500);
const where = () => page.evaluate(() => { const h = document.querySelector("h1"); return (h && h.textContent || "").trim(); });
check("Start: Uebersicht (" + await where() + ")", /Übersicht|Spielregal|Hallo|Guten/i.test(await where()) || (await where()) !== "Sammlung");
for (const [label, expect] of [["Sammlung", "Sammlung"], ["Partien", "Partien"], ["Mehr", "Einstellungen"]]) {
  await page.locator(`button:has-text("${label}")`).last().click(); await page.waitForTimeout(700);
  const here = await where();
  await page.goto(url + "?refresh=" + Date.now(), { waitUntil: "networkidle" }); await page.waitForTimeout(1500);
  check(`Pull-to-Refresh auf "${label}": bleibt dort (${here} -> ${await where()})`, (await where()) === here && here !== "");
}
// Normales Oeffnen beginnt wieder auf der Uebersicht
await page.goto(url, { waitUntil: "networkidle" }); await page.waitForTimeout(1500);
check("Normales Oeffnen ohne refresh: Uebersicht statt letzter Seite (" + await where() + ")", (await where()) !== "Einstellungen" && (await where()) !== "Sammlung" && (await where()) !== "Partien");
await b.close(); server.close();
console.log(ok ? "Refresh-Seite-Test bestanden" : "FEHLER"); process.exit(ok ? 0 : 1);
