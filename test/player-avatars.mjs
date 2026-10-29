// Prueft: Spielerprofile ohne Foto zeigen eine selbst gestaltbare Figur (Fantasie
// moeglich: Tierohren, Kopfschmuck, Haar-/Hautfarben). Neue Profile bekommen eine
// zufaellige Startfigur. Im Mitspieler-Dialog laesst sich die Figur gestalten (Alter,
// Geschlecht, Haarlaenge, Ohren, Brille, Bart, Kopfschmuck, Farben) mit Vorschau,
// Zufall und Abbrechen. Ein eigenes Foto bleibt erhalten und ist jederzeit waehlbar.
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
console.log("Anna (ohne Foto): Figur als SVG:", (await src("Anna")).startsWith("data:image/svg+xml"));
console.log("Clara (ohne Feld 'photo'): auch eine Figur:", (await src("Clara")).startsWith("data:image/svg+xml"));
console.log("Ben (mit Foto): Foto hat Vorrang:", (await src("Ben")) === PHOTO);

// Neues Profil: zufaellige Startfigur wird gespeichert
await page.locator('button.border-dashed').first().click(); await page.waitForTimeout(400);
await page.locator('input[placeholder="Name"]').first().fill("Dora"); await page.locator('button:has-text("Anlegen")').click(); await page.waitForTimeout(600);
let st = await stored();
const dora = st.find((p) => p.name === "Dora");
console.log("Neues Profil 'Dora' hat eine gespeicherte Startfigur (avatarCfg):", !!dora && !!dora.avatarCfg && ["age", "gender", "skin", "hair", "len", "ears"].every((k) => k in dora.avatarCfg));

// Dialog
const openDialog = async (name) => { await imgOf(name).dispatchEvent("touchstart"); await page.waitForTimeout(900); };
await openDialog("Anna");
console.log("Dialog: 'Figur gestalten' und 'Eigenes Foto hochladen' vorhanden:", await page.locator("button[data-design-avatar]").count() === 1 && await page.locator("button[data-upload-photo]").count() === 1);
console.log("Dialog: keine feste Figurenauswahl mehr:", await page.locator("button[data-avatar]").count() === 0);
console.log("Dialog: ohne Foto kein Foto/Figur-Umschalter:", await page.locator("button[data-own-photo]").count() === 0);
await page.locator("button[data-design-avatar]").click(); await page.waitForTimeout(500);
const prev = () => page.locator("img[data-avatar-preview]").getAttribute("src");
const pick = async (k, v) => { await page.locator(`button[data-av="${k}"][data-v="${v}"]`).click(); await page.waitForTimeout(120); };
const p0 = await prev();
await page.screenshot({ path: "/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad/avatar_editor.png" });

// Abbrechen speichert nichts
await pick("ears", "cat");
console.log("Vorschau aendert sich live (Tierohren Katze):", (await prev()) !== p0);
await page.locator('button:has-text("Abbrechen")').click(); await page.waitForTimeout(300);
st = await stored();
console.log("Abbrechen: nichts gespeichert an Anna:", !st.find((p) => p.id === "pa").avatarCfg);

// Gestalten + Fertig
await page.locator("button[data-design-avatar]").click(); await page.waitForTimeout(400);
await pick("age", "child"); 
console.log("Kind: Reihe 'Bart' verschwindet:", await page.locator('button[data-av="facial"]').count() === 0);
await pick("age", "adult");
console.log("Erwachsen: Reihe 'Bart' ist da:", await page.locator('button[data-av="facial"]').count() === 3);
await pick("gender", "f"); await pick("len", "3"); await pick("ears", "bunny"); await pick("glasses", "round"); await pick("head", "crown"); await pick("style", "curly");
await pick("len", "0");
console.log("Kahl: Reihe 'Haarstil' verschwindet:", await page.locator('button[data-av="style"]').count() === 0);
await pick("len", "3");
await page.locator('button[data-av-color="skin"][data-v="#9ED8A5"]').click(); await page.waitForTimeout(100);
await page.locator('button[data-av-color="hair"][data-v="#E36FA6"]').click(); await page.waitForTimeout(100);
const pBefore = await prev();
await page.locator("button[data-avatar-random]").click(); await page.waitForTimeout(200);
console.log("Zufall wuerfelt eine andere Figur:", (await prev()) !== pBefore);
await pick("ears", "cat"); await pick("age", "old");
await page.locator('button[data-av-color="skin"][data-v="#9ED8A5"]').click(); await page.waitForTimeout(100);
await page.screenshot({ path: "/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad/avatar_editor2.png" });
await page.locator("button[data-avatar-done]").click(); await page.waitForTimeout(400);
st = await stored();
const c = (st.find((p) => p.id === "pa") || {}).avatarCfg || {};
console.log("Fertig: Figur an Anna gespeichert (Alt, Katzenohren, gruene Haut):", c.age === "old" && c.ears === "cat" && c.skin === "#9ED8A5");
await page.keyboard.press("Escape"); await page.waitForTimeout(200);
await page.locator('button:has-text("Speichern")').last().click().catch(() => {}); await page.waitForTimeout(400);
console.log("Annas Bild im Formular ist die neue Figur:", (await src("Anna")).startsWith("data:image/svg+xml") && (await src("Anna")).includes(encodeURIComponent("#9ED8A5")));

// Foto bleibt erhalten und ist waehlbar
await openDialog("Ben");
console.log("Ben (Foto): Umschalter 'Mein Foto | Figur', Foto aktiv:", await page.locator("button[data-own-photo]").getAttribute("aria-pressed") === "true" && await page.locator("button[data-use-figure]").count() === 1);
await page.locator("button[data-design-avatar]").click(); await page.waitForTimeout(400);
await pick("ears", "bear");
await page.locator("button[data-avatar-done]").click(); await page.waitForTimeout(400);
st = await stored();
const ben = st.find((p) => p.id === "pb");
console.log("Figur gestaltet: Foto bleibt gespeichert, Figur aktiv (photoOff):", ben.photo === PHOTO && ben.photoOff === true && ben.avatarCfg.ears === "bear");
await page.locator("button[data-own-photo]").click(); await page.waitForTimeout(300);
st = await stored();
console.log("'Mein Foto' waehlt das Foto wieder:", st.find((p) => p.id === "pb").photoOff === false);
await page.keyboard.press("Escape"); await page.waitForTimeout(200);
console.log("Ben zeigt wieder sein Foto:", (await src("Ben")) === PHOTO);
await b.close(); server.close();
