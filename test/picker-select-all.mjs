// Prueft zwei Fixes im MultiGamePickerSheet (z.B. "Aus Wunschliste
// uebernehmen"): 1) "Fertig (N)" durfte bei langem Titel umbrechen (Zahl
// landete auf einer eigenen Zeile) -- jetzt in einer eigenen nowrap-Gruppe.
// 2) Es gibt jetzt "Alle"/"Keine" zum Massenauswaehlen, einzelnes Toggle
// bleibt weiterhin moeglich.
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

// Viele Wunschlisten-Spiele, damit der Titel "Aus Wunschliste uebernehmen"
// genauso eng wird wie im gemeldeten Fall.
const games = [
  { id: "g0", name: "Ark Nova", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], addedDate: "2026-01-01" },
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `w${i}`, name: `Wunschspiel ${String.fromCharCode(65 + i)}`, status: "wishlist",
    categories: [], mechanisms: [], publishers: [], designers: [], addedDate: `2026-02-0${i + 1}`,
  })),
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
await page.locator('button:has-text("Neue Spiele")').click();
await page.waitForTimeout(400);
await page.locator('button:has-text("Aus Wunschliste übernehmen")').click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${SP}/picker_header.png` });

const pickerSheet = page.locator('.rounded-t-\\[28px\\]', { hasText: "Aus Wunschliste übernehmen" });
const fertigBtn = pickerSheet.getByText(/^Fertig/).first();
const fertigBox = await fertigBtn.boundingBox();
// Einzeilig: Box-Hoehe entspricht einer Zeile (deutlich < 2x Zeilenhoehe).
console.log("'Fertig (N)' steht auf einer Zeile (Box-Hoehe < 26px):", fertigBox.height < 26);

// --- Alle auswaehlen ---
const alleBtn = pickerSheet.getByText("Alle", { exact: true });
console.log("'Alle'-Knopf vorhanden:", await alleBtn.count() > 0);
await alleBtn.click();
await page.waitForTimeout(300);
console.log("Nach 'Alle': Fertig zeigt alle 6 Wunschlisten-Spiele:", (await fertigBtn.innerText()).includes("(6)"));
console.log("Knopf zeigt jetzt 'Keine':", await pickerSheet.getByText("Keine", { exact: true }).count() > 0);

// --- Einzelnes Abwaehlen bleibt moeglich ---
await pickerSheet.getByText("Wunschspiel A", { exact: false }).first().click();
await page.waitForTimeout(300);
console.log("Nach Einzel-Abwahl: noch 5 ausgewaehlt:", (await fertigBtn.innerText()).includes("(5)"));

// --- Keine (alle abwaehlen) ---
await pickerSheet.getByText("Alle", { exact: true }).click();
await page.waitForTimeout(200);
await pickerSheet.getByText("Keine", { exact: true }).click();
await page.waitForTimeout(300);
console.log("Nach 'Keine': Fertig ohne Zaehler:", (await fertigBtn.innerText()).trim() === "Fertig");

await b.close(); server.close();
