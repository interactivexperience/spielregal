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
import { writeFileSync, readFileSync as rf } from "node:fs";
const SP = "/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad";
const page = await b.newPage({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript", body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
await page.addInitScript((d) => { if (localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1"); localStorage.setItem("spielregal:games", JSON.stringify(d.games)); localStorage.setItem("spielregal:plays", JSON.stringify(d.plays)); localStorage.setItem("spielregal:lists", JSON.stringify(d.lists)); localStorage.setItem("spielregal:theme", "dark");
  localStorage.setItem("spielregal:backupSince", new Date(Date.now() - 20 * 86400000).toISOString()); }, { games, plays, lists });
await page.goto(url, { waitUntil: "networkidle" }); await page.waitForTimeout(1500);
// Erinnerung nach >14 Tagen ohne Sicherung
check("Erinnerung auf der Uebersicht (20 Tage ohne Sicherung)", (await page.locator("[data-backup-reminder]").count()) === 1);
await page.locator("[data-backup-open]").click(); await page.waitForTimeout(500);
check("'Jetzt sichern' oeffnet direkt die Sicherungs-Seite", (await page.locator("[data-backup-view]").count()) === 1);
await page.locator('button:has-text("Übersicht")').last().click(); await page.waitForTimeout(500);
await page.locator("[data-backup-snooze]").click(); await page.waitForTimeout(300);
check("'In 7 Tagen erinnern' blendet aus", (await page.locator("[data-backup-reminder]").count()) === 0);
await page.reload({ waitUntil: "networkidle" }); await page.waitForTimeout(1200);
check("Aufschub bleibt nach Neustart", (await page.locator("[data-backup-reminder]").count()) === 0);
// Sicherung erstellen
await page.locator('button:has-text("Mehr")').last().click(); await page.waitForTimeout(500);
await page.locator('text=Sicherung').first().click(); await page.waitForTimeout(500);
check("Sicherungs-Seite zeigt 3 Spiele, 3 Partien, 1 Liste", (await page.locator("[data-backup-view]").innerText()).includes("3 Spiele · 3 Partien · 1 Listen"));
const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("[data-backup-save]").click()]);
const file = `${SP}/sicherung.json`; await dl.saveAs(file);
const j = JSON.parse(rf(file, "utf8"));
check("Datei: app=spielregal, 3 Spiele, 3 Partien, 1 Liste (" + dl.suggestedFilename() + ")", j.app === "spielregal" && j.data.games.length === 3 && j.data.plays.length === 3 && j.data.lists.length === 1 && /^spielregal-sicherung-\d{4}-\d{2}-\d{2}\.json$/.test(dl.suggestedFilename()));
await page.waitForTimeout(400);
check("'Letzte Sicherung' wird gemerkt", (await page.locator("[data-backup-last]").innerText()).startsWith("Letzte Sicherung"));
// Speicher leeren (Spiele weg), dann aus der Datei einspielen
await page.evaluate(() => { localStorage.setItem("spielregal:games", "[]"); localStorage.setItem("spielregal:plays", "[]"); localStorage.setItem("spielregal:lists", "[]"); });
await page.reload({ waitUntil: "networkidle" }); await page.waitForTimeout(1200);
await page.locator('button:has-text("Mehr")').last().click(); await page.waitForTimeout(500);
await page.locator('text=Sicherung').first().click(); await page.waitForTimeout(500);
writeFileSync(`${SP}/kaputt.json`, "{nicht json");
await page.locator("[data-backup-file]").setInputFiles(`${SP}/kaputt.json`); await page.waitForTimeout(300);
check("Ungueltige Datei: Fehlermeldung, nichts passiert", (await page.locator("[data-backup-msg]").innerText()).includes("keine gültige Sicherung") && (await page.locator("[data-backup-confirm]").count()) === 0);
writeFileSync(`${SP}/fremd.json`, JSON.stringify({ hallo: 1 }));
await page.locator("[data-backup-file]").setInputFiles(`${SP}/fremd.json`); await page.waitForTimeout(300);
check("Fremde JSON-Datei wird abgelehnt", (await page.locator("[data-backup-msg]").innerText()).includes("keine Spielregal-Sicherung"));
await page.locator("[data-backup-file]").setInputFiles(file); await page.waitForTimeout(400);
check("Rueckfrage nennt Datei (3 Spiele) und aktuellen Stand (0)", (await page.locator("[data-backup-confirm]").innerText()).includes("3 Spiele, 3 Partien, 1 Listen") && (await page.locator("[data-backup-confirm]").innerText()).includes("0 Spiele"));
await page.locator("[data-backup-cancel]").click(); await page.waitForTimeout(200);
check("Abbrechen: nichts geaendert", (await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:games")).length)) === 0);
await page.locator("[data-backup-file]").setInputFiles(file); await page.waitForTimeout(300);
await page.locator("[data-backup-apply]").click(); await page.waitForTimeout(800);
const after = await page.evaluate(() => ({ g: JSON.parse(localStorage.getItem("spielregal:games")), p: JSON.parse(localStorage.getItem("spielregal:plays")), l: JSON.parse(localStorage.getItem("spielregal:lists")) }));
check("Eingespielt: 3 Spiele, 3 Partien, Liste mit Spielen", after.g.length === 3 && after.p.length === 3 && after.l.length === 1 && after.l[0].gameIds.length === 2);
await b.close(); server.close();
console.log(ok ? "Sicherungs-Test bestanden: true" : "FEHLER"); process.exit(ok ? 0 : 1);
