// Simuliert iPhone 14 Pro: env(safe-area-inset-*) gibt es headless nicht, also
// wird es in einer Testkopie durch Variablen mit den echten Werten ersetzt.
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path"; import http from "node:http";
const D="/home/user/spielregal/test", R="/home/user/spielregal";
const v=(...p)=>path.join(D,"node_modules",...p);
const SP="/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad";

let html = readFileSync(path.join(R,"index.html"),"utf8");
html = html.replace(/env\(safe-area-inset-top(?:,\s*[^)]*)?\)/g, "var(--sa-top)")
           .replace(/env\(safe-area-inset-bottom(?:,\s*[^)]*)?\)/g, "var(--sa-bottom)")
           .replace(/env\(safe-area-inset-left(?:,\s*[^)]*)?\)/g, "var(--sa-left)")
           .replace(/env\(safe-area-inset-right(?:,\s*[^)]*)?\)/g, "var(--sa-right)")
           .replace("<style>", "<style>\n:root{--sa-top:59px;--sa-bottom:SABOTTOMpx;--sa-left:0px;--sa-right:0px;}\n");
html = html.replace("SABOTTOM", process.env.SAB || "34");
writeFileSync(path.join(SP,"sim.html"), html);

const srv=http.createServer((q,s)=>{ const u=decodeURIComponent(q.url.split("?")[0]);
  try{s.writeHead(200);s.end(readFileSync(u==="/index.html"?path.join(SP,"sim.html"):path.join(R,u)))}catch{s.writeHead(404);s.end("nf")}});
await new Promise(r=>srv.listen(0,"127.0.0.1",r));
const url=`http://127.0.0.1:${srv.address().port}/index.html`;
const tw=readFileSync(path.join(D,"tw-built.css"),"utf8");
const fc=readFileSync(path.join(SP,"fonts","embed.css"),"utf8");
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
const page=await b.newPage({viewport:{width:393,height:852},deviceScaleFactor:3});
for(const[p,f]of[["react.production.min.js",v("react","umd","react.production.min.js")],["react-dom.production.min.js",v("react-dom","umd","react-dom.production.min.js")],["babel.min.js",v("@babel","standalone","babel.min.js")]])
  await page.route(`**/cdnjs.cloudflare.com/**/${p}`,r=>r.fulfill({path:f,contentType:"application/javascript"}));
await page.route("**/cdn.tailwindcss.com/**",r=>r.fulfill({contentType:"application/javascript",body:`window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(tw)};document.head.appendChild(s);})();`}));
await page.route("**/fonts.googleapis.com/**",r=>r.fulfill({body:fc,contentType:"text/css"}));
await page.goto(url,{waitUntil:"networkidle",timeout:30000}); await page.waitForTimeout(2500);
await page.locator('button:has-text("Mehr")').last().click(); await page.waitForTimeout(700);
await page.locator('button:has-text("Vorschau-Modus")').first().click(); await page.waitForTimeout(600);
await page.locator('button:has-text("Demo-Vorschau anzeigen")').first().click(); await page.waitForTimeout(1200);

await page.locator('button:has-text("Sammlung")').last().click(); await page.waitForTimeout(900);
const m = await page.evaluate(() => {
  const tab=[...document.querySelectorAll("button")].find(b=>/Übersicht/.test(b.textContent));
  const pill=tab.closest('[class*="rounded-full"][class*="px-1.5"]');
  const pr=pill.getBoundingClientRect();
  const row=[...document.querySelectorAll("div.fixed.z-30")].find(d=>d.className.includes("justify-center"));
  const rr=row&&row.getBoundingClientRect();
  return { vh:innerHeight, pillTop:Math.round(pr.top), pillBottom:Math.round(pr.bottom),
    lueckeUnten: Math.round((innerHeight-pr.bottom)*10)/10,
    reiheUnterkante: rr?Math.round(rr.bottom):null,
    abstandReiheZuLeiste: rr?Math.round(pr.top-rr.bottom):null };
});
console.log(JSON.stringify(m,null,1));
await page.screenshot({ path: `${SP}/sim_14pro.png` });
await b.close(); srv.close();
