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
const svg = (c) => "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="${c}"/></svg>`);
const base = { categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" };
const games = [{ ...base, id: "a", name: "Azul Besitz", status: "owned", image: svg("#3a7"), images: [svg("#3a7")] },
  { ...base, id: "b", name: "Brass NurGespielt", status: "none", image: svg("#37a"), images: [svg("#37a")] }];
const plays = games.map((g) => ({ id: "p" + g.id, gameId: g.id, gameName: g.name, date: "2026-09-01", mode: "physical-owned", players: "", playerIds: [], winner: "", scores: {}, notes: "", images: [] }));
const THEME = process.env.THEME || "dark";
await page.addInitScript((d) => { if (localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1");
  localStorage.setItem("spielregal:games", JSON.stringify(d.games)); localStorage.setItem("spielregal:plays", JSON.stringify(d.plays)); localStorage.setItem("spielregal:theme", d.theme); localStorage.setItem("spielregal:collectionStatusFilter", JSON.stringify("all")); }, { games, plays, theme: THEME });
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }); await page.waitForTimeout(1500);
await page.locator('button:has-text("Sammlung")').last().click(); await page.waitForTimeout(800);
const f = (name) => page.locator(`img[alt="${name}"]`).first().evaluate((e) => getComputedStyle(e).filter);
const fa = await f("Azul Besitz"), fb = await f("Brass NurGespielt");
const want = THEME === "light" ? "brightness(0.86)" : "brightness(0.76)";
check(`${THEME}: Cover des besessenen Spiels unveraendert (${fa})`, fa === "none");
check(`${THEME}: Cover des nur gespielten Spiels abgedunkelt (${fb})`, fb === want);
await b.close(); server.close();
console.log(ok ? "Cover-Dunkel-Test bestanden: true" : "FEHLER"); process.exit(ok ? 0 : 1);
