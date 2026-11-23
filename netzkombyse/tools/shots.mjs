// node netzkombyse/tools/shots.mjs <k1|k2|k3> <outDir> [page...]  – Screenshots + Konsolenfehler
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import http from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [k, out, ...only] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { const p = join(root, decodeURIComponent(q.url.split('?')[0].split('#')[0])); const f = existsSync(p) && !p.endsWith('/') ? p : join(p, 'index.html');
  if (!existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': mime[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f)); }).listen(0);
const port = srv.address().port, base = `http://localhost:${port}/${k}/`;
const b = await chromium.launch();
const errs = [];
const shoot = async (name, url, vp, opt = {}) => {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1 }); const p = await ctx.newPage();
  p.on('console', m => { if (m.type() === 'error') errs.push(`${name}: ${m.text()}`); }); p.on('pageerror', e => errs.push(`${name}: ${e.message}`));
  await p.goto(base + url, { waitUntil: 'load' }); await p.waitForTimeout(opt.wait ?? 1500);
  if (opt.full) { // alles einblenden, damit der Ganzseiten-Shot nicht leer ist
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 60)); } scrollTo({ top: 0, behavior: 'instant' }); });
    await p.waitForTimeout(1200);
  }
  if (opt.fn) await opt.fn(p);
  await p.screenshot({ path: join(out, name + '.png'), fullPage: !!opt.full }); await ctx.close();
};
const D = { width: 1440, height: 900 }, M = { width: 390, height: 844 };
const pages = ['index', 'leistung', 'case', 'praesentation'];
for (const pg of pages) {
  if (only.length && !only.includes(pg) && !only.includes('all')) continue;
  await shoot(`${pg}-desk`, pg + '.html', D);
  await shoot(`${pg}-desk-full`, pg + '.html', D, { full: true });
  await shoot(`${pg}-mob`, pg + '.html', M);
}
if (!only.length || only.includes('menu')) {
  await shoot('menu-desk', 'index.html#menu', D, { wait: 2000 });
  await shoot('menu-mob', 'index.html#menu', M, { wait: 2000 });
}
console.log(errs.length ? 'FEHLER:\n' + errs.join('\n') : 'Keine Konsolenfehler.');
await b.close(); srv.close();
