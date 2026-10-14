// Rendert cover.svg zu cover.png (800×1200). Aufruf:
//   python3 tools/cover.py > /tmp/cover.svg
//   node tools/render-cover.mjs /tmp/cover.svg <pfad/zu/bricolage-grotesque-latin-wdth-normal.woff2> cover.png
// Voraussetzung: playwright (Chromium) und die Schriftdatei aus @fontsource-variable/bricolage-grotesque.
import { chromium } from 'playwright';
import fs from 'fs'; import os from 'os'; import path from 'path';
const [svgPath, fontPath, out = 'cover.png'] = process.argv.slice(2);
const html = path.join(os.tmpdir(), 'glut-cover.html');
fs.writeFileSync(html, `<meta charset="utf-8"><style>@font-face{font-family:'Bricolage Grotesque';src:url(file://${path.resolve(fontPath)}) format('woff2');font-weight:200 800;font-stretch:75% 100%}html,body{margin:0}</style>${fs.readFileSync(svgPath, 'utf8')}`);
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const p = await b.newPage({ viewport: { width: 800, height: 1200 } });
await p.goto('file://' + html); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
await p.screenshot({ path: out }); await b.close();
