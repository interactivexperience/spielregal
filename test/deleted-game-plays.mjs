// Prueft: wird ein Spiel mit Partien geloescht, behalten die Partien Name und Cover
// (Kopie an der Partie). Wird dasselbe Spiel spaeter wieder hinzugefuegt (gleiche
// BGG-ID, oder gleicher Name ohne BGG-ID), haengen die Partien wieder daran;
// ein anderes Spiel mit gleichem Namen aber anderer BGG-ID uebernimmt sie nicht.
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


const RED = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3Crect width='2' height='2' fill='%23f00'/%3E%3C/svg%3E";
const base = { status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" };
const games = [
  { ...base, id: "g1", name: "Ark Nova", bggId: "342942", images: [RED] },
  { ...base, id: "g2", name: "Wingspan", bggId: "266192", images: [RED] },
];
const mkPlay = (id, gameId, gameName, date) => ({ id, gameId, gameName, date, mode: "physical-owned", players: "", playerIds: [], winner: "", scores: {}, notes: "", images: [] });
const plays = [mkPlay("p1", "g1", "Ark Nova", "2026-09-01"), mkPlay("p2", "g1", "Ark Nova", "2026-08-01"), mkPlay("p3", "g2", "Wingspan", "2026-07-01"),
  // Altlast: Spiel wurde frueher ohne Kopie geloescht, Partie traegt nur noch den Namen
  mkPlay("p4", "gone", "Azul", "2026-06-01")];
await page.addInitScript((d) => {
  if (localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1");
  localStorage.setItem("spielregal:games", JSON.stringify(d.games));
  localStorage.setItem("spielregal:plays", JSON.stringify(d.plays));
  localStorage.setItem("spielregal:theme", "dark");
}, { games, plays });
const store = () => page.evaluate(() => ({ games: JSON.parse(localStorage.getItem("spielregal:games")), plays: JSON.parse(localStorage.getItem("spielregal:plays")) }));
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2000);

// --- Spiel loeschen (Bearbeiten-Formular -> "Spiel entfernen")
await page.locator('button:has-text("Sammlung")').last().click(); await page.waitForTimeout(800);
await page.locator('text=Ark Nova').first().click(); await page.waitForTimeout(800);
await page.locator('button[aria-label="Bearbeiten"]').first().click(); await page.waitForTimeout(700);
await page.locator('button:has-text("Spiel entfernen")').click(); await page.waitForTimeout(800);
let st = await store();
console.log("Spiel ist aus der Sammlung weg:", !st.games.some((g) => g.id === "g1") && st.games.length === 1);
console.log("Seine 2 Partien bleiben mit Namenskopie (Name, BGG-ID, Cover):", st.plays.filter((p) => p.gameId === "g1").length === 2 && st.plays.filter((p) => p.gameId === "g1").every((p) => p.gameSnap && p.gameSnap.name === "Ark Nova" && p.gameSnap.bggId === "342942"));
console.log("Grosses (data:-)Cover steht nur an der neuesten Partie, nicht an jeder:", st.plays.find((p) => p.id === "p1").gameSnap.image === RED && st.plays.find((p) => p.id === "p2").gameSnap.image === "");
console.log("Partie eines anderen Spiels unveraendert (keine Kopie):", !st.plays.find((p) => p.id === "p3").gameSnap);

// --- Partien-Ansicht zeigt weiter das Cover
await page.locator('button:has-text("Partien")').last().click(); await page.waitForTimeout(900);
const row = page.locator('button:has-text("Ark Nova")').first();
console.log("Partien: 'Ark Nova' steht weiter in der Liste:", await row.count() > 0);
console.log("Partien: Zeile zeigt das Cover (img) statt Platzhalter:", await row.locator("img").count() === 1);
const azul = page.locator('button:has-text("Azul")').first();
console.log("Altlast ohne Kopie zeigt Platzhalter (kein img), kein Absturz:", await azul.count() > 0 && await azul.locator("img").count() === 0);
await page.screenshot({ path: "/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad/deleted_cover.png" });


// --- BGG-Mock fuer das erneute Hinzufuegen
const searchXml = `<?xml version="1.0"?><items total="2"><item type="boardgame" id="999001"><name type="primary" value="Ark Nova"/><yearpublished value="1999"/></item></items>`;
const thing = (id, name) => `<?xml version="1.0"?><items><item type="boardgame" id="${id}"><name type="primary" value="${name}"/><yearpublished value="2021"/><minplayers value="1"/><maxplayers value="4"/></item></items>`;
let searchBody = searchXml;
await page.route("**/xmlapi2/search*", r => r.fulfill({ body: searchBody, contentType: "text/xml" }));
await page.route("**/xmlapi2/thing?id=999001*", r => r.fulfill({ body: thing("999001", "Ark Nova"), contentType: "text/xml" }));
await page.route("**/xmlapi2/thing?id=342942*", r => r.fulfill({ body: thing("342942", "Ark Nova"), contentType: "text/xml" }));

const addViaBgg = async (year) => {
  await page.locator('button:has-text("Sammlung")').last().click(); await page.waitForTimeout(600);
  await page.locator('button[aria-label="Spiel hinzufügen"]').click(); await page.waitForTimeout(500);
  await page.locator('input[placeholder="z.B. Wingspan"]').fill("Ark Nova");
  await page.locator('input[placeholder="z.B. Wingspan"]').press("Enter"); await page.waitForTimeout(1500);
  await page.locator(`button:has-text("${year}")`).last().click(); await page.waitForTimeout(1200);
  await page.locator('button:has-text("Speichern")').last().click(); await page.waitForTimeout(1200);
};
// 1) anderes Spiel gleichen Namens (BGG-ID 999001): Partien bleiben verwaist
await addViaBgg(1999);
st = await store();
const arkOther = st.games.find((g) => g.bggId === "999001");
console.log("Anderes Spiel gleichen Namens (andere BGG-ID) angelegt:", !!arkOther);
console.log("... uebernimmt die alten Partien NICHT:", st.plays.filter((p) => p.gameId === arkOther.id).length === 0 && st.plays.filter((p) => p.gameId === "g1").length === 2);

// 2) dasselbe Spiel (BGG-ID 342942) wieder hinzufuegen: Partien haengen wieder dran
searchXml && (searchBody = `<?xml version="1.0"?><items total="1"><item type="boardgame" id="342942"><name type="primary" value="Ark Nova"/><yearpublished value="2021"/></item></items>`);
await addViaBgg(2021);
st = await store();
const ark = st.games.find((g) => g.bggId === "342942");
console.log("Gleiches Spiel (BGG-ID 342942) wieder hinzugefuegt:", !!ark);
console.log("... beide alten Partien zeigen wieder darauf:", !!ark && st.plays.filter((p) => p.gameId === ark.id).length === 2 && st.plays.filter((p) => p.gameId === "g1").length === 0);
console.log("... Kopie an den Partien ist weg (Spiel ist ja wieder da):", st.plays.filter((p) => p.gameId === ark.id).every((p) => !p.gameSnap));
console.log("... Wingspan-Partie und Altlast Azul unberuehrt:", st.plays.find((p) => p.id === "p3").gameId === "g2" && st.plays.find((p) => p.id === "p4").gameId === "gone");

// 3) Altlast ohne Kopie: von Hand angelegt, gleicher Name -> erkannt
await page.locator('button:has-text("Sammlung")').last().click(); await page.waitForTimeout(600);
await page.locator('button[aria-label="Spiel hinzufügen"]').click(); await page.waitForTimeout(500);
await page.locator('button[aria-label="Manuell anlegen"]').click(); await page.waitForTimeout(500);
await page.locator('input[placeholder="Titel *"]').fill("azul");
await page.locator('button:has-text("Speichern")').last().click(); await page.waitForTimeout(1200);
st = await store();
const azulNew = st.games.find((g) => g.name === "azul");
console.log("Von Hand angelegtes 'azul' erkennt die Altlast-Partie 'Azul' (nur Name, Gross-/Kleinschreibung egal):", !!azulNew && st.plays.find((p) => p.id === "p4").gameId === azulNew.id);

// Partien-Ansicht: Ark Nova steht mit dem Cover des wieder hinzugefuegten Spiels
await page.locator('button:has-text("Partien")').last().click(); await page.waitForTimeout(900);
console.log("Partien: Gruppe 'Ark Nova' zeigt 2x gespielt:", await page.locator('button:has-text("Ark Nova"):has-text("2× gespielt")').count() === 1);
await b.close(); server.close();
