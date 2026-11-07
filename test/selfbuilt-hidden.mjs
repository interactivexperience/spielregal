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
  { ...base, id: "a", name: "Grand Austria Hotel", status: "owned", bggId: "182874" },
  { ...base, id: "d1", name: "Grand Hotel Wien", status: "none", bggId: "182874" },
  { ...base, id: "d2", name: "Saum", status: "none" },
  { ...base, id: "d3", name: "Glut", status: "none" },
  { ...base, id: "n", name: "Azul", status: "none" },
  { ...base, id: "w", name: "Everdell", status: "owned" }];
const play = (id, gameId, extra = {}) => ({ id, gameId, gameName: gameId, date: "2026-09-01", mode: "physical-owned", players: "", playerIds: [], winner: "", scores: {}, notes: "", images: [], ...extra });
const plays = [play("p1", "a"), play("p2", "d1", { mode: "bga", source: "grand-hotel-wien" }), play("p3", "d2", { mode: "bga", source: "saum" }), play("p4", "d3", { mode: "bga", source: "glut" }), play("p5", "n"), play("p6", "w")];
await page.addInitScript((d) => { if (localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1");
  localStorage.setItem("spielregal:games", JSON.stringify(d.games)); localStorage.setItem("spielregal:plays", JSON.stringify(d.plays)); localStorage.setItem("spielregal:theme", "dark"); localStorage.setItem("spielregal:collectionStatusFilter", JSON.stringify("all")); }, { games, plays });
await page.goto(url, { waitUntil: "networkidle" }); await page.waitForTimeout(1500);
await page.locator('button:has-text("Sammlung")').last().click(); await page.waitForTimeout(900);
const has = async (n) => (await page.locator(`text=${n}`).count()) > 0;
check("Sammlung (Alle): echtes Exemplar, normal gespieltes und besessenes Spiel sichtbar", await has("Grand Austria Hotel") && await has("Azul") && await has("Everdell"));
check("Selbst gebaute Browser-Spiele nicht angezeigt (Grand Hotel Wien, Saum, Glut)", !(await has("Grand Hotel Wien")) && !(await has("Saum")) && !(await has("Glut")));
check("Zaehler zaehlt sie nicht mit: 3 Spiele", (await page.locator("text=/^3 Spiele/").count()) === 1);
// Suche findet sie auch nicht
await page.locator('button[aria-label="Suchen"]').first().click(); await page.waitForTimeout(400);
await page.locator("input").last().fill("Saum"); await page.waitForTimeout(500);
check("Suche nach 'Saum' findet das selbst gebaute Spiel nicht", !(await has("Saum")) || (await page.locator("text=Keine Spiele gefunden").count()) > 0);
await page.locator("input").last().fill("Azul"); await page.waitForTimeout(500);
check("Suche nach 'Azul' findet das normale Spiel", await has("Azul"));
await b.close(); server.close();
console.log(ok ? "Eigene-Spiele-Test bestanden" : "FEHLER"); process.exit(ok ? 0 : 1);
