// Prueft die beiden fertigen KI-Prompts: "Neue Spiele" (Kandidaten aus
// Wunschliste oder frei eingetippt, feste Beurteilungskriterien) und
// "Aussortieren".
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

const games = [
  { id: "g1", name: "Ark Nova", status: "owned", rating: "9", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
  { id: "g2", name: "Wingspan", status: "wishlist", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-02" },
  { id: "g3", name: "Cascadia", status: "wishlist", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-03" },
];
await page.addInitScript((g) => {
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
}, games);

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);
await page.locator('button:has-text("Mehr")').last().click();
await page.waitForTimeout(700);
await page.locator('text=Für KI exportieren').click();
await page.waitForTimeout(700);

const promptText = () => page.locator("textarea").last().inputValue();

// --- Modus "Nur Daten" (Default) ---
console.log("Default-Modus zeigt rohe Sammlungsdaten:", (await promptText()).includes("SPIELREGAL-SAMMLUNGSEXPORT"));

// --- Modus "Neue Spiele" ---
await page.locator('button:has-text("Neue Spiele")').click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${SP}/export_newgames_empty.png` });
let t = await promptText();
console.log("Neue-Spiele-Prompt nennt Community-Bewertung:", t.includes("Community-Bewertung"));
console.log("Neue-Spiele-Prompt nennt Dauerbrenner:", t.includes("Dauerbrenner"));
console.log("Neue-Spiele-Prompt nennt BGA:", t.includes("Board Game Arena (BGA)"));
console.log("Neue-Spiele-Prompt nennt Preis/Preis-Leistung:", t.includes("Preis-Leistung"));
console.log("Neue-Spiele-Prompt nennt Wiederspielwert:", t.includes("Wiederspielwert"));
console.log("Neue-Spiele-Prompt nennt Platzbedarf:", t.includes("Platzbedarf"));
console.log("Neue-Spiele-Prompt nennt Sprachabhängigkeit:", t.includes("Sprachabhängigkeit"));
console.log("Neue-Spiele-Prompt nennt Endpunkteberechnung:", t.includes("Endpunkteberechnung"));
console.log("Neue-Spiele-Prompt nennt Eleganz:", t.includes("Eleganz des Gameplays"));
console.log("Neue-Spiele-Prompt nennt Fiddligkeit:", t.includes("Fiddligkeit"));
console.log("Neue-Spiele-Prompt nennt Erklärzeit:", t.includes("Erklärzeit"));
console.log("Neue-Spiele-Prompt nennt Regellernen:", t.includes("Regellernen"));
console.log("Neue-Spiele-Prompt nennt Wiedereinstieg:", t.includes("Wiedereinstieg nach Pause"));
console.log("Neue-Spiele-Prompt nennt Auf-/Abbau:", t.includes("Auf- und Abbau"));
console.log("Ohne Kandidaten: Platzhalter-Hinweis:", t.includes("keine Kandidaten angegeben"));
console.log("Sammlungsdaten (Ark Nova) im Prompt enthalten:", t.includes("Ark Nova"));

// Kandidaten aus Wunschliste uebernehmen.
await page.locator('button:has-text("Aus Wunschliste übernehmen")').click();
await page.waitForTimeout(500);
// Scoped auf das Picker-Sheet selbst -- "Wingspan"/"Cascadia" stehen sonst
// schon (aus der Wunschliste) im Sammlungsauszug der Vorschau-Textarea
// darunter und wuerden die Suche sonst dorthin treffen.
const pickerSheet = page.locator('div', { hasText: "Aus Wunschliste übernehmen" }).locator('.rounded-t-\\[28px\\]').first()
  .or(page.locator('.rounded-t-\\[28px\\]', { hasText: "Aus Wunschliste übernehmen" }));
await pickerSheet.getByText("Wingspan", { exact: false }).first().click();
await pickerSheet.getByText("Cascadia", { exact: false }).first().click();
await pickerSheet.getByText("Fertig", { exact: false }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${SP}/export_newgames_filled.png` });
t = await promptText();
console.log("Nach Wunschlisten-Auswahl: Wingspan als Kandidat:", t.includes("- Wingspan"));
console.log("Nach Wunschlisten-Auswahl: Cascadia als Kandidat:", t.includes("- Cascadia"));

// Frei eingetippten Kandidaten ergaenzen.
await page.locator('textarea').first().fill("Wingspan\nCascadia\nTerraforming Mars");
await page.waitForTimeout(400);
t = await promptText();
console.log("Frei eingetippter Kandidat (Terraforming Mars) uebernommen:", t.includes("- Terraforming Mars"));

// --- Modus "Aussortieren" ---
await page.locator('button:has-text("Aussortieren")').click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${SP}/export_declutter.png` });
t = await promptText();
console.log("Aussortieren-Prompt nennt Ueberschneidungen:", t.includes("überschneiden"));
console.log("Aussortieren-Prompt nennt lange nicht gespielt:", t.includes("nicht oder nie gespielt"));
console.log("Sammlungsdaten weiterhin enthalten:", t.includes("Ark Nova"));

// Wahl bleibt nach Reload.
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.locator('button:has-text("Mehr")').last().click();
await page.waitForTimeout(700);
await page.locator('text=Für KI exportieren').click();
await page.waitForTimeout(700);
t = await promptText();
console.log("Modus 'Aussortieren' bleibt nach Reload gemerkt:", t.includes("überschneiden"));

await b.close(); server.close();
