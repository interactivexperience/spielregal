// Prueft, ob der Erweiterungs-Vorschlag in Detailansicht und Formular sichtbar ist.
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
await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript",
  body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));

const games = [
  { id: "base1", name: "Brass: Birmingham", status: "owned", bggId: "224517",
    expansionBggList: [{ id: "300001", name: "Brass: Birmingham – Eisenbahn" }, { id: "300002", name: "Brass: Birmingham – Werften" }],
    expansionBggIds: ["300001", "300002"], categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
  { id: "exp1", name: "Brass: Birmingham – Eisenbahn", status: "owned", bggId: "300001", baseGameBggId: "224517", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-02" },
];

// Fingierte BGG-Antwort fuer die noch nicht in der Sammlung stehende
// Erweiterung ("Werften", id 300002) — damit der komplette Hinzufuegen-Weg
// (nicht nur der Netzwerk-Fallback) getestet ist.
const fakeThingXml = `<?xml version="1.0"?><items><item id="300002"><name type="primary" value="Brass: Birmingham – Werften" /><yearpublished value="2026" /><minplayers value="2" /><maxplayers value="4" /><minplaytime value="60" /><maxplaytime value="120" /><minage value="14" /><link type="boardgameexpansion" id="224517" value="Brass: Birmingham" inbound="true" /></item></items>`;
await page.route("**/xmlapi2/thing?id=300002*", r => r.fulfill({ body: fakeThingXml, contentType: "text/xml" }));
await page.addInitScript((g) => {
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
}, games);

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);
await page.locator('button:has-text("Sammlung")').last().click();
await page.waitForTimeout(900);
await page.locator('text=Brass: Birmingham').first().click();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${SP}/exp_detail.png` });
const dt = await page.locator('text=Laut BoardGameGeek gehört dazu').count();
console.log("Detail-Block sichtbar:", dt > 0);
console.log("  'in Sammlung' (Eisenbahn, verknuepfbar):", await page.locator('button[aria-label="Brass: Birmingham – Eisenbahn verknüpfen"]').count() > 0);
console.log("  'Hinzufügen' (Werften, noch nicht in Sammlung):", await page.locator('button[aria-label="Brass: Birmingham – Werften hinzufügen"]').count() > 0);

// Verknuepfen antippen (Eisenbahn ist bereits in der Sammlung)
await page.locator('button[aria-label="Brass: Birmingham – Eisenbahn verknüpfen"]').click();
await page.waitForTimeout(900);
console.log("Eisenbahn-Zeile danach weg:", await page.locator('button[aria-label="Brass: Birmingham – Eisenbahn verknüpfen"]').count() === 0);
console.log("Werften-Zeile weiterhin da:", await page.locator('button[aria-label="Brass: Birmingham – Werften hinzufügen"]').count() > 0);
console.log("Chip vorhanden:", await page.locator('button:has-text("Brass: Birmingham – Eisenbahn")').count() > 0);
console.log("gespeichert (Eisenbahn):", await page.evaluate(() => (JSON.parse(localStorage.getItem("spielregal:games"))||[]).map(g=>[g.name,g.expansionOf||null])));
await page.screenshot({ path: `${SP}/exp_detail_after.png` });

// Hinzufuegen antippen (Werften ist noch nicht in der Sammlung) — soll das
// Basisspiel schliessen und ein neues, vorausgefuelltes Formular oeffnen.
await page.locator('button[aria-label="Brass: Birmingham – Werften hinzufügen"]').click();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${SP}/exp_add_form.png` });
console.log("Neues Formular zeigt Werften-Titel:", await page.locator('text=Brass: Birmingham – Werften').count() > 0);
const speichern = page.locator('button:has-text("Speichern")').first();
console.log("Speichern-Button da:", await speichern.count() > 0);
if (await speichern.count()) { await speichern.click(); await page.waitForTimeout(900); }
const nachher = await page.evaluate(() => (JSON.parse(localStorage.getItem("spielregal:games"))||[]).map(g=>[g.name,g.expansionOf||null]));
console.log("gespeichert (nach Hinzufügen):", nachher);
const werften = nachher.find(([n]) => n.includes("Werften"));
console.log("Werften korrekt mit Basisspiel verknüpft:", !!werften && werften[1] === "base1");

// Formular fuer das Basisspiel oeffnen und den unteren Block pruefen
await page.locator('text=Brass: Birmingham').first().click();
await page.waitForTimeout(1200);
const edit = page.locator('button[aria-label="Bearbeiten"], button:has-text("Bearbeiten")').first();
if (await edit.count()) { await edit.click(); await page.waitForTimeout(1200); }
const lbl = page.locator('text=Erweiterungen dieses Spiels');
console.log("Formular-Block vorhanden:", await lbl.count() > 0);
if (await lbl.count()) {
  await lbl.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SP}/exp_form.png` });
}
await b.close(); server.close();
