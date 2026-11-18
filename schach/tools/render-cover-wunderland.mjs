// Cover im Stil eines Siebdruck-Plakats (schach/cover-wunderland.jpg, 3:4, 960x1280).
// Richtung nach Owner-Referenz: streng symmetrisch, wenige flache Farben (Blau, Creme, Marine, Rot, Gold), Körnung.
// Eigene Motive: Alice, zwei Flamingos (Hälse = Herz), gespiegelte Rosenranken (links rot, rechts weiß), Spielkarten,
// Schachbrett-Teppich. Schriften kommen aus konzept.html. Aufruf: node schach/tools/render-cover-wunderland.mjs
import { chromium } from '/home/user/spielregal/test/node_modules/playwright/index.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TITLE = process.env.COVER_TITLE || 'Spiegelschach';
const SUB = process.env.COVER_SUB || 'Alice lernt Schach im Wunderland';
const OUT = process.env.COVER_OUT || 'cover-wunderland.jpg';
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 480, height: 640 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(path.join(root, 'konzept.html')).href);
await page.waitForTimeout(800);
await page.evaluate(([TITLE, SUB]) => {
  const W = 480, H = 640, BLUE = '#4F86C6', DEEP = '#1F2A4D', CREAM = '#F7F0DC', RED = '#D9473A', GOLD = '#E8B96A', LIGHT = '#8EC5EE', SKIN = '#F8D8B6', HAIR = '#F1CE74', HAIR2 = '#D9A94A';
  let seed = 3; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647, f = n => Math.round(n * 10) / 10;
  const bez = (p, t) => { const u = 1 - t; return [u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0], u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1]]; };
  const heart = (x, y, z, col) => `<path d="M${x} ${y + 4 * z}C${x - 7 * z} ${y - 1 * z} ${x - 5 * z} ${y - 7 * z} ${x} ${y - 3 * z}C${x + 5 * z} ${y - 7 * z} ${x + 7 * z} ${y - 1 * z} ${x} ${y + 4 * z}Z" fill="${col}"/>`;
  const spade = (x, y, z, col) => `<path d="M${x} ${y - 5 * z}C${x - 8 * z} ${y + 1 * z} ${x - 5 * z} ${y + 6 * z} ${x} ${y + 3 * z}C${x + 5 * z} ${y + 6 * z} ${x + 8 * z} ${y + 1 * z} ${x} ${y - 5 * z}ZM${x} ${y + 2 * z}L${x - 2 * z} ${y + 7 * z}H${x + 2 * z}Z" fill="${col}"/>`;
  const leaf = (x, y, rot, s, col) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})"><path d="M0 0C8-11 24-11 32 0C24 11 8 11 0 0Z" fill="${col}"/><path d="M3 0H27" stroke="${BLUE}" stroke-width="1.400" stroke-linecap="round" opacity=".7"/></g>`;
  const rose = (x, y, r, col) => { const dk = col === RED ? '#A12F26' : '#CFC4A6', lt = col === RED ? '#F08A78' : '#FFFFFF'; let o = '';
    for (let i = 0; i < 6; i++) { const a = i * 1.047 + .3; o += `<circle cx="${f(x + Math.cos(a) * r * .62 + 1)}" cy="${f(y + Math.sin(a) * r * .62 + 1)}" r="${f(r * .5)}" fill="${dk}"/><circle cx="${f(x + Math.cos(a) * r * .62)}" cy="${f(y + Math.sin(a) * r * .62)}" r="${f(r * .5)}" fill="${col}"/>`; }
    o += `<circle cx="${x}" cy="${y}" r="${f(r * .72)}" fill="${col}"/><circle cx="${f(x - r * .15)}" cy="${f(y - r * .15)}" r="${f(r * .42)}" fill="${lt}" opacity=".5"/>`;
    o += `<path d="M${f(x - r * .5)} ${f(y + r * .1)}a${f(r * .5)} ${f(r * .5)} 0 1 1 ${f(r * .55)} ${f(r * .42)}" fill="none" stroke="${dk}" stroke-width="2.600" stroke-linecap="round"/><path d="M${f(x - r * .22)} ${f(y - r * .05)}a${f(r * .24)} ${f(r * .24)} 0 1 1 ${f(r * .28)} ${f(r * .26)}" fill="none" stroke="${dk}" stroke-width="2.200" stroke-linecap="round"/>`;
    return o; };
  // Ranke: links mit roten, rechts (gespiegelt) mit weißen Rosen
  const vine = (col) => {
    const P = [[62, 624], [24, 524], [106, 352], [62, 198]]; let o = `<path d="${'M' + P[0].join(' ') + 'C' + P[1].join(' ') + ' ' + P[2].join(' ') + ' ' + P[3].join(' ')}" fill="none" stroke="${DEEP}" stroke-width="5" stroke-linecap="round"/>`;
    [.1, .24, .38, .52, .66, .8, .92].forEach((t, i) => { const p = bez(P, t); o += leaf(p[0], p[1], i % 2 ? -150 : -30 + (i % 3) * 8, .85, DEEP); });
    [.17, .31, .45, .6, .74].forEach((t, i) => { const p = bez(P, t); o += `<path d="M${f(p[0])} ${f(p[1])}l${i % 2 ? -6 : 6} -9l${i % 2 ? 2 : -2} 10z" fill="${DEEP}"/>`; });
    [[.2, 25], [.52, 23], [.86, 19]].forEach(([t, r]) => { const p = bez(P, t); o += rose(p[0] + (t === .52 ? 8 : -4), p[1] - 4, r, col); });
    return o; };
  // Flamingo (links, schaut zur Mitte); Hälse bilden mit dem gespiegelten ein Herz
  const FY = 14;
  const flam = () => `<g transform="translate(0 ${FY})">
    <path d="M198 342L196 398M212 342L216 394" stroke="${CREAM}" stroke-width="3.400" stroke-linecap="round"/><path d="M196 398l-8 2M216 394l-8 3" stroke="${CREAM}" stroke-width="3" stroke-linecap="round"/>
    <path d="M178 314L146 324L150 338L180 334Z" fill="${CREAM}"/><path d="M158 328l14-3M156 334l16-2" stroke="${DEEP}" stroke-width="1.400" stroke-linecap="round"/>
    <ellipse cx="204" cy="324" rx="38" ry="22" fill="${CREAM}"/>
    <path d="M190 316C206 302 232 306 236 322C224 336 202 338 188 328Z" fill="${LIGHT}"/><path d="M198 318q14-8 30-2M196 324q16-8 32-1M198 330q14-6 26-2" fill="none" stroke="${DEEP}" stroke-width="1.500" stroke-linecap="round"/>
    <path d="M224 314C192 298 172 252 202 238C220 230 232 246 231 262" fill="none" stroke="${CREAM}" stroke-width="12" stroke-linecap="round"/>
    <circle cx="231" cy="264" r="8" fill="${CREAM}"/><path d="M236 262L250 268L237 272Z" fill="${DEEP}"/><circle cx="230" cy="262" r="1.800" fill="${DEEP}"/></g>`;
  // Spielkarte
  const card = (x, y, rot, suit, col) => `<g transform="rotate(${rot} ${x} ${y})"><rect x="${x - 22}" y="${y - 32}" width="44" height="64" rx="4" fill="${CREAM}"/><rect x="${x - 18}" y="${y - 28}" width="36" height="56" rx="2" fill="none" stroke="${col}" stroke-width="1.400"/>${suit === 's' ? spade(x, y, 3.400, col) : heart(x, y, 3.400, col)}${suit === 's' ? spade(x - 12, y - 20, .9, col) : heart(x - 12, y - 20, .9, col)}</g>`;
  // Alice
  const AY = 12;
  const alice = () => `<g transform="translate(0 ${AY})">
    <ellipse cx="240" cy="566" rx="46" ry="6" fill="${DEEP}" opacity=".45"/>
    <path d="M222 420C204 438 202 482 214 506L228 494L227 444Z" fill="${HAIR}"/><path d="M258 420C276 438 278 482 266 506L252 494L253 444Z" fill="${HAIR}"/><path d="M214 470q4 18 12 24M266 470q-4 18-12 24" stroke="${HAIR2}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M232 520L228 556M248 520L260 540L258 558" stroke="${CREAM}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <ellipse cx="226" cy="560" rx="9" ry="4.500" fill="${DEEP}"/><ellipse cx="262" cy="563" rx="9" ry="4.500" fill="${DEEP}"/>
    <path d="M219 462L198 490M261 462L286 448" stroke="${SKIN}" stroke-width="6" stroke-linecap="round" fill="none"/><circle cx="197" cy="492" r="4.500" fill="${SKIN}"/><circle cx="288" cy="446" r="4.500" fill="${SKIN}"/>
    <path d="M222 458L258 458L274 524Q240 538 206 524Z" fill="${LIGHT}"/><path d="M206 524q8 8 17 2q8 8 17 2q9 6 17-2q8 6 17-2" fill="${LIGHT}" stroke="${LIGHT}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M229 466L251 466L263 528Q240 536 217 528Z" fill="${CREAM}"/><path d="M232 502h16v14h-16z" fill="none" stroke="${LIGHT}" stroke-width="1.600"/>
    <circle cx="221" cy="461" r="8" fill="${LIGHT}"/><circle cx="259" cy="461" r="8" fill="${LIGHT}"/>
    <path d="M232 452L240 460L248 452Z" fill="${LIGHT}"/>
    <circle cx="240" cy="436" r="21" fill="${SKIN}"/>
    <path d="M219 434C217 408 263 408 261 434C256 424 244 420 240 420C236 420 224 424 219 434Z" fill="${HAIR}"/>
    <path d="M221 428C230 414 250 414 259 428" fill="none" stroke="${DEEP}" stroke-width="5" stroke-linecap="round"/><path d="M256 424l14-8-1 16zM256 424l-4-12 12 2z" fill="${DEEP}"/>
    <circle cx="232" cy="440" r="3.800" fill="#3B5BCB"/><circle cx="248" cy="440" r="3.800" fill="#3B5BCB"/><circle cx="232" cy="440" r="1.600" fill="#1F2A6B"/><circle cx="248" cy="440" r="1.600" fill="#1F2A6B"/><circle cx="233" cy="438.800" r="1" fill="#fff"/><circle cx="249" cy="438.800" r="1" fill="#fff"/><ellipse cx="240" cy="449" rx="2.600" ry="3.200" fill="#C65A5A"/><ellipse cx="226" cy="446" rx="4.200" ry="3" fill="#EE6B58" opacity=".8"/><ellipse cx="254" cy="446" rx="4.200" ry="3" fill="#EE6B58" opacity=".8"/></g>`;
  // Schachbrett-Teppich in Perspektive, unten wellig
  const rug = () => { const TL = [96, 546], TR = [384, 546], BR = [478, 628], BL = [2, 628], lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], bp = (u, v) => lerp(lerp(TL, TR, u), lerp(BL, BR, u), v); let o = '';
    for (let i = 0; i < 10; i++) for (let j = 0; j < 4; j++) { const Q = [bp(i / 10, j / 4), bp((i + 1) / 10, j / 4), bp((i + 1) / 10, (j + 1) / 4), bp(i / 10, (j + 1) / 4)]; o += `<path d="M${Q.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z" fill="${(i + j) % 2 ? DEEP : '#7FB0E2'}"/>`; }
    return o + `<path d="M${TL.join(' ')}L${TR.join(' ')}" stroke="${GOLD}" stroke-width="2" opacity=".9"/>`; };
  // Schloss oben
  const castle = () => `<g transform="translate(240 240) scale(.82) translate(-240 -240)">
    <rect x="190" y="206" width="24" height="34" fill="${DEEP}"/><path d="M188 206h6v-6h4v6h4v-6h4v6h4v-6h4v6h4" fill="${DEEP}" stroke="${DEEP}" stroke-width="1"/><rect x="266" y="206" width="24" height="34" fill="${DEEP}"/><path d="M264 206h6v-6h4v6h4v-6h4v6h4v-6h4v6h4" fill="${DEEP}" stroke="${DEEP}" stroke-width="1"/>
    <rect x="226" y="196" width="28" height="44" fill="${CREAM}"/><path d="M222 198Q240 160 258 198Z" fill="${CREAM}"/>${heart(240, 188, 1.200, RED)}
    <path d="M234 240v-14a6 6 0 0 1 12 0v14z" fill="${DEEP}"/><path d="M232 214h4v8h-4zM244 214h4v8h-4z" fill="${DEEP}"/></g>`;
  // Die Grinsekatze, groß hinter Alice und so unauffällig wie möglich: Ton in Ton im Blau des Hintergrunds,
  // nur Augen und Grinsen verraten sie. Der gestreifte Schwanz windet sich als Bänder um die Ranke.
  const cat = () => { const T1 = '#5088C8', T2 = '#4C82C0', hx = 240, hy = 478;
    let o = `<path d="M${hx - 98} ${hy - 50}L${hx - 118} ${hy - 150}L${hx - 40} ${hy - 82}ZM${hx + 98} ${hy - 50}L${hx + 118} ${hy - 150}L${hx + 40} ${hy - 82}Z" fill="${T1}"/>`;
    o += `<ellipse cx="${hx}" cy="${hy}" rx="134" ry="98" fill="${T1}"/>`;
    o += `<path d="M${hx - 40} ${hy - 92}v38M${hx} ${hy - 98}v44M${hx + 40} ${hy - 92}v38M${hx - 126} ${hy - 20}h36M${hx - 120} ${hy + 18}h30M${hx + 90} ${hy - 20}h36M${hx + 90} ${hy + 18}h30" stroke="${T2}" stroke-width="12" stroke-linecap="round"/>`;
    o += `<ellipse cx="${hx - 52}" cy="${hy - 12}" rx="22" ry="25" fill="${GOLD}" opacity=".46"/><ellipse cx="${hx + 52}" cy="${hy - 12}" rx="22" ry="25" fill="${GOLD}" opacity=".46"/><ellipse cx="${hx - 52}" cy="${hy - 12}" rx="5" ry="19" fill="${T2}" opacity=".9"/><ellipse cx="${hx + 52}" cy="${hy - 12}" rx="5" ry="19" fill="${T2}" opacity=".9"/>`;
    o += `<path d="M${hx - 92} ${hy + 30}Q${hx} ${hy + 120} ${hx + 92} ${hy + 30}" fill="none" stroke="${CREAM}" stroke-width="7" stroke-linecap="round" opacity=".38"/>`;
    for (let i = -4; i <= 4; i++) { const px = hx + i * 19, py = hy + 62 + 20 - Math.abs(i) * 4.600; o += `<path d="M${px} ${py - 16}v13" stroke="${CREAM}" stroke-width="4.400" stroke-linecap="round" opacity=".32"/>`; }
    o += `<path d="M${hx - 12} ${hy + 14}h24l-12 13z" fill="${T2}" opacity=".9"/>`;
    const P = [[62, 624], [24, 524], [106, 352], [62, 198]];
    for (let i = 0; i < 6; i++) { const t = .34 + i * .045, p = bez(P, t), q = bez(P, t + .012); const nx = -(q[1] - p[1]), ny = q[0] - p[0], l = Math.hypot(nx, ny) || 1; o += `<path d="M${f(p[0] - nx / l * 5)} ${f(p[1] - ny / l * 5)}L${f(p[0] + nx / l * 5)} ${f(p[1] + ny / l * 5)}" stroke="${BLUE}" stroke-width="3.400" stroke-linecap="round" opacity=".95"/>`; }
    return o; };
  // Wachsmalstift-Textur (kurze Striche in gemischten Winkeln), Glühen und Funkeln: träumerisch, ohne Konturen
  let crayon = ''; for (let i = 0; i < 1500; i++) { const x = R() * W, y = R() * H, L = 2 + R() * 6, a = R() < .7 ? -(.2 + R() * 1) : (.2 + R() * .9), c = R() < .55 ? CREAM : (R() < .5 ? DEEP : '#ffffff'), op = c === CREAM ? .2 : c === DEEP ? .1 : .3; crayon += `<path d="M${f(x)} ${f(y)}l${f(L * Math.cos(a))} ${f(L * Math.sin(a))}" stroke="${c}" stroke-width="${f(.8 + R() * .8)}" stroke-linecap="round" opacity="${op}"/>`; }
  let sparkle = ''; for (let i = 0; i < 26; i++) { const x = 40 + R() * 400, y = 40 + R() * 560, z = 2.400 + R() * 4; sparkle += `<path d="M${f(x)} ${f(y - z)}Q${f(x)} ${f(y)} ${f(x + z)} ${f(y)}Q${f(x)} ${f(y)} ${f(x)} ${f(y + z)}Q${f(x)} ${f(y)} ${f(x - z)} ${f(y)}Q${f(x)} ${f(y)} ${f(x)} ${f(y - z)}Z" fill="#FFF6D6" opacity="${(.4 + R() * .5).toFixed(2)}"/>`; }
  // Körnung
  let grain = ''; for (let i = 0; i < 2600; i++) { const x = R() * W, y = R() * H; grain += `M${f(x)} ${f(y)}h.01`; }
  let grain2 = ''; for (let i = 0; i < 1400; i++) { const x = R() * W, y = R() * H; grain2 += `M${f(x)} ${f(y)}h.01`; }
  // Blütenblätter
  const petals = [[120, 232, 20], [372, 252, -30], [96, 450, -10], [392, 470, 24], [146, 222, 50], [340, 226, -50]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 0C4-10 14-10 18 0C14 8 4 8 0 0Z" fill="${CREAM}"/></g>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;left:0;top:0">
    <defs><radialGradient id="gl1"><stop offset="0" stop-color="#B9D3F6" stop-opacity=".45"/><stop offset="1" stop-color="#B9D3F6" stop-opacity="0"/></radialGradient><radialGradient id="gl2"><stop offset="0" stop-color="#FFE3EE" stop-opacity=".32"/><stop offset="1" stop-color="#FFE3EE" stop-opacity="0"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="${CREAM}"/><rect x="12" y="12" width="${W - 24}" height="${H - 24}" rx="3" fill="${BLUE}"/>
    <path d="${grain}" stroke="${CREAM}" stroke-width="1.300" stroke-linecap="round" opacity=".2"/><path d="${grain2}" stroke="${DEEP}" stroke-width="1.200" stroke-linecap="round" opacity=".16"/>
    <rect x="22" y="22" width="${W - 44}" height="${H - 44}" rx="2" fill="none" stroke="${CREAM}" stroke-width="1.300" opacity=".75"/>
    ${[[22, 22], [W - 22, 22], [22, H - 22], [W - 22, H - 22]].map(c => `<circle cx="${c[0]}" cy="${c[1]}" r="3.200" fill="${CREAM}"/>`).join('')}
    <g clip-path="url(#inner)">${rug()}</g>
    <clipPath id="inner"><rect x="12" y="12" width="${W - 24}" height="${H - 24}"/></clipPath>
    ${vine(RED)}<g transform="translate(${W} 0) scale(-1 1)">${vine('#F7F0DC')}</g>
    <circle cx="240" cy="470" r="250" fill="url(#gl1)"/><circle cx="240" cy="130" r="200" fill="url(#gl2)"/>
    ${cat()}
    ${petals}
    ${castle()}
    ${flam()}<g transform="translate(${W} 0) scale(-1 1)">${flam()}</g>
    ${card(106, 316, -12, 's', DEEP)}${card(374, 316, 12, 'h', RED)}
    ${alice()}
    ${sparkle}<g clip-path="url(#inner)">${crayon}</g>
    <text x="240" y="116" text-anchor="middle" font-family="Londrina Solid, cursive" font-weight="900" font-size="70" fill="${DEEP}" transform="translate(4 5)" opacity=".55">${TITLE}</text>
    <text x="240" y="116" text-anchor="middle" font-family="Londrina Solid, cursive" font-weight="900" font-size="70" fill="${CREAM}">${TITLE}</text>
    <path d="M110 150h96M274 150h96" stroke="${CREAM}" stroke-width="1.500" opacity=".8"/>${heart(240, 150, 1.600, RED)}
    <text x="240" y="178" text-anchor="middle" font-family="Delius, sans-serif" font-size="17" fill="${CREAM}">${SUB}</text>
  </svg>`;
  document.body.innerHTML = '';
  document.body.style.cssText = 'margin:0;overflow:hidden;background:#F7F0DC';
  const box = document.createElement('div');
  box.style.cssText = `position:relative;width:${W}px;height:${H}px;overflow:hidden`;
  box.innerHTML = svg;
  document.body.appendChild(box);
}, [TITLE, SUB]);
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(root, OUT), type: 'jpeg', quality: 90, clip: { x: 0, y: 0, width: 480, height: 640 } });
await browser.close();
console.log('schach/' + OUT + ' geschrieben');
