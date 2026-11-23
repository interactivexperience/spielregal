// node netzkombyse/build.mjs  → schreibt die statischen HTML-Seiten der drei Konzepte
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
for (const k of ['k1', 'k2', 'k3', 'k4', 'k5', 'k6']) {
  const mod = await import(pathToFileURL(join(here, 'src', `${k}.mjs`)).href);
  const pages = mod.pages();
  mkdirSync(join(here, k), { recursive: true });
  for (const [name, html] of Object.entries(pages)) writeFileSync(join(here, k, name), html);
  console.log(k, Object.keys(pages).join(' '));
}
