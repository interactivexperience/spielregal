// Prueft: eingeordnete Ranking-Plaetze gehen mit Cloud-Sync nicht verloren. Frueher ueberschrieb der Start-Pull
// bedingungslos die lokalen Daten -- kam der Upload nie an (Netz weg, App sofort geschlossen), waren die
// Plaetze beim naechsten Start weg. Jetzt: ungesicherte lokale Aenderungen werden zuerst hochgeladen.
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
let ok = true; const check = (l, c) => { console.log(l + ":", !!c); if (!c) ok = false; };
const base = { status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-01" };
const games = ["Azul", "Brass", "Catan"].map((n, i) => ({ ...base, id: "g" + i, name: n }));
const plays = games.map((g, i) => ({ id: "p" + i, gameId: g.id, gameName: g.name, date: "2026-09-01", mode: "physical-owned", players: "", playerIds: [], winner: "", scores: {}, notes: "", images: [] }));
const lists = [{ id: "l1", name: "Koop", gameIds: ["g0", "g1"] }];
const WORKER = "https://shiny-grass-80ec.contact-mdinh.workers.dev/**";
const catalog = { Azul: { id: "230802", y: "2017" }, Brass: { id: "28720", y: "2007" }, Catan: { id: "13", y: "1995" } };
const page = await b.newPage({ viewport: { width: 390, height: 844 } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript", body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
let down = false, calls = 0;
await page.route(WORKER, (r) => {
  calls++; if (down) return r.abort();
  const u = new URL(r.request().url());
  if (u.pathname.endsWith("/search")) {
    const q = u.searchParams.get("query"); const c = catalog[q];
    return r.fulfill({ contentType: "text/xml", body: c ? `<items><item id="${c.id}"><name value="${q}"/><yearpublished value="${c.y}"/></item></items>` : "<items></items>" });
  }
  const id = u.searchParams.get("id"); const n = Object.keys(catalog).find((k) => catalog[k].id === id);
  return r.fulfill({ contentType: "text/xml", body: `<items><item id="${id}"><name type="primary" value="${n}"/><yearpublished value="${catalog[n].y}"/><image>https://img.test/${id}.jpg</image><minplayers value="2"/><maxplayers value="4"/><minplaytime value="30"/><maxplaytime value="60"/><minage value="8"/><link type="boardgamemechanic" value="Tile Placement"/><link type="boardgamepublisher" value="Verlag ${n}"/><description>Beschreibung</description><statistics><ratings><averageweight value="2.0"/></ratings></statistics></item></items>` });
});
const restored = [{ id: "g0", name: "Azul", status: "owned", rating: "9", needsBgg: true }, { id: "g1", name: "Brass", status: "wishlist", needsBgg: true }, { id: "g2", name: "Unbekanntes Spiel", status: "owned", needsBgg: true }].map((g) => ({ ...base, ...g }));
await page.addInitScript((d) => { if (localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1"); localStorage.setItem("spielregal:games", JSON.stringify(d.games)); localStorage.setItem("spielregal:plays", JSON.stringify(d.plays)); localStorage.setItem("spielregal:theme", "dark"); }, { games: restored, plays });
await page.goto(url, { waitUntil: "networkidle" }); await page.waitForTimeout(1500);
await page.locator('button:has-text("Sammlung")').last().click(); await page.waitForTimeout(800);
check("Hinweis 'noch keine Cover und BGG-Daten' fuer 3 Spiele", (await page.locator("[data-enrich]").innerText()).includes("3 Spiele haben noch keine"));
// BGG gerade nicht erreichbar: sauberer Abbruch, nichts kaputt
down = true; await page.locator("[data-enrich-start]").click(); await page.waitForTimeout(1200);
check("BGG nicht erreichbar: Meldung, Spiele unveraendert", (await page.locator("[data-enrich]").innerText()).includes("nicht erreichbar") && (await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:games")).every((g) => g.needsBgg))));
down = false; await page.locator("[data-enrich-start]").click(); await page.waitForTimeout(4500);
const gs = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:games")));
const az = gs.find((g) => g.id === "g0"), br = gs.find((g) => g.id === "g1"), un = gs.find((g) => g.id === "g2");
check("Azul: BGG-Daten geladen, Bewertung/Status bleiben", az.bggId === "230802" && az.images[0] === "https://img.test/230802.jpg" && az.minPlayers === "2" && az.rating === "9" && az.status === "owned" && !az.needsBgg);
check("Brass: Status Wunschliste bleibt erhalten", br.bggId === "28720" && br.status === "wishlist" && br.publishers[0] === "Verlag Brass");
check("Unbekanntes Spiel: nicht geraten, bleibt markiert und wird gemeldet", un.needsBgg === true && !un.bggId && (await page.locator("[data-enrich-skipped]").innerText()).includes("Unbekanntes Spiel"));
check("Name der Spiele bleibt wie in den Partien", az.name === "Azul" && br.name === "Brass");
await b.close(); server.close();
console.log(ok ? "BGG-Nachladen-Test bestanden: true" : "FEHLER"); process.exit(ok ? 0 : 1);
