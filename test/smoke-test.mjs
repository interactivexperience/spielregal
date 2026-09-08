// Offline smoke test for index.html.
//
// Warum: index.html hat keinen Build-Step (JSX wird per Babel-Standalone
// im Browser transpiliert). Der einzige verlässliche Weg, einen kaputten
// Push zu verhindern (Syntaxfehler, undefinierte Variablen, Abstürze beim
// Mounten), ist die Seite tatsächlich in einem Browser zu laden und auf
// Fehler zu prüfen. CDN-Domains (cdnjs, tailwindcss, googleapis) sind in
// dieser Sandbox gesperrt, daher werden React/ReactDOM/Babel aus lokal
// installierten npm-Paketen (gleiche Version wie im CDN-Tag) ausgeliefert,
// und rein kosmetische Ressourcen (Tailwind, Google Fonts) werden gestubbt.
// Fehlschlagende Aufrufe an echte Backends (Firebase, Cloudflare Worker)
// sind ohne Zugangsdaten/Netzzugang erwartet und zählen nicht als Fehler.

import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const vendor = (...p) => path.join(__dirname, "node_modules", ...p);

const EXPECTED_OFFLINE_HOSTS = [
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "firebasedatabase.app",
  "workers.dev",
  "boardgamegeek.com",
];

// Bekannte, harmlose Meldungen, die kein echter Fehler sind.
const BENIGN_MESSAGE_PATTERNS = [
  /\[BABEL\] Note: The code generator has deoptimised/,
];

function isExpectedOffline(url) {
  try {
    const host = new URL(url).hostname;
    return EXPECTED_OFFLINE_HOSTS.some((h) => host.endsWith(h));
  } catch {
    return false;
  }
}

async function serveRepo() {
  const server = http.createServer((req, res) => {
    const filePath = path.join(repoRoot, decodeURIComponent(req.url.split("?")[0]));
    try {
      const body = readFileSync(filePath);
      res.writeHead(200);
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  return { server, url: `http://127.0.0.1:${port}/index.html` };
}

async function main() {
  const { server, url } = await serveRepo();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
  const page = await browser.newPage();

  const fatalErrors = [];
  const ignoredErrors = [];

  await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", (route) =>
    route.fulfill({ path: vendor("react", "umd", "react.production.min.js"), contentType: "application/javascript" })
  );
  await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", (route) =>
    route.fulfill({ path: vendor("react-dom", "umd", "react-dom.production.min.js"), contentType: "application/javascript" })
  );
  await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", (route) =>
    route.fulfill({ path: vendor("@babel", "standalone", "babel.min.js"), contentType: "application/javascript" })
  );
  await page.route("**/cdn.tailwindcss.com/**", (route) =>
    route.fulfill({ body: "/* stubbed for offline smoke test */", contentType: "application/javascript" })
  );
  await page.route("**/fonts.googleapis.com/**", (route) =>
    route.fulfill({ body: "/* stubbed for offline smoke test */", contentType: "text/css" })
  );

  page.on("pageerror", (err) => fatalErrors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (EXPECTED_OFFLINE_HOSTS.some((h) => text.includes(h)) || BENIGN_MESSAGE_PATTERNS.some((p) => p.test(text))) {
      ignoredErrors.push(text);
    } else {
      fatalErrors.push(`console.error: ${text}`);
    }
  });
  page.on("requestfailed", (req) => {
    if (isExpectedOffline(req.url())) {
      ignoredErrors.push(`requestfailed (expected offline): ${req.url()}`);
      return;
    }
    fatalErrors.push(`requestfailed: ${req.url()} ${req.failure()?.errorText ?? ""}`);
  });

  await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1500);

  const rootLength = await page.evaluate(() => document.getElementById("root")?.innerHTML.length ?? -1);
  if (rootLength <= 0) {
    fatalErrors.push("Das #root-Element ist leer geblieben — die App hat nicht gemountet.");
  }

  await browser.close();
  server.close();

  console.log(`#root Inhalt: ${rootLength} Zeichen`);
  if (ignoredErrors.length > 0) {
    console.log(`\nIgnoriert (erwartet offline, ${ignoredErrors.length}):`);
    ignoredErrors.forEach((e) => console.log("  - " + e));
  }

  if (fatalErrors.length > 0) {
    console.log(`\nFEHLGESCHLAGEN — ${fatalErrors.length} Fehler:`);
    fatalErrors.forEach((e) => console.log("  ✗ " + e));
    process.exit(1);
  }

  console.log("\nOK — keine JS-Fehler, App hat gemountet.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Smoke-Test-Runner ist abgestürzt:", err);
  process.exit(1);
});
