// Prueft die Export-Optimierungen:
// 1. Migration: eine VORHER gespeicherte Einstellung "Beschreibungstext an"
//    wird einmalig auf aus gesetzt (der Code-Default allein kam bei
//    bestehenden Nutzern nie an). Danach bleibt eine manuelle Wahl erhalten.
// 2. Bereits verkaufte Spiele stehen in eigenem Abschnitt, nicht unter
//    "IM BESITZ" -- Zaehler stimmt.
// 3. Erweiterungen erscheinen nur als Name beim Basisspiel (wenn es im selben
//    Abschnitt steht); ihr eigener "zum Verkauf"-Status bleibt sichtbar.
//    Ohne Basisspiel im selben Abschnitt: weiterhin eigene Zeile.
// 4. KI-Antworten wie "keinem" werden nicht mehr als deutscher Titel
//    uebernommen, echte Titel wie "Keine Panik" schon.
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

const base = { categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" };
const games = [
  { ...base, id: "g1", name: "Mindbug", status: "owned" },
  { ...base, id: "g2", name: "Mindbug: Beyond Evolution", status: "owned", saleStatus: "forSale", expansionOf: "g1" },
  { ...base, id: "g3", name: "Mindbug: Beyond Eternity", status: "owned", expansionOf: "g1" },
  { ...base, id: "g4", name: "On Mars", status: "owned", saleStatus: "sold" },
  { ...base, id: "g5", name: "On Mars: Alien Invasion", status: "none", expansionOf: "g4" },
  { ...base, id: "g6", name: "Ark Nova", status: "owned", summary: "Baue den besten Zoo." },
];
// Nur beim allerersten Laden seeden -- sonst wuerde addInitScript bei jedem
// Reload die alte Einstellung wieder herstellen und die Persistenz-Pruefung
// verfaelschen.
await page.addInitScript((g) => {
  if (localStorage.getItem("__seeded")) return;
  localStorage.setItem("__seeded", "1");
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
  localStorage.setItem("spielregal:exportMode", JSON.stringify("raw"));
  localStorage.setItem("spielregal:exportOptions", JSON.stringify({
    includeWishlist: true, includeOnlyPlayed: true, includeSummary: true, includeSold: true,
    includeYear: true, includePublisher: true, includePlayerCount: true,
    includeDuration: true, includeComplexity: true, includeRating: true, includeThemes: true,
  }));
}, games);

const openExport = async () => {
  await page.locator('button:has-text("Mehr")').last().click();
  await page.waitForTimeout(700);
  await page.locator('text=Für KI exportieren').click();
  await page.waitForTimeout(700);
};
const section = (text, header) => ((text.split(`=== ${header}`)[1] || "").split("\n\n===")[0]);

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2000);
await openExport();
const t = await page.locator("textarea").inputValue();

// 1. Migration
console.log("Migration: gespeicherte Einstellung 'Beschreibung an' wurde einmalig auf aus gesetzt:", !t.includes("Baue den besten Zoo"));

// 2. Verkaufte separat
const owned = section(t, "IM BESITZ");
const sold = section(t, "BEREITS VERKAUFT");
console.log("IM BESITZ zaehlt nur Basisspiele ohne Verkaufte (2):", t.includes("=== IM BESITZ (2) ==="));
console.log("On Mars (verkauft) NICHT unter IM BESITZ:", !owned.includes("On Mars"));
console.log("On Mars im eigenen Abschnitt BEREITS VERKAUFT (1):", t.includes("=== BEREITS VERKAUFT, NICHT MEHR IM BESITZ (1) ===") && sold.includes("- On Mars |"));

// 3. Erweiterungen
console.log("Keine eigene Zeile fuer Erweiterungen des Basisspiels:", !owned.includes("- Mindbug: Beyond"));
console.log("Basisspiel nennt Erweiterungen inkl. 'zum Verkauf' der Erweiterung:",
  owned.includes("Eigene Erweiterungen: Mindbug: Beyond Evolution (zum Verkauf markiert), Mindbug: Beyond Eternity"));
console.log("Verkauftes On Mars nennt NICHT die nur gespielte Alien Invasion als eigene Erweiterung:", !sold.includes("Alien Invasion"));
console.log("Erweiterung ohne Basisspiel im selben Abschnitt bleibt eigene Zeile mit 'Erweiterung von':",
  /- On Mars: Alien Invasion[^\n]*Erweiterung von: On Mars/.test(section(t, "NUR GESPIELT")));

// 1b. Manuelle Wahl nach der Migration bleibt erhalten
await page.locator('button:has-text("Beschreibungstext")').click();
await page.waitForTimeout(300);
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await openExport();
const t2 = await page.locator("textarea").inputValue();
console.log("Nach Migration: manuell wieder eingeschaltete Beschreibung bleibt nach Reload erhalten:", t2.includes("Baue den besten Zoo"));

// 4. KI-"kein Titel"-Antworten
const ai = await page.evaluate(() => ({
  keinem: cleanAiAnswer("keinem"),
  quoted: cleanAiAnswer("\"keiner\""),
  phrase: cleanAiAnswer("Kein deutscher Titel"),
  real: cleanAiAnswer("Keine Panik"),
}));
console.log("KI-Antwort 'keinem' wird verworfen:", ai.keinem === null);
console.log("KI-Antwort '\"keiner\"' wird verworfen:", ai.quoted === null);
console.log("KI-Antwort 'Kein deutscher Titel' wird verworfen:", ai.phrase === null);
console.log("Echter Titel 'Keine Panik' bleibt:", ai.real === "Keine Panik");

await b.close(); server.close();
