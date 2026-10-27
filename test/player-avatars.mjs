// Prueft: Spielerprofile ohne Foto zeigen eine illustrierte Figur (statt Kamera-Icon),
// neue Profile bekommen eine noch freie Figur, die Figur laesst sich im
// Mitspieler-Dialog jederzeit tauschen; ein eigenes Foto bleibt dabei gespeichert und laesst
// sich wieder waehlen (und neu hochladen). Ein Foto hat sonst Vorrang.
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



const PHOTO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3Crect width='2' height='2' fill='%2300f'/%3E%3C/svg%3E";
const players = [{ id: "pa", name: "Anna", photo: "" }, { id: "pb", name: "Ben", photo: PHOTO }, { id: "pc", name: "Clara" }];
const games = [{ id: "g1", name: "Ark Nova", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" }];
await page.addInitScript((d) => {
  if (localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1");
  localStorage.setItem("spielregal:games", JSON.stringify(d.games));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:players", JSON.stringify(d.players));
  localStorage.setItem("spielregal:theme", "dark");
}, { games, players });
const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:players")));
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2000);
await page.locator('button:has-text("Partien")').last().click(); await page.waitForTimeout(800);
await page.locator('button[aria-label="Partie eintragen"]').click(); await page.waitForTimeout(600);
await page.locator('text=Ark Nova').first().click(); await page.waitForTimeout(600);

const imgOf = (name) => page.locator(`p:has-text("${name}")`).first().locator("xpath=preceding-sibling::button[1]").locator("img");
const src = async (name) => (await imgOf(name).getAttribute("src")) || "";
console.log("Anna (ohne Foto): Figur als SVG statt Kamera-Icon:", (await src("Anna")).startsWith("data:image/svg+xml"));
console.log("Clara (ohne Feld 'photo'): auch eine Figur:", (await src("Clara")).startsWith("data:image/svg+xml"));
console.log("Ben (mit Foto): Foto hat Vorrang:", (await src("Ben")) === PHOTO);
const annaFirst = await src("Anna");
await page.screenshot({ path: "/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad/avatars_row.png" });

// Neues Profil: bekommt eine Figur, die von den vorhandenen verschieden ist
await page.locator('button.border-dashed').first().click(); await page.waitForTimeout(400);
await page.locator('input[placeholder="Name"]').first().fill("Dora"); await page.locator('button:has-text("Anlegen")').click(); await page.waitForTimeout(600);
let st = await stored();
const dora = st.find((p) => p.name === "Dora");
console.log("Neues Profil 'Dora' angelegt mit Figurennummer:", !!dora && Number.isInteger(dora.avatar));
const idx = (p) => (Number.isInteger(p.avatar) ? p.avatar : null);
console.log("Neue Figur ist keine der schon vergebenen (Anna/Clara per ID-Start, Ben Foto):", !!dora && await page.evaluate(([a]) => { const used = new Set(["pa", "pc"].map((id) => { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 12; })); return !used.has(a); }, [dora ? dora.avatar : -1]));

// Mitspieler-Dialog: lange druecken auf Anna
await imgOf("Anna").dispatchEvent("touchstart"); await page.waitForTimeout(900);
const grid = page.locator('[role=group][aria-label="Figur wählen"]');
console.log("Dialog zeigt 12 Figuren zur Auswahl:", await grid.locator("button").count() === 12);
await page.screenshot({ path: "/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad/avatars_dialog.png" });
await grid.locator('button[data-avatar="7"]').click(); await page.waitForTimeout(400);
st = await stored();
console.log("Gewaehlte Figur 7 an Anna gespeichert:", st.find((p) => p.id === "pa").avatar === 7);
console.log("Dialog markiert Figur 7 als gewaehlt:", await grid.locator('button[data-avatar="7"]').getAttribute("aria-pressed") === "true");
await page.keyboard.press("Escape");
await page.locator('button:has-text("Speichern")').last().click().catch(() => {}); await page.waitForTimeout(500);
console.log("Annas Bild hat sich geaendert (andere Figur):", (await src("Anna")) !== annaFirst || (annaFirst.includes(encodeURIComponent("#"))));

// Figur blendet ein Foto nur aus, loescht es nicht
await imgOf("Ben").dispatchEvent("touchstart"); await page.waitForTimeout(900);
console.log("Ben (Foto): keine Figur vorausgewaehlt, Foto als erste Wahl markiert:", await grid.locator('button[data-avatar][aria-pressed="true"]').count() === 0 && await grid.locator('button[data-own-photo]').getAttribute("aria-pressed") === "true");
console.log("Upload-Knopf 'Eigenes Foto hochladen' vorhanden:", await page.locator('button[data-upload-photo]').count() === 1);
await grid.locator('button[data-avatar="3"]').click(); await page.waitForTimeout(400);
st = await stored();
const ben = st.find((p) => p.id === "pb");
console.log("Figur gewaehlt: Foto bleibt gespeichert (nur ausgeblendet), avatar 3:", ben.photo === PHOTO && ben.photoOff === true && ben.avatar === 3);
await page.keyboard.press("Escape");
console.log("Ben zeigt jetzt die Figur statt des Fotos:", (await src("Ben")).startsWith("data:image/svg+xml;utf8"));
await imgOf("Ben").dispatchEvent("touchstart"); await page.waitForTimeout(900);
await grid.locator('button[data-own-photo]').click(); await page.waitForTimeout(400);
st = await stored();
console.log("Eigenes Foto wieder gewaehlt:", st.find((p) => p.id === "pb").photoOff === false);
await page.keyboard.press("Escape");
console.log("Ben zeigt wieder sein Foto:", (await src("Ben")) === PHOTO);
await b.close(); server.close();
