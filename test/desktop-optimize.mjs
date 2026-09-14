// Prueft die Desktop-Optimierung (ab 1024px): Sheets werden zu zentrierten
// Dialogen statt Bottom-Sheets, Footer bekommt eine Maximalbreite, Content
// wird nicht mehr randlos ueber die volle Breite gezogen. Ab 1023px (knapp
// unter der Schwelle) bleibt alles beim bisherigen Mobile/Tablet-Verhalten.
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

async function setup(viewport) {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const page = await b.newPage({ viewport, deviceScaleFactor: 2 });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript",
    body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
  await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
  const games = [
    { id: "g1", name: "Ark Nova", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-01" },
    { id: "g2", name: "Brass Birmingham", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-02" },
  ];
  await page.addInitScript((g) => {
    localStorage.setItem("spielregal:games", JSON.stringify(g));
    localStorage.setItem("spielregal:plays", JSON.stringify([]));
    localStorage.setItem("spielregal:theme", "dark");
  }, games);
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2500);
  return { b, page };
}

// --- Desktop (1440px breit) ---
{
  const { b, page } = await setup({ width: 1440, height: 900 });

  // Bewusst ein KURZES Sheet fuers Vertikal-Zentrieren -- ein langes (z.B.
  // der Filter mit vielen Feldern) fuellt auch zentriert fast die ganze
  // Hoehe, das waere kein aussagekraeftiger Test. Das Dashboard-"Sortieren"
  // (Reihenfolge der Abschnitte) ist kurz genug.
  await page.locator('button[aria-label="Sortieren"]').first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SP}/desktop_1440_sort.png`, fullPage: false });
  const sortPanel = page.locator('.glass.border.border-rim\\/10.rounded-t-\\[28px\\]').first();
  const sortBox = await sortPanel.boundingBox();
  console.log("Sortier-Sheet auf Desktop vertikal zentriert (Luecke oben UND unten):", sortBox.y > 60 && (900 - sortBox.y - sortBox.height) > 60);
  console.log("Sortier-Sheet auf Desktop <= 440px breit:", sortBox.width <= 440);
  await page.keyboard.press("Escape").catch(() => {});
  await page.mouse.click(50, 50);
  await page.waitForTimeout(400);

  await page.locator('button:has-text("Sammlung")').last().click();
  await page.waitForTimeout(800);

  const navBox = await page.locator('div.rounded-full.px-1\\.5.py-1\\.5').first().boundingBox();
  console.log("Footer-Pill auf Desktop <= 420px breit:", navBox.width <= 420);
  console.log("Footer-Pill zentriert (nicht am Rand):", navBox.x > 100 && (1440 - navBox.x - navBox.width) > 100);

  const contentBox = await page.locator('h1:has-text("Sammlung")').first().boundingBox();
  console.log("Content nicht randlos ueber volle 1440px-Breite:", contentBox.x > 100);

  // Und der (lange) Filter-Sheet fuers Breiten-/Eckenrundung-Verhalten.
  const filterBtn = page.locator('button[aria-label="Filter"]');
  if (await filterBtn.count()) { await filterBtn.first().click(); await page.waitForTimeout(500); }
  await page.screenshot({ path: `${SP}/desktop_1440.png`, fullPage: false });

  const sheetPanel = page.locator('.glass.border.border-rim\\/10.rounded-t-\\[28px\\]').first();
  if (await sheetPanel.count()) {
    const box = await sheetPanel.boundingBox();
    console.log("Filter-Sheet auf Desktop <= 440px breit:", box.width <= 440);
  } else {
    console.log("Kein Sheet zum Pruefen gefunden (uebersprungen)");
  }
  await b.close();
}

// --- Knapp unter der Schwelle (1023px) -- altes Verhalten muss bleiben ---
{
  const { b, page } = await setup({ width: 1023, height: 900 });
  await page.locator('button:has-text("Sammlung")').last().click();
  await page.waitForTimeout(800);
  const navBox = await page.locator('div.rounded-full.px-1\\.5.py-1\\.5').first().boundingBox();
  console.log("1023px: Footer-Pill darf bis max. 420px breit sein (Cap gilt schon):", navBox.width <= 420);

  const filterBtn = page.locator('button[aria-label="Filter"]');
  if (await filterBtn.count()) {
    await filterBtn.first().click();
    await page.waitForTimeout(500);
    const sheetPanel = page.locator('.glass.border.border-rim\\/10.rounded-t-\\[28px\\]').first();
    if (await sheetPanel.count()) {
      const box = await sheetPanel.boundingBox();
      console.log("1023px: Sheet haengt weiterhin am unteren Rand (Mobile/Tablet-Verhalten):", (900 - box.y - box.height) < 40);
    }
  }
  await page.screenshot({ path: `${SP}/tablet_1023.png` });
  await b.close();
}

// --- Mobile (390px) -- unveraendert ---
{
  const { b, page } = await setup({ width: 390, height: 844 });
  await page.locator('button:has-text("Sammlung")').last().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SP}/mobile_390_check.png` });
  const filterBtn = page.locator('button[aria-label="Filter"]');
  if (await filterBtn.count()) {
    await filterBtn.first().click();
    await page.waitForTimeout(500);
    const sheetPanel = page.locator('.glass.border.border-rim\\/10.rounded-t-\\[28px\\]').first();
    const box = await sheetPanel.boundingBox();
    console.log("Mobile: Sheet volle Breite:", Math.abs(box.width - 390) < 5);
    console.log("Mobile: Sheet unten angedockt:", (844 - box.y - box.height) < 40);
  }
  await b.close();
}

server.close();
