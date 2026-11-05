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
const svg = (w, h, c) => "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${c}"/><circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) / 3}" fill="#fff"/></svg>`);
const base = { categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01", status: "owned" };
const shapes = [[600, 300], [300, 600], [500, 500], [800, 300], [300, 700], [640, 960]];
const games = shapes.map(([w, h], i) => ({ ...base, id: "g" + i, name: `Cover ${w}x${h}`, rating: 5 - (i % 3), image: svg(w, h, `hsl(${i * 57},50%,40%)`), images: [svg(w, h, `hsl(${i * 57},50%,40%)`)], status: i === 4 ? "wishlist" : i === 5 ? "none" : "owned" }));
const plays = games.map((g) => ({ id: "p" + g.id, gameId: g.id, gameName: g.name, date: "2026-09-01", mode: "physical-owned", players: "", playerIds: [], winner: "", scores: {}, notes: "", images: [] }));
await page.addInitScript((d) => { if (localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1");
  localStorage.setItem("spielregal:games", JSON.stringify(d.games)); localStorage.setItem("spielregal:plays", JSON.stringify(d.plays)); localStorage.setItem("spielregal:theme", "dark"); localStorage.setItem("spielregal:collectionStatusFilter", JSON.stringify("all")); }, { games, plays });
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }); await page.waitForTimeout(1800);
const ratios = () => page.evaluate(() => [...document.querySelectorAll("img[alt^='Cover ']")].filter((e) => e.getBoundingClientRect().width > 4).map((e) => { const r = e.getBoundingClientRect(); return { alt: e.alt, w: Math.round(r.width), h: Math.round(r.height) }; }));
const squareOk = (arr) => arr.length > 0 && arr.every((r) => Math.abs(r.w - r.h) <= 1);
const bad = (arr) => JSON.stringify(arr.filter((r) => Math.abs(r.w - r.h) > 1).slice(0, 3));
let r = await ratios(); check("Dashboard: alle Cover quadratisch (" + r.length + " Bilder) " + bad(r), squareOk(r));
const tiles = await page.evaluate(() => [...document.querySelectorAll("a[aria-label$='im Browser spielen'] > span:first-child")].map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
check("Dashboard: 'Im Browser spielen'-Kacheln quadratisch " + JSON.stringify(tiles.slice(0, 2)), tiles.length > 0 && tiles.every(([w, h]) => Math.abs(w - h) <= 1));
await page.locator('button:has-text("Sammlung")').last().click(); await page.waitForTimeout(900);
r = await ratios(); check("Sammlung (2 Spalten): alle Cover quadratisch (" + r.length + ") " + bad(r), squareOk(r));
const grid4 = page.locator('button[aria-label*="4"], button:has(svg) >> nth=1');
await page.locator('[class*="rounded-full"] button').nth(1).click().catch(() => {}); await page.waitForTimeout(600);
r = await ratios(); check("Sammlung (andere Ansicht): alle Cover quadratisch (" + r.length + ") " + bad(r), squareOk(r));
await page.locator('img[alt="Cover 600x300"]').first().click(); await page.waitForTimeout(900);
r = await ratios(); check("Detailansicht: Cover quadratisch " + bad(r), squareOk(r));
await b.close(); server.close();
console.log(ok ? "Cover-1:1-Test bestanden" : "FEHLER"); process.exit(ok ? 0 : 1);
