// Prueft die Erweiterung "physisch/digital" fuer die Wunschliste: der
// bereits vorhandene Digital-Toggle (bisher nur bei "Besitz"/"Nur gespielt")
// ist jetzt auch bei "Wunschliste" da, mit eigenem Label ("Nur digital
// merken (kein Kaufwunsch)") -- fuer den Fall, dass man ein Spiel nur als
// Reminder zum digitalen Spielen (z.B. BGA) vormerken will, ohne es kaufen
// zu wollen. Badge/Icon-Anzeige (Grid, Detail, Dashboard) und KI-Export-Text
// muessen den Unterschied zu "digital BESESSEN" (bei Besitz) klar machen.
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
  { id: "g1", name: "Ark Nova", status: "owned", format: "digital", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
  { id: "g2", name: "Wingspan", status: "wishlist", format: "analog", year: "2019", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-02" },
];
await page.addInitScript((g) => {
  localStorage.setItem("spielregal:games", JSON.stringify(g));
  localStorage.setItem("spielregal:plays", JSON.stringify([]));
  localStorage.setItem("spielregal:theme", "dark");
}, games);

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);

// --- Dashboard: Wunschlisten-Kachel ohne Digital-Markierung ---
console.log("Dashboard: Wingspan (noch analog) OHNE 'Nur digital'-Hinweis:", await page.locator('text=Nur digital').count() === 0);

// --- Formular: Toggle bei Wunschliste vorhanden, einschalten ---
// Ueber die Dashboard-Kachel oeffnen -- die Sammlungsliste zeigt per Default
// nur "Besitz" (statusFilter-Default), Wingspan (Wunschliste) waere dort
// ohne Filterwechsel gar nicht sichtbar.
await page.locator('text=Wingspan').first().click();
await page.waitForTimeout(1000);
let edit = page.locator('button[aria-label="Bearbeiten"], button:has-text("Bearbeiten")').first();
if (await edit.count()) { await edit.click(); await page.waitForTimeout(1000); }
console.log("Formular zeigt Wunschlisten-Label 'Nur digital merken':", await page.locator('text=Nur digital merken (kein Kaufwunsch)').count() > 0);
console.log("Formular zeigt KEIN 'Digitale Version'-Label (das ist nur fuer Besitz):", await page.locator('text=Digitale Version').count() === 0);
await page.locator('text=Nur digital merken (kein Kaufwunsch)').click();
await page.waitForTimeout(300);
console.log("Nach Einschalten: Hinweistext sichtbar:", await page.locator('text=Erinnerung, es (z.B. auf BGA) zu spielen').count() > 0);
await page.screenshot({ path: `${SP}/wishlist_digital_form.png` });
await page.locator('button:has-text("Speichern")').first().click();
await page.waitForTimeout(700);

const saved = await page.evaluate(() => (JSON.parse(localStorage.getItem("spielregal:games"))||[]).find(g => g.id === "g2"));
console.log("Gespeichert: format=digital, status bleibt wishlist:", saved.format === "digital" && saved.status === "wishlist");

// Speichern schliesst NICHT nur die Bearbeiten-Sheet, sondern auch die
// Detailansicht selbst (onEdit raeumt detailGame beim Oeffnen des Formulars
// schon ab) -- wir landen also direkt zurueck auf dem Dashboard. Detailseite
// fuer die naechste Pruefung erneut ueber die Kachel oeffnen.
await page.locator('text=Wingspan').first().click();
await page.waitForTimeout(1000);

// --- Detailansicht: StatBlock zeigt 'digital'-Sub-Label auch bei Wunschliste ---
// Auf den Detailseiten-Container scopen (nicht global "text=digital"), sonst
// wuerde die Dashboard-Kachel "Nur digital" im Hintergrund faelschlich matchen.
const detailRoot = page.locator('.z-\\[56\\]');
console.log("Detail: StatBlock zeigt 'digital' auch bei Wunschliste:", await detailRoot.getByText("digital", { exact: true }).count() > 0);
await page.screenshot({ path: `${SP}/wishlist_digital_detail.png` });

// --- Grid: Globe/"Digital"-Badge erscheint jetzt auch fuer das Wunschlisten-Spiel ---
// Sammlungsliste zeigt per Default nur "Besitz" -- Filter auf "Wunschliste" umstellen.
await page.locator('button[aria-label="Zurück"]').first().click();
await page.waitForTimeout(700);
await page.locator('button:has-text("Sammlung")').last().click();
await page.waitForTimeout(800);
const filterBtn = page.locator('button[aria-label="Filter"]');
await filterBtn.first().click();
await page.waitForTimeout(500);
await page.locator('button:has-text("Wunschliste")').last().click();
await page.waitForTimeout(300);
await page.locator('button:has-text("Anwenden")').click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${SP}/wishlist_digital_grid.png` });
console.log("Grid-Karte zeigt 'Digital'-Badge fuers Wunschlisten-Spiel:", await page.locator('text=Digital').count() > 0);

// --- Dashboard: Kachel zeigt jetzt 'Nur digital' statt Jahreszahl ---
await page.locator('button:has-text("Übersicht")').last().click();
await page.waitForTimeout(800);
console.log("Dashboard: Wunschlisten-Kachel zeigt jetzt 'Nur digital':", await page.locator('text=Nur digital').count() > 0);

// --- KI-Export: unterscheidet "Nur digital vorgemerkt" (Wunschliste) von "Digital besessen" (Besitz) ---
await page.locator('button:has-text("Mehr")').last().click();
await page.waitForTimeout(700);
await page.locator('text=Für KI exportieren').click();
await page.waitForTimeout(700);
const exportText = await page.locator("textarea").last().inputValue();
console.log("Export: Ark Nova (Besitz) zeigt 'Digital besessen':", exportText.includes("Ark Nova") && exportText.includes("Digital besessen"));
console.log("Export: Wingspan (Wunschliste) zeigt 'Nur digital vorgemerkt' statt 'Digital besessen' fuer den Eintrag:", exportText.includes("Nur digital vorgemerkt"));
await page.screenshot({ path: `${SP}/wishlist_digital_export.png` });

await b.close(); server.close();
