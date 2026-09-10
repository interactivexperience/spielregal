// Rendert jedes Tag-Icon einzeln und vergleicht Pixel-Hashes -- deckt Icons auf,
// die zwar verschiedene Komponenten sind, aber gleich aussehen.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import http from "node:http";
const __dirname = "/home/user/spielregal/test", repoRoot = "/home/user/spielregal";
const vendor = (...p) => path.join(__dirname, "node_modules", ...p);
const SP = "/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad";
const server = http.createServer((req, res) => {
  try { res.writeHead(200); res.end(readFileSync(path.join(repoRoot, decodeURIComponent(req.url.split("?")[0])))); }
  catch { res.writeHead(404); res.end("nf"); } });
await new Promise(r => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;
const twCss = readFileSync(path.join(__dirname, "tw-built.css"), "utf8");
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await b.newPage({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 2 });
for (const [pat, file] of [["react.production.min.js", vendor("react","umd","react.production.min.js")],
  ["react-dom.production.min.js", vendor("react-dom","umd","react-dom.production.min.js")],
  ["babel.min.js", vendor("@babel","standalone","babel.min.js")]])
  await page.route(`**/cdnjs.cloudflare.com/**/${pat}`, r => r.fulfill({ path: file, contentType: "application/javascript" }));
await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript",
  body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);

const NAMES = ["Deck Building","Hand Management","Drafting","Trick-taking","Card Game","Push Your Luck",
 "Dice","Party Game","Humor","Fantasy","Science Fiction","City Building","Trains","Transportation",
 "Economic","Civilization","Fighting","Wargame","Horror","Zombies","Puzzle","Deduction","Memory",
 "Bluffing","Negotiation","Auction/Bidding","Voting","Action / Dexterity","Real-time","Action Points",
 "Travel","Nautical","Exploration","Racing","Adventure","Animals","Movies / TV / Radio theme",
 "Word Game","Storytelling","Tile Placement","Hex-and-counter","Modular Board","Grid Movement",
 "Legacy Game","Cooperative Game","Worker Placement","Engine Building","Territory Building",
 "Area Control","Variable Player Powers","Set Collection","Abstract Strategy","Sports","Unbekannt"];
const svgs = await page.evaluate((names) => {
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:0;top:0;z-index:99999;background:#fff;color:#111;display:flex;flex-wrap:wrap;width:900px";
  document.body.appendChild(host);
  const R = ReactDOM.createRoot(host);
  R.render(React.createElement("div", { style:{display:"flex",flexWrap:"wrap",width:"900px"} },
    names.map((n) => React.createElement("div", { key:n, "data-tag":n,
      style:{width:"150px",padding:"6px",display:"flex",alignItems:"center",gap:"5px",fontSize:"9px"} },
      React.createElement(tagIcon(n), { size: 22 }), n))));
  return new Promise(res => setTimeout(() => res(
    [...host.querySelectorAll("[data-tag]")].map(d => [d.dataset.tag, d.querySelector("svg").innerHTML])), 800));
}, NAMES);
await page.screenshot({ path: `${SP}/tag_icons.png`, clip: { x:0, y:0, width:900, height:340 } });
const byHash = new Map();
for (const [n, html] of svgs) {
  const h = crypto.createHash("md5").update(html.replace(/\s+/g," ").trim()).digest("hex").slice(0,8);
  if (!byHash.has(h)) byHash.set(h, []); byHash.get(h).push(n);
}
console.log("Tags:", svgs.length, "| eindeutige Icon-Formen:", byHash.size);
for (const [h, ns] of byHash) if (ns.length > 1) console.log("  IDENTISCH:", ns.join(" | "));
await b.close(); server.close();
