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
  { ...base, id: "b", name: "Brass NurGespielt", status: "none", image: svg("#37a"), images: [svg("#37a")] },
  { ...base, id: "w", name: "Wunsch Spiel", status: "wishlist", image: svg("#a73"), images: [svg("#a73")] },
  { ...base, id: "w2", name: "Wunsch Ohnebild", status: "wishlist" }];
const plays = games.map((g) => ({ id: "p" + g.id, gameId: g.id, gameName: g.name, date: "2026-09-01", mode: "physical-owned", players: "", playerIds: [], winner: "", scores: {}, notes: "", images: [] }));
const THEME = process.env.THEME || "dark";
await page.addInitScript((d) => { if (localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1");
  localStorage.setItem("spielregal:games", JSON.stringify(d.games)); localStorage.setItem("spielregal:plays", JSON.stringify(d.plays)); localStorage.setItem("spielregal:theme", d.theme); localStorage.setItem("spielregal:collectionStatusFilter", JSON.stringify("all")); }, { games, plays, theme: THEME });
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }); await page.waitForTimeout(1500);
await page.locator('button:has-text("Sammlung")').last().click(); await page.waitForTimeout(800);
const wrap = (name) => page.locator(`[data-wish-cover]:has(img[alt="${name}"])`);
check("Wunsch-Cover hat Markierung, besessenes und gespieltes nicht", await wrap("Wunsch Spiel").count() === 1 && await page.locator('[data-wish-cover]:has(img[alt="Azul Besitz"]), [data-wish-cover]:has(img[alt="Brass NurGespielt"])').count() === 0);
check("Wunsch-Cover: Herz-Badge", await wrap("Wunsch Spiel").locator("[data-wish-badge]").count() === 1);
const hb = await wrap("Wunsch Spiel").locator("[data-wish-badge]").evaluate((e) => ({ bg: getComputedStyle(e).backgroundColor, svgFill: getComputedStyle(e.querySelector("svg")).fill, color: getComputedStyle(e).color }));
check("Herz ausgefuellt in Weiss, ohne Kreis (" + JSON.stringify(hb) + ")", hb.bg === "rgba(0, 0, 0, 0)" && hb.svgFill === hb.color && hb.color === "rgb(255, 255, 255)");
check("Wunsch-Cover: kein gestrichelter Rahmen", await wrap("Wunsch Spiel").locator("span.border-dashed").count() === 0);
const gl = await wrap("Wunsch Spiel").locator("[data-wish-badge]").evaluate((e) => getComputedStyle(e).filter);
check("Herz leuchtet mit Coral-Schatten (" + gl + ")", /rgb\(255, 111, 97\)/.test(gl) && (gl.match(/drop-shadow/g) || []).length >= 2);
const fl = await page.locator('img[alt="Wunsch Spiel"]').first().evaluate((e) => getComputedStyle(e).filter);
check(`Wunsch-Cover aufgehellt (${fl})`, /brightness\(1\.12\)/.test(fl));
const fa = await page.locator('img[alt="Azul Besitz"]').first().evaluate((e) => getComputedStyle(e).filter);
check("Besessenes Cover unveraendert", fa === "none");
check("Wunsch ohne Bild: ebenfalls Herz", await page.locator("[data-wish-cover]:not(:has(img)) [data-wish-badge]").count() === 1);
await b.close(); server.close();
console.log(ok ? "Wunsch-Cover-Test bestanden: true" : "FEHLER"); process.exit(ok ? 0 : 1);
