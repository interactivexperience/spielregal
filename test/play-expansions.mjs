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
const base = { categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-01", status: "owned" };
const games = [{ ...base, id: "b1", name: "Everdell" },
  { ...base, id: "e1", name: "Pearlbrook", expansionOf: "b1" }, { ...base, id: "e2", name: "Spirecrest", expansionOf: "b1" }, { ...base, id: "e3", name: "Bellfaire", expansionOf: "b1" },
  { ...base, id: "b2", name: "Azul" }];
await page.addInitScript((d) => { if (localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1"); localStorage.setItem("spielregal:games", JSON.stringify(d)); localStorage.setItem("spielregal:plays", "[]"); localStorage.setItem("spielregal:theme", "dark"); }, games);
await page.goto(url, { waitUntil: "networkidle" }); await page.waitForTimeout(1500);
await page.locator('button:has-text("Partien")').last().click(); await page.waitForTimeout(700);
await page.locator('button[aria-label="Partie eintragen"]').click(); await page.waitForTimeout(500);
const search = page.locator('input[placeholder="Spiel suchen…"]');
// Spiel ohne Erweiterungen: keine Auswahl
await search.fill("Azul"); await page.waitForTimeout(300);
await page.locator('button:has-text("Azul")').first().click(); await page.waitForTimeout(500);
check("Spiel ohne Erweiterungen: kein Erweiterungs-Bereich", (await page.locator("[data-play-expansions]").count()) === 0);
await page.locator('button:has-text("Ändern")').click(); await page.waitForTimeout(400);
await search.fill("Everdell"); await page.waitForTimeout(300);
await page.locator('button:has-text("Everdell")').first().click(); await page.waitForTimeout(500);
check("Spiel mit 3 Erweiterungen: Bereich mit 3 Auswahlen, Hinweis 'ohne Erweiterung gespielt'", (await page.locator("[data-play-exp]").count()) === 3 && (await page.locator("[data-play-expansions]").innerText()).includes("ohne Erweiterung gespielt"));
await page.locator('[data-play-exp="e1"]').click(); await page.locator('[data-play-exp="e2"]').click(); await page.waitForTimeout(200);
check("Zaehler: 'mit 2 Erweiterungen gespielt'", (await page.locator("[data-play-expansions]").innerText()).includes("mit 2 Erweiterungen gespielt"));
await page.locator("[data-play-expansions]").scrollIntoViewIfNeeded();
await page.screenshot({ path: "/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad/play_exp1.png" });
await page.locator('button:has-text("Partie speichern")').click(); await page.waitForTimeout(800);
const st = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:plays")));
check("Partie gespeichert mit expansionIds [e1,e2]", st.length === 1 && st[0].gameId === "b1" && JSON.stringify([...st[0].expansionIds].sort()) === '["e1","e2"]');
await page.locator("text=Everdell").first().click(); await page.waitForTimeout(600);
check("Partien-Liste zeigt 'mit 2 Erweiterungen: Pearlbrook, Spirecrest'", (await page.locator("[data-play-exp-line]").first().innerText()) === "mit 2 Erweiterungen: Pearlbrook, Spirecrest");
// Bearbeiten: vorbelegt, dann alle abwaehlen
await page.locator("[data-play-exp-line]").first().click(); await page.waitForTimeout(600);
check("Bearbeiten: beide Erweiterungen vorgewaehlt", (await page.locator('[data-play-exp="e1"]').getAttribute("aria-pressed")) === "true" && (await page.locator('[data-play-exp="e2"]').getAttribute("aria-pressed")) === "true" && (await page.locator('[data-play-exp="e3"]').getAttribute("aria-pressed")) === "false");
await page.locator('[data-play-exp="e1"]').click(); await page.locator('[data-play-exp="e2"]').click(); await page.waitForTimeout(150);
await page.locator('button:has-text("Partie speichern")').click(); await page.waitForTimeout(800);
const st2 = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:plays")));
await page.waitForTimeout(300);
check("Alle abgewaehlt: Partie ohne Erweiterungen, keine Zeile in der Liste", st2.length === 1 && !(st2[0].expansionIds && st2[0].expansionIds.length) && (await page.locator("[data-play-exp-line]").count()) === 0);
await page.reload({ waitUntil: "networkidle" }); await page.waitForTimeout(1200); await page.locator('button:has-text("Partien")').last().click(); await page.waitForTimeout(600);
// Spielwechsel raeumt auf
await page.locator('button[aria-label="Partie eintragen"]').click(); await page.waitForTimeout(500);
await search.fill("Everdell"); await page.waitForTimeout(300); await page.locator('div.fixed.z-50 button:has-text("Everdell")').first().click(); await page.waitForTimeout(400);
await page.locator('[data-play-exp="e3"]').click(); await page.waitForTimeout(150);
await page.locator('button:has-text("Ändern")').click(); await page.waitForTimeout(300);
await search.fill("Azul"); await page.waitForTimeout(300); await page.locator('div.fixed.z-50 button:has-text("Azul")').first().click(); await page.waitForTimeout(400);
await page.locator('button:has-text("Partie speichern")').click(); await page.waitForTimeout(800);
const st3 = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:plays")).find((p) => p.gameId === "b2"));
check("Spielwechsel zu Azul: keine Erweiterung der alten Wahl uebernommen", !!st3 && !(st3.expansionIds && st3.expansionIds.length));
await b.close(); server.close();
console.log(ok ? "Partie-Erweiterungen-Test bestanden" : "FEHLER"); process.exit(ok ? 0 : 1);
