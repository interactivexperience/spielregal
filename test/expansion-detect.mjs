// Prueft die Erweiterungs-Erkennung auf der Detailseite (Wingspan): (1) eine frueher
// gespeicherte LEERE Erweiterungsliste wird neu geholt, (2) ein von Hand angelegtes Spiel
// ohne BGG-ID wird ueber einen eindeutigen Treffer mit gleichem Titel erkannt (ID bleibt leer),
// (3) bei mehrdeutigen Treffern oder anderem Titel wird nichts geraten, (4) eine vorhandene
// Liste wird nicht neu geholt.
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
const SP = "/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad";
const thingXml = `<?xml version="1.0"?><items><item type="boardgame" id="266192"><name type="primary" value="Wingspan"/><yearpublished value="2019"/>
<link type="boardgameexpansion" id="300001" value="Wingspan: European Expansion"/><link type="boardgameexpansion" id="300002" value="Wingspan: Oceania Expansion"/><link type="boardgameexpansion" id="300003" value="Wingspan: Asia"/></item></items>`;
const searchOne = `<?xml version="1.0"?><items total="1"><item type="boardgame" id="266192"><name type="primary" value="Wingspan"/><yearpublished value="2019"/></item></items>`;
const searchTwo = `<?xml version="1.0"?><items total="2"><item type="boardgame" id="266192"><name type="primary" value="Wingspan"/><yearpublished value="2019"/></item><item type="boardgame" id="777"><name type="primary" value="Wingspan"/><yearpublished value="2020"/></item></items>`;
const base = { status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-01" };
async function scenario(label, game, searchBody) {
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const calls = { search: 0, thing: 0 };
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript", body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
  await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
  await page.route("**/xmlapi2/search*", r => { calls.search++; return r.fulfill({ body: searchBody, contentType: "text/xml" }); });
  await page.route("**/xmlapi2/thing?id=266192*", r => { calls.thing++; return r.fulfill({ body: thingXml, contentType: "text/xml" }); });
  await page.addInitScript((g) => {
    localStorage.setItem("spielregal:games", JSON.stringify([g]));
    localStorage.setItem("spielregal:plays", JSON.stringify([]));
    localStorage.setItem("spielregal:theme", "dark");
  }, game);
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.locator('button:has-text("Sammlung")').last().click(); await page.waitForTimeout(700);
  await page.locator(`text=${game.name}`).first().click(); await page.waitForTimeout(2000);
  const chip = page.locator('button:has-text("Erweiterungen gefunden"), button:has-text("Erweiterung gefunden")');
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:games"))[0]);
  const res = { chip: await chip.count() === 1 ? await chip.innerText() : "", st, calls };
  if (label === "1") await page.screenshot({ path: `${SP}/wingspan_chip.png` });
  await page.close();
  return res;
}
let r = await scenario("1", { ...base, id: "w1", name: "Wingspan", bggId: "266192", expansionBggList: [], expansionBggIds: [] }, searchOne);
console.log("(1) Gespeicherte leere Liste wird neu geholt -> '3 Erweiterungen gefunden':", r.chip.includes("3"), "| Liste am Spiel:", r.st.expansionBggList.length === 3);
r = await scenario("2", { ...base, id: "w2", name: "Wingspan" }, searchOne);
console.log("(2) Ohne BGG-ID, eindeutiger Treffer -> '3 Erweiterungen gefunden':", r.chip.includes("3"), "| BGG-ID bleibt leer:", !r.st.bggId);
r = await scenario("3a", { ...base, id: "w3", name: "Wingspan" }, searchTwo);
console.log("(3a) Ohne BGG-ID, zwei gleichnamige Treffer -> nichts geraten:", r.chip === "" && r.calls.thing === 0);
r = await scenario("3b", { ...base, id: "w4", name: "Wingspan Handgemacht" }, searchOne);
console.log("(3b) Ohne BGG-ID, Titel nicht identisch -> nichts geraten:", r.chip === "" && r.calls.thing === 0);
r = await scenario("4", { ...base, id: "w5", name: "Wingspan", bggId: "266192", expansionBggList: [{ id: "300001", name: "Wingspan: European Expansion" }], expansionBggIds: ["300001"] }, searchOne);
console.log("(4) Vorhandene Liste: keine neue BGG-Anfrage, Hinweis zeigt 1:", r.calls.thing === 0 && r.calls.search === 0 && r.chip.includes("1"));
await b.close(); server.close();
