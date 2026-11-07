// Fertig-Status der KI-Werkzeuge: nach Abschluss erscheint ein gruenes Haekchen (am Werkzeug und am Knopf 'KI-Werkzeuge').
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const vendor = (...p) => path.join(__dirname, "node_modules", ...p);
const SP = "/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad";

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
let ok = true; const check = (l, c) => { console.log(l + ":", !!c); if (!c) ok = false; };
let delay = 900;
await page.route("**/fake-ai-worker.test/chat", async (route) => {
  const body = JSON.parse(route.request().postData()); const prompt = body.messages[0].content;
  await new Promise((r) => setTimeout(r, delay));
  const text = prompt.includes("Alternative Titel") ? "TITEL: Bärenstarke Ausgabe\nVERLAGE: keiner" : prompt.includes("ORIGINALVERLAG") ? "ORIGINALVERLAG: keiner\nTITEL: Nebelspiel\nVERLAGE: keiner" : "Ein kurzer Pitch fuer das Spiel.";
  route.fulfill({ contentType: "application/json", body: JSON.stringify({ text }) });
});
const games = [{ id: "g1", name: "Foo", status: "owned", bggId: "", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" }];
await page.addInitScript((g) => { localStorage.setItem("spielregal:games", JSON.stringify(g)); localStorage.setItem("spielregal:plays", "[]"); localStorage.setItem("spielregal:theme", "dark"); localStorage.setItem("spielregal:aiWorkerUrl", "https://fake-ai-worker.test/chat"); }, games);
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }); await page.waitForTimeout(2000);
await page.locator('button:has-text("Sammlung")').last().click(); await page.waitForTimeout(800);
await page.locator('text=Foo').first().click(); await page.waitForTimeout(1000);
const edit = page.locator('button[aria-label="Bearbeiten"], button:has-text("Bearbeiten")').first();
if (await edit.count()) { await edit.click(); await page.waitForTimeout(1000); }
check("Anfangs kein Haekchen am KI-Knopf", (await page.locator("[data-ai-done-footer]").count()) === 0);
await page.locator('button:has-text("KI-Werkzeuge")').click(); await page.waitForTimeout(500);
await page.locator("text=Deutschen Titel/Verlag erraten lassen").click(); await page.waitForTimeout(250);
check("Waehrend die KI arbeitet: kein Haekchen", (await page.locator('[data-ai-done="german"]').count()) === 0);
await page.waitForTimeout(1500);
check("Fertig: gruenes Haekchen am Werkzeug + 'fertig'", (await page.locator('[data-ai-done="german"]').count()) === 1 && (await page.locator("text=· fertig").count()) === 1);
const col = await page.locator('[data-ai-done="german"]').evaluate((e) => getComputedStyle(e).color);
check("Haekchen ist gruen (" + col + ")", (() => { const m = col.match(/\d+/g).map(Number); return m[1] > m[0] && m[1] >= m[2]; })());
await page.locator('text=Elevator-Pitch generieren').click(); await page.waitForTimeout(250);
check("Zweites Werkzeug laeuft: sein Haekchen fehlt noch, das erste bleibt", (await page.locator('[data-ai-done="pitch"]').count()) === 0 && (await page.locator('[data-ai-done="german"]').count()) === 1);
await page.waitForTimeout(1500);
check("Pitch fertig: auch hier Haekchen", (await page.locator('[data-ai-done="pitch"]').count()) === 1);
await page.mouse.click(20, 20); await page.waitForTimeout(500);
check("Nach dem Schliessen: gruenes Haekchen am Knopf 'KI-Werkzeuge'", (await page.locator("[data-ai-done-footer]").count()) === 1);
await b.close(); server.close();
console.log(ok ? "KI-Status-Test bestanden" : "FEHLER"); process.exit(ok ? 0 : 1);
