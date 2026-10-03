// Erzeugt KARTEN.md aus den Kartendaten in sim.mjs (eine Quelle der Wahrheit)
import fs from 'fs';
const src = fs.readFileSync(new URL('./sim.mjs', import.meta.url), 'utf8');
const data = src.slice(src.indexOf('const C ='), src.indexOf('const RAW'));
const { START, MARKET_TYPES } = new Function(data + '; return { START, MARKET_TYPES };')();
if (!process.env.FULLPRICE) MARKET_TYPES.forEach(c => { c.cost = Math.max(1, c.cost - 1); });
const G = { korn: 'Korn', mehl: 'Mehl', brot: 'Brot', holz: 'Holz', brett: 'Bretter', moebel: 'Möbel', bluete: 'Blüten', honig: 'Honig' };
const rule = r => ({
  src: () => `+${r.n} ${G[r.g]}`, conv: () => `${G[r.from]} → ${G[r.to]} (bis ${r.max})`, score: () => `${G[r.g]} → ${r.vp} Ruhm je Stück (bis ${r.max})`,
  sell: () => `${r.gs === 'any' ? 'beliebige Ware' : r.gs.map(g => G[g]).join('/')} → ${r.coin} Münze${r.coin > 1 ? 'n' : ''}${r.vp ? ` + ${r.vp} Ruhm` : ''} (bis ${r.max})`,
  combo: () => `je ${G[r.a]} + ${G[r.b]} → ${r.vp} Ruhm (bis ${r.max})`, dup: () => `verdoppelt bis zu ${r.max} Rohwaren`,
  vpPer: () => `+${r.vp} Ruhm je hier erzeugtem ${G[r.g]}`, endRows: () => `Ende: +${r.vp} Ruhm je geschlossener Reihe`,
}[r.t]());
const eff = e => [e.act ? `Aktiviere eine Reihe${e.add ? ' mit ' + Object.entries(e.add).map(([g, n]) => `+${n} ${G[g]}`).join(', ') : ''}` : '', e.coins ? `+${e.coins} Münzen` : '', e.draw ? `ziehe ${e.draw}` : '', e.buyDisc ? `nächster Kauf −${e.buyDisc}` : ''].filter(Boolean).join(', ');
const FAM = { start: 'Start', mueller: 'Müller', foerster: 'Förster', imker: 'Imker', haendler: 'Händler', kraeuter: 'Kräuter' };
let md = '# Zwischenland – Karten (Stand Simulation)\n\nJede Karte hat drei Verwendungen: **Land** (als Plättchen bauen, Kosten zahlen), **Rand** (unter ein Plättchen einer geschlossenen Reihe schieben, 1 Münze) oder **Tat** (Effekt).\nS = Stadt (wächst vom Stadttor nach rechts), W = Wildnis (wächst vom Waldrand nach links). Breite = belegte Felder.\n\n';
md += '| Familie | Karte | Seite | Breite | Kosten | Plättchen (in der Kette) | Tat | Rand (Upgrade) |\n|---|---|---|---|---|---|---|---|\n';
for (const c of [...START, ...MARKET_TYPES]) md += `| ${FAM[c.fam]} | **${c.n}** | ${c.side} | ${c.w} | ${c.cost} | ${c.tile.map(rule).join('; ')} | ${eff(c.eff)} | ${c.edge.map(rule).join('; ')} |\n`;
md += `\nStartdeck je Person: je 2× ${START.map(c => c.n).join(', ')} (8 Karten). Markt: ${MARKET_TYPES.length} Arten × 2 = ${MARKET_TYPES.length * 2} Karten, 6 liegen offen.\n`;
fs.writeFileSync(new URL('./KARTEN.md', import.meta.url), md);
console.log('KARTEN.md geschrieben:', START.length + MARKET_TYPES.length, 'Arten');
