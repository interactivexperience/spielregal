// Prueft: in Grand Hotel, Drei Schwestern, Prinzessinnenball und Landgut ist das
// gewaehlte Spielregal-Profil schon vorgewaehlt (zuletzt gewaehltes, sonst das
// erste) statt eines namenlosen "Du" -- damit die Partie spaeter dem richtigen
// Spieler zugeordnet wird. Die Wahl eines Profils wird fuer alle Spiele gemerkt.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  try { const body = readFileSync(path.join(repoRoot, p)); res.writeHead(200, p.endsWith(".html") ? { "content-type": "text/html; charset=utf-8" } : {}); res.end(body); } catch { res.writeHead(404); res.end("nf"); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const players = [{ id: "pa", name: "Anna" }, { id: "pp", name: "Pu" }];
const games = ["grand-austria-hotel", "three-sisters", "rebel-princess", "countryside"];
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.route("**/fonts.googleapis.com/**", (r) => r.fulfill({ body: "", contentType: "text/css" }));
await page.route("**/fonts.gstatic.com/**", (r) => r.abort());
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.goto(base + "grand-austria-hotel/", { waitUntil: "load" });
await page.evaluate((p) => localStorage.setItem("spielregal:players", JSON.stringify(p)), players);
const on = async () => page.locator("[data-a=pickname].on").allInnerTexts();
for (const g of games) {
  await page.goto(base + g + "/", { waitUntil: "load" });
  await page.click("[data-a=setup]"); await page.waitForTimeout(300);
  console.log(`${g}: ohne Wahl ist das erste Profil (Anna) vorgewaehlt:`, JSON.stringify(await on()) === '["Anna"]');
}
// Wahl in einem Spiel gilt fuer die anderen
await page.goto(base + "three-sisters/", { waitUntil: "load" });
await page.click("[data-a=setup]"); await page.waitForTimeout(300);
await page.click("[data-a=pickname][data-n=Pu]"); await page.waitForTimeout(200);
console.log("Pu angetippt -> wird als zuletzt gewaehlt gemerkt:", await page.evaluate(() => localStorage.getItem("spielregal:lastPlayer")) === "Pu");
for (const g of games) {
  await page.goto(base + g + "/", { waitUntil: "load" });
  await page.click("[data-a=setup]"); await page.waitForTimeout(300);
  console.log(`${g}: danach ist Pu vorgewaehlt:`, JSON.stringify(await on()) === '["Pu"]');
}
// Profil existiert nicht mehr -> zurueck auf das erste
await page.evaluate(() => localStorage.setItem("spielregal:lastPlayer", "Geloescht"));
await page.goto(base + "countryside/", { waitUntil: "load" });
await page.click("[data-a=setup]"); await page.waitForTimeout(300);
console.log("Unbekannter letzter Name: faellt auf erstes Profil zurueck:", JSON.stringify(await on()) === '["Anna"]');
await browser.close(); server.close();
