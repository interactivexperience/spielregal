// Erzeugt die Cover (3:4, JPEG) der Browser-Spiele für das Spielregal-Dashboard.
// Jedes Cover nutzt die Illustrationen des jeweiligen Spiels (eigener Stil pro Spiel).
// Aufruf aus test/ (dort liegt playwright): node ../tools/make-covers.mjs
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
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
// Jede Funktion liefert das Cover-HTML und läuft im Kontext der Spielseite
const COVERS = {
  "grand-austria-hotel": () => `<div style="position:absolute;inset:0;background:#F6EBD6">
      <div style="position:absolute;left:0;right:0;top:0;height:300px;background:#E4472E;background-image:radial-gradient(#F28AA6 2.2px,transparent 2.6px);background-size:22px 22px"></div>
      <div style="position:absolute;left:150px;top:34px;width:180px;height:210px">${kaiser()}</div>
      <div style="position:absolute;left:-10px;right:-10px;bottom:-6px;height:410px">${heroSvg()}</div>
      <div style="position:absolute;left:30px;top:36px;width:64px;height:64px;transform:rotate(-12deg)">${dieSvg(6)}</div>
      <div style="position:absolute;right:36px;top:150px;width:54px;height:54px;transform:rotate(14deg)">${dieSvg(3)}</div>
      <div style="position:absolute;inset:10px;border:5px solid #161616;border-radius:20px;box-shadow:inset 0 0 0 3px #F6EBD6"></div></div>`,
  "three-sisters": () => `<div style="position:absolute;inset:0;background:#F8ECE1">
      <svg viewBox="0 0 480 640" style="position:absolute;inset:0;width:100%;height:100%"><g filter="url(#riso)">
        <circle cx="340" cy="130" r="78" fill="#FFD84D"/><circle cx="120" cy="90" r="34" fill="#F4A6B8"/>
        <path d="M-20,290 C80,220 160,260 240,240 C330,214 400,250 500,224 V640 H-20 Z" fill="#DDEBC4"/></g>
        ${P.moth(90, 210, 2.4, C.mustard)}${P.moth(240, 80, 2, C.sky)}${P.moth(420, 260, 1.8, C.pink)}</svg>
      <div style="position:absolute;left:-60px;right:-60px;bottom:-10px;height:500px">${heroSvg()}</div></div>`,
  "rebel-princess": () => `<div style="position:absolute;inset:0;background:#F4F0E9">
      <svg viewBox="0 0 480 640" style="position:absolute;inset:0;width:100%;height:100%"><g filter="url(#crayon)" stroke="#1A1A1A" stroke-width="3">
        <path d="M30,560 H450" fill="none"/><path d="M240,0 V60" fill="none" stroke-width="2"/><path d="M212,90 C212,52 268,52 268,90 Z" fill="#1A1A1A"/>
        ${[[70, 90], [410, 120], [80, 330], [420, 360], [360, 40], [120, 200], [390, 230]].map(([x, y]) => `<path d="M${x},${y - 12} l3.5,8.5 l8.5,3.5 l-8.5,3.5 l-3.5,8.5 l-3.5,-8.5 l-8.5,-3.5 l8.5,-3.5 Z" fill="#1A1A1A" stroke="none"/>`).join('')}</g></svg>
      <div style="position:absolute;left:40px;top:120px;width:400px;height:520px"><svg viewBox="0 0 100 130" class="ill">${frogSvg()}</svg></div>
      <div style="position:absolute;inset:12px;border:4px solid #1A1A1A;border-radius:22px"></div></div>`,
  "countryside": () => `<div style="position:absolute;inset:0;background:${PAL.cream}">
      <svg viewBox="0 0 300 400" style="position:absolute;inset:0;width:100%;height:100%">
        <rect width="300" height="400" fill="${PAL.cream}"/>
        ${W(`<circle cx="226" cy="74" r="30" fill="#F1C76A"/>`)}
        ${W(`<path d="M-10,196 C50,160 110,170 170,184 C220,196 260,160 310,170 V400 H-10 Z" fill="${PAL.hill1}"/><path d="M-10,226 C60,204 130,220 190,220 C240,220 270,206 310,210 V400 H-10 Z" fill="${PAL.hill2}"/>`)}
        ${W(`<rect x="196" y="176" width="40" height="30" fill="#F1E3C6"/><path d="M191,178 L216,156 L241,178 Z" fill="${PAL.poppy}"/><rect x="210" y="188" width="11" height="18" fill="${PAL.olive}"/>`)}
        <g transform="translate(-52,62) scale(2.1)">${tree('apfel')}</g>
        ${W(`<path d="M-10,246 C70,234 150,244 220,240 C260,238 290,236 310,238 V400 H-10 Z" fill="${PAL.sage}"/>`)}
        ${W(meadow(41, 238, 290, 20, 3, { w: 300, bottom: 404 }))}
        <g transform="translate(-50,140) scale(3.2)">${figureArt({ dress: '#E0B03E', stripe: '#FBF2DC', pants: '#7FA6CF', hair: '#6B4A3A', ear: true, prop: 'bouquet' })}</g>
        <g transform="translate(22,140) scale(3.2)">${figureArt({ dress: '#F1E6CF', stripe: '#7E9A5C', skirt: true, pants: '#B9A6D6', hair: '#3E3A36', hat: 'straw', ear: true })}</g>
        ${W(meadow(77, 336, 392, 24, 4, { w: 300, bottom: 410 }))}
        <rect width="300" height="400" filter="url(#tooth)" opacity=".3"/>
      </svg></div>`,
};
for (const [dir, fn] of Object.entries(COVERS)) {
  const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 })).newPage();
  await page.route("**/fonts.googleapis.com/**", (r) => r.fulfill({ body: "", contentType: "text/css" }));
  await page.route("**/fonts.gstatic.com/**", (r) => r.abort());
  await page.goto(base + dir + "/", { waitUntil: "load" });
  await page.evaluate(([src, w, h]) => {
    const html = (0, eval)("(" + src + ")")();
    const d = document.createElement("div");
    d.id = "cover";
    d.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;z-index:99999;overflow:hidden`;
    d.innerHTML = html + "<style>#cover text{display:none}</style>";
    document.body.appendChild(d);
  }, [fn.toString(), W, H]);
  await page.waitForTimeout(300);
  await page.locator("#cover").screenshot({ path: path.join(root, dir, "cover.jpg"), type: "jpeg", quality: 84 });
  console.log("Cover:", dir);
  await page.context().close();
}
await browser.close(); server.close();
