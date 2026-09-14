// Prueft: sichtbarer "Neueste Version laden"-Knopf nur ab 1024px (Desktop) --
// Pull-to-Refresh (Touch-Geste) feuert dort nie, vorher war Cmd+R der
// einzige Weg. Darunter (Tablet/Handy) bleibt der Knopf unsichtbar, dort
// funktioniert die Wisch-Geste ja.
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
const base = `http://127.0.0.1:${server.address().port}/index.html`;
const twCss = readFileSync(path.join(__dirname, "tw-built.css"), "utf8");

async function open(viewport) {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const page = await b.newPage({ viewport, deviceScaleFactor: 2 });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react-dom.production.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
  await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript",
    body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
  await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
  await page.addInitScript(() => {
    localStorage.setItem("spielregal:games", JSON.stringify([]));
    localStorage.setItem("spielregal:plays", JSON.stringify([]));
    localStorage.setItem("spielregal:theme", "dark");
  });
  await page.goto(base, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2200);
  return { b, page };
}

// --- Desktop (1440px) ---
{
  const { b, page } = await open({ width: 1440, height: 900 });
  const btn = page.locator('button[aria-label="Neueste Version laden"]');
  console.log("Desktop (1440px): Knopf sichtbar:", await btn.isVisible());
  const box = await btn.boundingBox();
  console.log("Desktop: Knopf oben rechts positioniert (nicht in der schmalen Mitte-Spalte):", box.x > 1300);
  await page.screenshot({ path: `${SP}/desktop_refresh_btn.png` });

  // Klick loest tatsaechlich einen Reload mit Cache-Busting-Query aus.
  await Promise.all([
    page.waitForURL(/\?refresh=\d+/, { timeout: 5000 }),
    btn.click(),
  ]);
  console.log("Klick reloadet mit ?refresh=-Query:", /\?refresh=\d+/.test(page.url()));
  await b.close();
}

// --- Tablet (1023px, knapp unter der Schwelle) ---
{
  const { b, page } = await open({ width: 1023, height: 900 });
  const btn = page.locator('button[aria-label="Neueste Version laden"]');
  console.log("1023px: Knopf unsichtbar (Pull-to-Refresh gilt dort):", !(await btn.isVisible()));
  await b.close();
}

// --- Mobile (390px) ---
{
  const { b, page } = await open({ width: 390, height: 844 });
  const btn = page.locator('button[aria-label="Neueste Version laden"]');
  console.log("Mobile (390px): Knopf unsichtbar:", !(await btn.isVisible()));
  await b.close();
}

server.close();
