// Update-Hinweis: wird eine neuere Version ausgeliefert (anderer Build-Stempel), erscheint oben "Neues Update verfuegbar";
// "Aktualisieren" laedt neu und bleibt auf der aktuellen Seite. Der Stempel wird wie im Deploy per sed gesetzt
// (ersetzt das ERSTE Vorkommen JEDER Zeile) -- frueher machte das die Pruefung im Skript kaputt, der Hinweis kam live nie.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const vendor = (...p) => path.join(__dirname, "node_modules", ...p);
let STAMP = "aaaaaaa-1";
const stamp = (t) => t.split("\n").map((l) => l.replace("__BUILD_ID__", STAMP)).join("\n");
const server = http.createServer((req, res) => {
  try { const f = path.join(repoRoot, decodeURIComponent(req.url.split("?")[0])); let body = readFileSync(f); if (f.endsWith("index.html")) body = Buffer.from(stamp(body.toString("utf8")));
    res.writeHead(200, f.endsWith("index.html") ? { "content-type": "text/html; charset=utf-8" } : {}); res.end(body); }
  catch { res.writeHead(404); res.end("nf"); }
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;
const twCss = readFileSync(path.join(__dirname, "tw-built.css"), "utf8");
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let ok = true; const check = (l, c) => { console.log(l + ":", !!c); if (!c) ok = false; };
const page = await b.newPage({ viewport: { width: 390, height: 844 } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript", body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
const g = { id: "a", name: "Azul", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-01" };
await page.addInitScript((d) => { if (localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1"); localStorage.setItem("spielregal:games", JSON.stringify([d])); localStorage.setItem("spielregal:plays", "[]"); localStorage.setItem("spielregal:theme", "dark"); }, g);
await page.goto(url, { waitUntil: "networkidle" }); await page.waitForTimeout(1500);
check("Deploy-Stempel: nur das Meta-Tag traegt ihn, die Pruefung im Skript bleibt intakt", (await page.evaluate(() => document.querySelector('meta[name="app-build"]').content)) === "aaaaaaa-1");
check("Ohne neuere Version: kein Hinweis", (await page.locator("#update-banner").count()) === 0);
await page.locator('button:has-text("Sammlung")').last().click(); await page.waitForTimeout(600);
// neue Version wird ausgeliefert, App kommt in den Vordergrund
STAMP = "bbbbbbb-2";
await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange"))); await page.waitForTimeout(1200);
const bn = page.locator("#update-banner");
check("Neue Version: Hinweis 'Neues Update verfuegbar' erscheint", (await bn.count()) === 1 && (await bn.innerText()).includes("Neues Update verfügbar"));
const box = await bn.boundingBox();
check("Hinweis erscheint oben (y=" + Math.round(box.y) + ")", box.y < 60);
await bn.locator("button").click(); await page.waitForLoadState("networkidle"); await page.waitForTimeout(1500);
check("Aktualisieren laedt die neue Version (" + await page.evaluate(() => document.querySelector('meta[name="app-build"]').content) + ") und bleibt auf der Sammlung", (await page.evaluate(() => document.querySelector('meta[name="app-build"]').content)) === "bbbbbbb-2" && (await page.evaluate(() => (document.querySelector("h1") || {}).textContent)) === "Sammlung");
check("Danach kein Hinweis mehr", (await page.locator("#update-banner").count()) === 0);
await b.close(); server.close();
console.log(ok ? "Update-Hinweis-Test bestanden" : "FEHLER"); process.exit(ok ? 0 : 1);
