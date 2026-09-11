import { chromium } from "playwright";
import { readFileSync } from "node:fs"; import path from "node:path"; import http from "node:http";
const D="/home/user/spielregal/test", R="/home/user/spielregal";
const v=(...p)=>path.join(D,"node_modules",...p);
const SP="/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad";
const srv=http.createServer((q,s)=>{try{s.writeHead(200);s.end(readFileSync(path.join(R,decodeURIComponent(q.url.split("?")[0]))))}catch{s.writeHead(404);s.end("nf")}});
await new Promise(r=>srv.listen(0,"127.0.0.1",r));
const url=`http://127.0.0.1:${srv.address().port}/index.html`;
const tw=readFileSync(path.join(D,"tw-built.css"),"utf8");
const fc=readFileSync(path.join(SP,"fonts","embed.css"),"utf8");
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
for (const theme of ["light","dark"]) {
  const page=await b.newPage({viewport:{width:393,height:852},deviceScaleFactor:3});
  for(const[p,f]of[["react.production.min.js",v("react","umd","react.production.min.js")],["react-dom.production.min.js",v("react-dom","umd","react-dom.production.min.js")],["babel.min.js",v("@babel","standalone","babel.min.js")]])
    await page.route(`**/cdnjs.cloudflare.com/**/${p}`,r=>r.fulfill({path:f,contentType:"application/javascript"}));
  await page.route("**/cdn.tailwindcss.com/**",r=>r.fulfill({contentType:"application/javascript",body:`window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(tw)};document.head.appendChild(s);})();`}));
  await page.route("**/fonts.googleapis.com/**",r=>r.fulfill({body:fc,contentType:"text/css"}));
  await page.addInitScript(() => {
    localStorage.setItem("spielregal:weeklyTip", JSON.stringify({
      gameId: "demo-1", gameName: "Vogelflug",
      reason: "Passt zu deinen 8er-Bewertungen für Engine Building, läuft aber in 45 statt 120 Minuten — genau die Lücke für Abende unter der Woche."
    }));
  });
  await page.goto(url,{waitUntil:"networkidle",timeout:30000}); await page.waitForTimeout(2500);
  await page.locator('button:has-text("Mehr")').last().click(); await page.waitForTimeout(700);
  await page.locator('button:has-text("Vorschau-Modus")').first().click(); await page.waitForTimeout(600);
  await page.locator('button:has-text("Demo-Vorschau anzeigen")').first().click(); await page.waitForTimeout(1200);
  await page.evaluate((t)=>window.__setTheme(t), theme); await page.waitForTimeout(400);
  await page.locator('button:has-text("Übersicht")').last().click(); await page.waitForTimeout(1000);
  await page.screenshot({path:`${SP}/tip_${theme}.png`});
  await page.close();
}
await b.close(); srv.close(); console.log("ok");
