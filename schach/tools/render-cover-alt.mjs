// Alternatives Cover (schach/cover-alt.jpg, 3:4, 960x1280): „Vom Bauern zum König“.
// Eine Geschichte statt Figurenreihe: Im Vordergrund das Brett mit Bauer Bruno, von dort führt ein Weg in die Ferne
// zur Burg; am Weg stehen Springer, Läufer, Dame und am Tor der König – in der Reihenfolge des Lernpfads.
// Wichtiges liegt in der Mittelzone (Dashboard schneidet quadratisch zu). Aufruf: node schach/tools/render-cover-alt.mjs
import { chromium } from '/home/user/spielregal/test/node_modules/playwright/index.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 480, height: 640 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(path.join(root, 'konzept.html')).href);   // Schriften und Figuren-Code aus dem Konzept
await page.waitForTimeout(800);
await page.evaluate(() => {
  const INK = '#2B2535';
  let seed = 7; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647, jit = a => (R() - .5) * 2 * a;
  const f = n => Math.round(n * 10) / 10;
  const st = (w = 2) => ` stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  // leicht wackeliges Vieleck: Fläche, Kontur, zweite blasse Linie
  const poly = (P, fill, w = 2, a = .7) => {
    const d = 'M' + P.map(p => f(p[0] + jit(a)) + ' ' + f(p[1] + jit(a))).join('L') + 'Z';
    const d2 = 'M' + P.map(p => f(p[0] + jit(a * 1.6)) + ' ' + f(p[1] + jit(a * 1.6))).join('L') + 'Z';
    return `<path d="${d}" fill="${fill}" transform="translate(1 1)"/><path d="${d}" fill="none"${st(w)}/><path d="${d2}" fill="none" stroke="${INK}" stroke-width=".8" opacity=".45"/>`;
  };
  const rect = (x, y, w, h, fill, sw = 2) => poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], fill, sw, .6);
  const blob = (cx, cy, rx, ry, n = 9) => { let d = ''; const P = []; for (let i = 0; i < n; i++) { const a = i / n * 6.283, k = 1 + jit(.1); P.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; let s = m(P[n - 1], P[0]); d = `M${f(s[0])} ${f(s[1])}`; for (let i = 0; i < n; i++) { const q = P[i], e = m(P[i], P[(i + 1) % n]); d += `Q${f(q[0])} ${f(q[1])} ${f(e[0])} ${f(e[1])}`; } return d + 'Z'; };
  const tree = (x, y, s, kind) => kind === 'pine'
    ? `<ellipse cx="${x + 3}" cy="${y}" rx="${9 * s}" ry="${2.4 * s}" fill="${INK}" opacity=".22"/>` + rect(x - 1.5 * s, y - 5 * s, 3 * s, 5 * s, '#7A5232', 1.4) +
      [0, 1, 2].map(t => poly([[x - (11 - t * 2.4) * s, y - 4 * s - t * 8 * s], [x, y - 17 * s - t * 8 * s], [x + (11 - t * 2.4) * s, y - 4 * s - t * 8 * s]], t === 2 ? '#58B947' : '#2F8F3C', 1.6, .5)).join('')
    : `<ellipse cx="${x + 3}" cy="${y}" rx="${10 * s}" ry="${2.6 * s}" fill="${INK}" opacity=".22"/>` + rect(x - 1.8 * s, y - 8 * s, 3.6 * s, 8 * s, '#7A5232', 1.4) +
      `<path d="${blob(x, y - 15 * s, 11 * s, 11 * s)}" fill="#58B947" transform="translate(1 1)"/><path d="${blob(x - 2 * s, y - 17 * s, 6.5 * s, 6 * s, 7)}" fill="#9BDB62"/><path d="${blob(x, y - 15 * s, 11 * s, 11 * s)}" fill="none"${st(1.8)}/>`;
  // ---------- Szene ----------
  const W = 480, H = 640;
  // Weg (Perspektive): vom Burgtor oben zum Brett unten
  const gate = [132, 288], endY = 478;
  const cx = t => gate[0] + 108 * t + 44 * (.3 + .7 * t) * Math.sin(6.283 * t), cy = t => gate[1] + (endY - gate[1]) * t, cw = t => 6 + 96 * Math.pow(t, 1.35);
  const L = [], Rr = [], C = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40; L.push([cx(t) - cw(t) / 2, cy(t)]); Rr.push([cx(t) + cw(t) / 2, cy(t)]); C.push([cx(t), cy(t)]); }
  const road = 'M' + L.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'L' + Rr.reverse().map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z';
  const center = 'M' + C.map(p => f(p[0]) + ' ' + f(p[1])).join('L');
  // Brett in Perspektive
  const TL = [112, 482], TR = [372, 482], BR = [452, 640], BL = [28, 640];
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const bp = (u, v) => lerp(lerp(TL, TR, u), lerp(BL, BR, u), v);
  let cells = '';
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    const P = [bp(i / 8, j / 8), bp((i + 1) / 8, j / 8), bp((i + 1) / 8, (j + 1) / 8), bp(i / 8, (j + 1) / 8)];
    cells += `<path d="M${P.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z" fill="${(i + j) % 2 ? '#5FA55A' : '#E3F0A8'}"/>`;
  }
  const bd = `M${[TL, TR, BR, BL].map(p => p.join(' ')).join('L')}Z`;
  // Burg am Horizont
  const bx = 132, by = 290;
  const castle =
    `<ellipse cx="${bx}" cy="${by + 2}" rx="62" ry="7" fill="${INK}" opacity=".22"/>` +
    rect(bx - 44, by - 20, 88, 20, '#B9B3CC', 1.8) +
    rect(bx - 14, by - 52, 28, 52, '#8E86A8', 1.8) +
    [-1, 1].map(s => poly([[bx + s * 14 - 7, by - 52], [bx + s * 14, by - 66], [bx + s * 14 + 7, by - 52]], '#7B5EA7', 1.5, .4)).join('') +
    [-1, 1].map(s => rect(bx + s * 44 - 8, by - 38, 16, 38, '#A29BBA', 1.8) + poly([[bx + s * 44 - 11, by - 38], [bx + s * 44, by - 54], [bx + s * 44 + 11, by - 38]], '#D9533E', 1.6, .4)).join('') +
    `<path d="M${bx - 7} ${by}v-11a7 7 0 0 1 14 0v11z" fill="#3B2F4A"${st(1.2)}/>` +
    `<path d="M${bx} ${by - 66}v-16" stroke="${INK}" stroke-width="2"/>` + poly([[bx, by - 82], [bx + 14, by - 78], [bx, by - 74]], '#FFC83D', 1.2, .3);
  const scene = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;left:0;top:0">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBF3E4"/><stop offset="1" stop-color="#F6E2A4"/></linearGradient>
    <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A5D46F"/><stop offset="1" stop-color="#7DBB59"/></linearGradient></defs>
    <rect width="${W}" height="290" fill="url(#sky)"/>
    <circle cx="410" cy="238" r="30" fill="#FFE9A3"/><circle cx="410" cy="238" r="30" fill="none" stroke="#F2C94C" stroke-width="2.4"/>
    <path d="M0 292 Q80 246 170 276 T330 262 T480 280 V330 H0Z" fill="#B7DA94"${st(1.6)}/>
    <path d="M${bx - 130} 296 Q${bx} 238 ${bx + 150} 296Z" fill="#92C873"${st(1.8)}/>
    <rect y="284" width="${W}" height="${H - 284}" fill="url(#gr)"/>
    <path d="M0 286 Q60 280 130 288 T300 284 T480 290" fill="none"${st(1.8)}/>
    ${castle}
    <path d="${road}" fill="#F8EBC2" transform="translate(1.5 1.5)"/><path d="${road}" fill="#F8EBC2"${st(1.8)}/>
    <path d="${center}" fill="none" stroke="${INK}" stroke-width="1.6" stroke-dasharray="1 7" stroke-linecap="round" opacity=".55"/>
    ${tree(56, 346, .85, 'pine')}${tree(430, 330, .8, 'pine')}${tree(400, 408, 1, 'round')}${tree(62, 428, 1.05, 'round')}${tree(446, 452, 1.15, 'pine')}${tree(30, 470, 1.2, 'pine')}
    <path d="${bd}" fill="${INK}" opacity=".22" transform="translate(6 8)"/>
    ${cells}<path d="${bd}" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round"/>
  </svg>`;
  // Figuren: Größe nimmt mit der Entfernung ab (Perspektive)
  const fig = (k, size, x, baseY) => `<div style="position:absolute;left:${x - size * .385}px;top:${baseY - size}px;font-size:${size}px;filter:drop-shadow(${size * .03}px ${size * .045}px 0 rgba(43,37,53,.28))">${chr(k)}</div>`;
  const at = (t, side, size) => [cx(t) + side * (cw(t) / 2 + size * .42), cy(t)];
  const q = at(.22, 1, 50), bi = at(.42, -1, 64), kn = at(.66, 1, 84);
  const figs = fig('king', 44, bx, by + 6) + fig('queen', 52, q[0], q[1] + 4) + fig('bishop', 64, bi[0], bi[1] + 4) + fig('knight', 84, kn[0], kn[1] + 4) + fig('pawn', 124, 214, 556);
  const title = `<div style="position:absolute;left:0;right:0;top:56px;text-align:center;font:900 92px/1 'Londrina Solid',cursive;color:${INK};transform:rotate(-2deg);text-shadow:4px 6px 0 rgba(43,37,53,.2)">Schach<span style="color:#E2566B">dorf</span></div>` +
    `<div style="position:absolute;left:0;right:0;top:152px;text-align:center;font:400 23px Delius,sans-serif;color:${INK}">Vom Bauern zum König.</div>`;
  document.body.innerHTML = '';
  document.body.style.cssText = 'margin:0;overflow:hidden;background:#9ED06C';
  const box = document.createElement('div');
  box.style.cssText = `position:relative;width:${W}px;height:${H}px;overflow:hidden`;
  box.innerHTML = scene + figs + title;
  document.body.appendChild(box);
});
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(root, 'cover-alt.jpg'), type: 'jpeg', quality: 90, clip: { x: 0, y: 0, width: 480, height: 640 } });
await browser.close();
console.log('schach/cover-alt.jpg geschrieben');
