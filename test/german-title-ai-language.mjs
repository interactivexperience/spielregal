// Prueft den Bugreport "Deutscher Titel KI ist manchmal eine andere Sprache
// als Deutsch": beide KI-Prompts, die den deutschen Titel ermitteln
// (aiIdentifyGameInfoFromName ohne BGG-Verknuepfung, aiIdentifyGermanInfo
// mit BGG-Verknuepfung ueber die alternativen Titel), muessen die KI jetzt
// explizit auffordern, die Sprache wirklich zu pruefen statt nur aehnlich
// klingende Titel zu raten. Prueft den tatsaechlich gesendeten Prompt-Text
// UND dass eine gueltige Antwort weiterhin korrekt ins Formular uebernommen wird.
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

const capturedPrompts = [];
await page.route("**/fake-ai-worker.test/chat", (route) => {
  const body = JSON.parse(route.request().postData());
  const prompt = body.messages[0].content;
  capturedPrompts.push(prompt);
  const isThingLevel = prompt.includes("Alternative Titel");
  const text = isThingLevel
    ? "TITEL: Bärenstarke Ausgabe\nVERLAGE: keiner"
    : "ORIGINALVERLAG: keiner\nTITEL: Nebelspiel\nVERLAGE: keiner";
  route.fulfill({ contentType: "application/json", body: JSON.stringify({ text }) });
});

// Alternativnamen OHNE deutsche Hinweiswoerter/Umlaute -- die lokale
// GERMAN_HINTS-Heuristik in bggThing() findet dadurch nichts, der KI-Pfad
// (aiIdentifyGermanInfo) wird ausgeloest.
const fakeThingXml = `<?xml version="1.0"?><items>
  <item type="boardgame" id="999">
    <name type="primary" value="Bar International" />
    <name type="alternate" value="Bar Special Edition" />
    <name type="alternate" value="Bar Toidenkorento" />
    <yearpublished value="2020" />
  </item>
</items>`;
await page.route("**/xmlapi2/thing?id=999*", r => r.fulfill({ body: fakeThingXml, contentType: "text/xml" }));

const games = [
  { id: "g1", name: "Foo", status: "owned", bggId: "", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
  { id: "g2", name: "Bar International", status: "owned", bggId: "999", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-02" },
];
await page.addInitScript((g) => {
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
  localStorage.setItem("spielregal:aiWorkerUrl", "https://fake-ai-worker.test/chat");
}, games);

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);
await page.locator('button:has-text("Sammlung")').last().click();
await page.waitForTimeout(800);

// --- Fall 1: kein bggId -> aiIdentifyGameInfoFromName ---
await page.locator('text=Foo').first().click();
await page.waitForTimeout(1000);
let edit = page.locator('button[aria-label="Bearbeiten"], button:has-text("Bearbeiten")').first();
if (await edit.count()) { await edit.click(); await page.waitForTimeout(1000); }
await page.locator('button:has-text("KI-Werkzeuge")').click();
await page.waitForTimeout(500);
await page.locator('text=Deutschen Titel/Verlag erraten lassen').click();
await page.waitForTimeout(700);

const promptOhneBgg = capturedPrompts[0] || "";
console.log("Prompt (ohne BGG) verlangt WIRKLICH deutschsprachigen Titel:", promptOhneBgg.includes("WIRKLICH auf Deutsch sein"));
console.log("Prompt (ohne BGG) warnt explizit vor anderen Sprachen (Niederländisch):", promptOhneBgg.includes("Niederländisch"));
console.log("Gueltige Antwort wird uebernommen (Nebelspiel im Titelfeld):", await page.locator('input[placeholder="Deutscher Titel (optional)"]').inputValue() === "Nebelspiel");
await page.screenshot({ path: `${SP}/german_title_ai_1.png` });

// KI-Werkzeuge-Sheet schliessen (Backdrop-Klick), dann zurueck zum Dashboard.
await page.mouse.click(20, 20);
await page.waitForTimeout(400);
await page.locator('button[aria-label="Zurück"]').first().click();
await page.waitForTimeout(700);

// --- Fall 2: mit bggId -> aiIdentifyGermanInfo (Auswahl unter alternativen Titeln) ---
await page.locator('text=Bar International').first().click();
await page.waitForTimeout(1000);
edit = page.locator('button[aria-label="Bearbeiten"], button:has-text("Bearbeiten")').first();
if (await edit.count()) { await edit.click(); await page.waitForTimeout(1000); }
await page.locator('button:has-text("KI-Werkzeuge")').click();
await page.waitForTimeout(500);
await page.locator('text=Deutschen Titel/Verlag nachträglich suchen').click();
await page.waitForTimeout(900);

const promptMitBgg = capturedPrompts.find((p) => p.includes("Alternative Titel")) || "";
console.log("Prompt (mit BGG) verlangt WIRKLICH deutschsprachigen Titel:", promptMitBgg.includes("WIRKLICH auf Deutsch geschrieben"));
console.log("Prompt (mit BGG) fordert Pruefung Titel fuer Titel statt nach Klang zu raten:", promptMitBgg.includes("Prüf jeden Titel einzeln") && promptMitBgg.includes("rate nicht anhand des Klangs"));
console.log("Gueltige Antwort wird uebernommen (Bärenstarke Ausgabe im Titelfeld):", await page.locator('input[placeholder="Deutscher Titel (optional)"]').inputValue() === "Bärenstarke Ausgabe");
await page.screenshot({ path: `${SP}/german_title_ai_2.png` });

await b.close(); server.close();
