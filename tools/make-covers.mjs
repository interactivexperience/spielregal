// Erzeugt die Cover (3:4, JPEG) der Browser-Spiele für das Spielregal-Dashboard.
// Jedes Cover nutzt die Illustrationen des jeweiligen Spiels (eigener Stil pro Spiel).
// Aufruf aus test/ (dort liegt playwright): node ../tools/make-covers.mjs
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "test", "package.json"));
const { chromium } = require("playwright");
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  try { res.end(readFileSync(path.join(root, p))); } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
const W = 480, H = 640;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
const fontCache = new Map();
function curl(url, enc) {
  if (!fontCache.has(url)) {
    try { fontCache.set(url, execFileSync("curl", ["-sS", "-m", "30", "-A", UA, url])); }
    catch (e) { console.warn("Schrift nicht ladbar:", url); fontCache.set(url, Buffer.from("")); }
  }
  return enc ? fontCache.get(url).toString(enc) : fontCache.get(url);
}
// Jede Funktion liefert das Cover-HTML und läuft im Kontext der Spielseite
const COVERS = {
  "grand-austria-hotel": () => `<div style="position:absolute;inset:0;background:#F6EBD6">
      <div style="position:absolute;left:0;right:0;top:0;height:300px;background:#E4472E;background-image:radial-gradient(#F28AA6 2.2px,transparent 2.6px);background-size:22px 22px"></div>
      <div style="position:absolute;left:150px;top:34px;width:180px;height:210px">${kaiser()}</div>
      <div style="position:absolute;left:-10px;right:-10px;bottom:-6px;height:410px">${heroSvg().replace('<rect x="120" y="58" width="120" height="30" rx="8" fill="#FFF9EE"/>', '<rect x="92" y="55" width="176" height="35" rx="9" fill="#FFF9EE"/>').replace('font-size="24" fill="#161616">GRAND HOTEL</text>', 'font-size="25" fill="#161616">Grand Hotel Wien</text>')}</div>
      <div style="position:absolute;left:30px;top:36px;width:64px;height:64px;transform:rotate(-12deg)">${dieSvg(6)}</div>
      <div style="position:absolute;right:36px;top:150px;width:54px;height:54px;transform:rotate(14deg)">${dieSvg(3)}</div>
      <div style="position:absolute;inset:10px;border:5px solid #161616;border-radius:20px;box-shadow:inset 0 0 0 3px #F6EBD6"></div></div>`,
  "three-sisters": () => `<div style="position:absolute;inset:0;background:#F8ECE1">
      <svg viewBox="0 0 480 640" style="position:absolute;inset:0;width:100%;height:100%"><g filter="url(#riso)">
        <circle cx="400" cy="214" r="58" fill="#FFD84D"/><circle cx="56" cy="250" r="26" fill="#F4A6B8"/>
        <path d="M-20,330 C80,260 160,300 240,280 C330,254 400,290 500,264 V640 H-20 Z" fill="#DDEBC4"/></g>
        ${P.moth(300, 250, 2, C.mustard)}${P.moth(170, 236, 1.6, C.sky)}</svg>
      <div style="position:absolute;left:-50px;right:-50px;bottom:-8px;height:430px">${heroSvg()}</div>
      <div style="position:absolute;left:34px;top:34px;font-family:'DM Sans',sans-serif;font-weight:700;font-size:62px;line-height:.95;letter-spacing:-2.4px;color:#2B3245">Drei<br>Schwestern.</div>
      <div style="position:absolute;left:36px;top:166px;font-family:'DM Sans',sans-serif;font-weight:500;font-size:16px;color:rgba(43,50,69,.75)">Harvest Edition · Roll &amp; Write</div></div>`,
  "rebel-princess": () => `<div style="position:absolute;inset:0;background:#F8EEDC">
      <svg viewBox="0 0 480 640" style="position:absolute;inset:0;width:100%;height:100%"><g filter="url(#crayon)" stroke="#1A1A1A" stroke-width="3">
        <path d="M30,598 H450" fill="none"/>
        ${[[418, 250], [80, 330], [420, 380], [395, 300]].map(([x, y]) => `<path d="M${x},${y - 12} l3.5,8.5 l8.5,3.5 l-8.5,3.5 l-3.5,8.5 l-3.5,-8.5 l-8.5,-3.5 l8.5,-3.5 Z" fill="#1A1A1A" stroke="none"/>`).join('')}</g></svg>
      <div style="position:absolute;left:40px;top:222px;width:316px;height:340px;background:#E27FE0"></div><div style="position:absolute;left:58px;top:162px;width:360px;height:468px"><svg viewBox="0 0 100 130" class="ill">${popify(frogSvg(), "#2BA35A")}</svg></div>
      <div style="position:absolute;left:40px;top:34px;font-family:'Caveat Brush',cursive;font-size:64px;line-height:.9;letter-spacing:.5px;text-transform:uppercase;color:#1A1A1A;transform:rotate(-2deg);transform-origin:left">Prinzessinnen-<br>ball</div>
      <div style="position:absolute;inset:12px;border:4px solid #1A1A1A;border-radius:22px"></div></div>`,
  "countryside": () => `<div style="position:absolute;inset:0;background:${PAL.cream}">
      <svg viewBox="0 0 300 400" style="position:absolute;inset:0;width:100%;height:100%">
        <rect width="300" height="400" fill="${PAL.cream}"/>
        ${W(`<circle cx="252" cy="124" r="26" fill="#F1C76A"/>`)}
        ${W(`<path d="M-10,196 C50,160 110,170 170,184 C220,196 260,160 310,170 V400 H-10 Z" fill="${PAL.hill1}"/><path d="M-10,226 C60,204 130,220 190,220 C240,220 270,206 310,210 V400 H-10 Z" fill="${PAL.hill2}"/>`)}
        ${W(`<rect x="196" y="176" width="40" height="30" fill="#F1E3C6"/><path d="M191,178 L216,156 L241,178 Z" fill="${PAL.poppy}"/><rect x="210" y="188" width="11" height="18" fill="${PAL.olive}"/>`)}
        <g transform="translate(-52,84) scale(2.1)">${tree('apfel')}</g>
        ${W(`<path d="M-10,246 C70,234 150,244 220,240 C260,238 290,236 310,238 V400 H-10 Z" fill="${PAL.sage}"/>`)}
        ${W(meadow(41, 238, 290, 20, 3, { w: 300, bottom: 404 }))}
        <g transform="translate(-50,140) scale(3.2)">${figureArt({ dress: '#E0B03E', stripe: '#FBF2DC', pants: '#7FA6CF', hair: '#6B4A3A', ear: true, prop: 'bouquet' })}</g>
        <g transform="translate(22,140) scale(3.2)">${figureArt({ dress: '#F1E6CF', stripe: '#7E9A5C', skirt: true, pants: '#B9A6D6', hair: '#3E3A36', hat: 'straw', ear: true })}</g>
        ${W(meadow(77, 336, 392, 24, 4, { w: 300, bottom: 410 }))}
        <rect width="300" height="400" filter="url(#tooth)" opacity=".3"/>
      </svg>
      <div style="position:absolute;left:32px;top:28px"><div style="font-family:Fraunces,Georgia,serif;font-weight:800;font-size:78px;letter-spacing:-3px;line-height:.95;color:#1F1A17">Landgut</div>
      <div style="font-family:Caveat,cursive;font-weight:700;font-size:34px;color:#E8641C;transform:rotate(-2deg);transform-origin:left;margin-top:4px">dein Traum vom Bauernhof.</div></div></div>`,
};
for (const [dir, fn] of Object.entries(COVERS)) {
  const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 })).newPage();
  // Schriften: Google Fonts per curl holen (der Browser selbst kommt in der Sandbox nicht hin);
  // klappt das nicht, bleibt das Cover ohne Webfont – dann Fehlermeldung beachten.
  await page.route("**/fonts.googleapis.com/**", (r) => r.fulfill({ body: curl(r.request().url(), "utf8"), contentType: "text/css" }));
  await page.route("**/fonts.gstatic.com/**", (r) => r.fulfill({ body: curl(r.request().url()), contentType: "font/woff2" }));
  await page.goto(base + dir + "/", { waitUntil: "load" });
  await page.evaluate(([src, w, h]) => {
    const html = (0, eval)("(" + src + ")")();
    const d = document.createElement("div");
    d.id = "cover";
    d.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;z-index:99999;overflow:hidden`;
    d.innerHTML = html;
    document.body.appendChild(d);
  }, [fn.toString(), W, H]);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.locator("#cover").screenshot({ path: path.join(root, dir, "cover.jpg"), type: "jpeg", quality: 84 });
  console.log("Cover:", dir);
  await page.context().close();
}
await browser.close(); server.close();
