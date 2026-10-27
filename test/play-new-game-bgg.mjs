// Prueft: im Partie-Formular wird fuer Spiele ausserhalb der Sammlung auch auf BGG
// gesucht. Treffer, die schon in der Sammlung stehen (BGG-ID), erscheinen nicht
// doppelt. Antippen holt die BGG-Daten und legt das Spiel als "Nur gespielt" an;
// ist BGG nicht erreichbar, bleibt das Anlegen von Hand moeglich.
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
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript",
  body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));

const searchXml = `<?xml version="1.0"?><items total="3">
<item type="boardgame" id="295947"><name type="primary" value="Cascadia"/><yearpublished value="2021"/></item>
<item type="boardgame" id="999001"><name type="primary" value="Cascadia Junior"/><yearpublished value="2023"/></item>
<item type="boardgame" id="342942"><name type="primary" value="Cascadia Ark Nova Mix"/><yearpublished value="2022"/></item>
</items>`;
const thingXml = `<?xml version="1.0"?><items><item type="boardgame" id="295947">
<name type="primary" value="Cascadia"/><name type="alternate" value="Cascadia – Im Herzen der Natur"/>
<yearpublished value="2021"/><minplayers value="1"/><maxplayers value="4"/><minplaytime value="30"/><maxplaytime value="45"/><minage value="10"/>
<description>Lege Landschaften.</description>
<link type="boardgamemechanic" id="1" value="Tile Placement"/><link type="boardgamecategory" id="2" value="Animals"/>
<link type="boardgamedesigner" id="3" value="Randy Flynn"/><link type="boardgamepublisher" id="4" value="Flatout Games"/>
<statistics><ratings><averageweight value="1.8"/></ratings></statistics></item></items>`;
let searchCalls = 0, failBgg = false;
await page.route("**/xmlapi2/search*", r => { searchCalls++; return failBgg ? r.abort() : r.fulfill({ body: searchXml, contentType: "text/xml" }); });
await page.route("**/xmlapi2/thing?id=295947*", r => r.fulfill({ body: thingXml, contentType: "text/xml" }));

const games = [{ id: "g1", name: "Ark Nova", bggId: "342942", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" }];
await page.addInitScript((g) => {
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
}, games);
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2000);
await page.locator('button:has-text("Partien")').last().click();
await page.waitForTimeout(800);
await page.locator('button[aria-label="Partie eintragen"]').click();
await page.waitForTimeout(600);
const search = page.locator('input[placeholder="Spiel suchen…"]');
const hits = page.locator('button[data-bgg-hit]');

await search.fill("Cascadia");
await page.waitForTimeout(1500);
console.log("BGG wurde gefragt:", searchCalls >= 1);
console.log("2 BGG-Treffer (Treffer mit BGG-ID aus der Sammlung ausgeblendet):", await hits.count() === 2);
console.log("Treffer zeigt Name und Jahr:", (await hits.first().innerText()).includes("Cascadia") && (await hits.first().innerText()).includes("2021"));
console.log("Handanlegen bleibt daneben moeglich:", await page.locator('button:has-text("neu anlegen")').count() === 1);
await page.screenshot({ path: "/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad/play_new_game_bgg.png" });

await page.locator('button[data-bgg-hit="295947"]').click();
await page.waitForTimeout(800);
console.log("Nach Antippen: Formular geht weiter mit Spiel:", await page.locator('label:has-text("Datum")').count() > 0 && await page.locator('span.font-medium:has-text("Cascadia")').count() > 0);
await page.locator('button:has-text("Partie speichern")').click(); await page.waitForTimeout(800);

const st = await page.evaluate(() => ({ games: JSON.parse(localStorage.getItem("spielregal:games")), plays: JSON.parse(localStorage.getItem("spielregal:plays")) }));
const nu = st.games.find((g) => g.bggId === "295947");
console.log("Spiel mit BGG-Daten gespeichert (Status none, Jahr, Spielerzahl, Designer):", !!nu && nu.status === "none" && nu.year === "2021" && nu.minPlayers === "1" && nu.maxPlayers === "4" && nu.designers.includes("Randy Flynn"));
console.log("Deutscher Titel NICHT ungefragt uebernommen:", !!nu && !nu.germanName);
console.log("Komplexitaet uebernommen:", !!nu && Number(nu.complexity) === 1.8);
console.log("Partie verweist auf das Spiel:", st.plays.length === 1 && !!nu && st.plays[0].gameId === nu.id);
console.log("Nur 2 Spiele insgesamt (kein Duplikat):", st.games.length === 2);

// Zweiter Durchgang: Treffer schon in der Sammlung -> nicht mehr angeboten
await page.locator('button[aria-label="Partie eintragen"]').click(); await page.waitForTimeout(600);
await search.fill("Cascadia"); await page.waitForTimeout(1500);
console.log("Jetzt vorhandenes Cascadia nicht nochmal als BGG-Treffer:", await page.locator('button[data-bgg-hit="295947"]').count() === 0 && await hits.count() === 1);

// BGG nicht erreichbar: Hinweis + Handanlegen funktioniert weiter
failBgg = true;
await search.fill("Wingspan"); await page.waitForTimeout(1500);
console.log("BGG down: Hinweistext sichtbar:", await page.locator('text=BGG gerade nicht erreichbar').count() === 1);
console.log("BGG down: Handanlegen weiter da:", await page.locator('button:has-text("„Wingspan“ neu anlegen")').count() === 1);

// Kuerzer als 2 Zeichen: keine BGG-Anfrage
const before = searchCalls;
await search.fill("W"); await page.waitForTimeout(1000);
console.log("1 Zeichen: keine BGG-Anfrage:", searchCalls === before);
await b.close(); server.close();
