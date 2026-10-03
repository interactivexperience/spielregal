// Zwischenland – Regel-Simulation ohne Oberfläche.
// Bots mit verschiedenen Strategien spielen tausende Partien; wir messen Balance, Länge, Ketten.
// Aufruf: node sim.mjs [partien=600] [personen=3]
// Varianten: "frei" (Richtung je Aktivierung frei wählbar) vs. "jahreszeit" (Kniff: Richtung wechselt jede Runde).

const ROWS = 4, COLS = 5;
const PLAYS = 2; // Karten pro Zug
let MODE = process.env.MODE || 'tatland'; // 'tatland' = Kniff B: eine Karte Land, eine Tat; 'frei2' = 2 beliebige
let RUHM_NUR_GESCHLOSSEN = true;
const END_ROWS = +(process.env.ENDR || 3), TRIGGER_BONUS = 4, TUCK_CLOSED = process.env.TUCKALL ? false : true;
const MAX_ROUNDS = +(process.env.MAXR || 26);

// ---------- Karten ----------
// Regeln (in Reihenfolge ausgeführt, wenn die Kette ein Plättchen erreicht):
//  src: fügt Waren hinzu · conv: wandelt um (max) · score: verbraucht für Ruhm · sell: verkauft für Münzen
//  combo: verbraucht a+b paarweise für Ruhm · vpPer: +Ruhm je hier erzeugter Ware g · endRows: Endwertung je geschlossener Reihe
const C = (id, n, side, w, cost, fam, tile, eff, edge) => ({ id, n, side, w, cost, fam, tile, eff, edge });
const START = [
  C('feldarbeit', 'Feldarbeit', 'S', 1, 1, 'start', [{ t: 'src', g: 'korn', n: 1 }], { act: 1, add: { korn: 1 } }, [{ t: 'src', g: 'korn', n: 1 }]),
  C('holzsammeln', 'Holz sammeln', 'W', 1, 1, 'start', [{ t: 'src', g: 'holz', n: 1 }], { act: 1, add: { holz: 1 } }, [{ t: 'src', g: 'holz', n: 1 }]),
  C('bluetenlese', 'Blütenlese', 'W', 1, 1, 'start', [{ t: 'src', g: 'bluete', n: 1 }], { coins: 2 }, [{ t: 'src', g: 'bluete', n: 1 }]),
  C('tagelohn', 'Tagelohn', 'S', 1, 1, 'start', [{ t: 'sell', gs: 'any', coin: 1, max: 2 }], { coins: 2, draw: 1 }, [{ t: 'sell', gs: 'any', coin: 1, max: 1 }]),
];
const MARKET_TYPES = [
  // Müller (Stadt, Frühling stark)
  C('acker', 'Acker', 'S', 1, 1, 'mueller', [{ t: 'src', g: 'korn', n: 2 }], { act: 1, add: { korn: 2 } }, [{ t: 'src', g: 'korn', n: 1 }]),
  C('feldscheune', 'Feldscheune', 'S', 2, 3, 'mueller', [{ t: 'src', g: 'korn', n: 3 }], { coins: 3 }, [{ t: 'src', g: 'korn', n: 2 }]),
  C('muehle', 'Mühle', 'S', 1, 2, 'mueller', [{ t: 'conv', from: 'korn', to: 'mehl', max: 3 }], { act: 1 }, [{ t: 'vpPer', g: 'mehl', vp: 1 }]),
  C('baeckerei', 'Bäckerei', 'S', 1, 3, 'mueller', [{ t: 'conv', from: 'mehl', to: 'brot', max: 2 }, { t: 'vpPer', g: 'brot', vp: 1 }], { coins: 2 }, [{ t: 'vpPer', g: 'brot', vp: 1 }]),
  C('gasthaus', 'Gasthaus', 'S', 2, 4, 'mueller', [{ t: 'score', g: 'brot', vp: 2, max: 3 }, { t: 'score', g: 'honig', vp: 2, max: 3 }], { act: 1 }, [{ t: 'score', g: 'moebel', vp: 3, max: 2 }]),
  // Förster (Wildnis-Quelle, Stadt verarbeitet – Herbst stark)
  C('wald', 'Wald', 'W', 1, 1, 'foerster', [{ t: 'src', g: 'holz', n: 2 }], { act: 1, add: { holz: 2 } }, [{ t: 'src', g: 'holz', n: 1 }]),
  C('hochwald', 'Hochwald', 'W', 2, 3, 'foerster', [{ t: 'src', g: 'holz', n: 3 }], { draw: 2 }, [{ t: 'src', g: 'holz', n: 2 }]),
  C('saegewerk', 'Sägewerk', 'S', 1, 2, 'foerster', [{ t: 'conv', from: 'holz', to: 'brett', max: 3 }], { coins: 1, draw: 1 }, [{ t: 'vpPer', g: 'brett', vp: 1 }]),
  C('schreinerei', 'Schreinerei', 'S', 1, 3, 'foerster', [{ t: 'conv', from: 'brett', to: 'moebel', max: 2 }, { t: 'vpPer', g: 'moebel', vp: 1 }], { act: 1 }, [{ t: 'vpPer', g: 'moebel', vp: 1 }]),
  C('biberbau', 'Biberbau', 'W', 1, 2, 'foerster', [{ t: 'score', g: 'holz', vp: 1, max: 3 }], { act: 1 }, [{ t: 'score', g: 'brett', vp: 2, max: 2 }]),
  // Imker (Wildnis)
  C('wiese', 'Wiese', 'W', 1, 1, 'imker', [{ t: 'src', g: 'bluete', n: 2 }], { coins: 2 }, [{ t: 'src', g: 'bluete', n: 1 }]),
  C('obstgarten', 'Obstgarten', 'W', 2, 3, 'imker', [{ t: 'src', g: 'bluete', n: 2 }, { t: 'src', g: 'holz', n: 1 }], { act: 1, add: { bluete: 1 } }, [{ t: 'src', g: 'bluete', n: 2 }]),
  C('bienenstock', 'Bienenstock', 'W', 1, 2, 'imker', [{ t: 'conv', from: 'bluete', to: 'honig', max: 3 }], { act: 1 }, [{ t: 'vpPer', g: 'honig', vp: 1 }]),
  C('imkerei', 'Imkerei', 'W', 2, 3, 'imker', [{ t: 'conv', from: 'bluete', to: 'honig', max: 4 }, { t: 'vpPer', g: 'honig', vp: 1 }], { coins: 3 }, [{ t: 'vpPer', g: 'honig', vp: 1 }]),
  // Händler (Stadt, Münzen)
  C('marktstand', 'Marktstand', 'S', 1, 2, 'haendler', [{ t: 'sell', gs: 'any', coin: 1, max: 3 }], { coins: 3 }, [{ t: 'sell', gs: 'any', coin: 1, max: 2 }]),
  C('kontor', 'Kontor', 'S', 2, 4, 'haendler', [{ t: 'sell', gs: ['brot', 'honig', 'moebel'], coin: 2, vp: 1, max: 3 }], { draw: 2 }, [{ t: 'sell', gs: ['mehl', 'brett'], coin: 2, max: 2 }]),
  C('laden', 'Laden', 'S', 1, 2, 'haendler', [{ t: 'sell', gs: ['honig'], coin: 3, max: 2 }], { coins: 2, buyDisc: 2 }, [{ t: 'sell', gs: ['brot'], coin: 2, max: 2 }]),
  C('rathaus', 'Rathaus', 'S', 2, 5, 'haendler', [{ t: 'endRows', vp: 2 }], { coins: 4 }, [{ t: 'endRows', vp: 1 }]),
  // Kräuter (Grenzgänger: lohnen sich nur, wenn Ketten die Grenze überqueren)
  C('kraeutergarten', 'Kräutergarten', 'W', 1, 2, 'kraeuter', [{ t: 'combo', a: 'brot', b: 'honig', vp: 4, max: 2 }], { act: 1 }, [{ t: 'combo', a: 'moebel', b: 'honig', vp: 4, max: 1 }]),
  C('teich', 'Teich', 'W', 1, 2, 'kraeuter', [{ t: 'dup', max: 2 }], { act: 1, add: { bluete: 1, korn: 1 } }, [{ t: 'dup', max: 1 }]),
];
if (!process.env.FULLPRICE) MARKET_TYPES.forEach(c => { c.cost = Math.max(1, c.cost - 1); }); // Marktkarten 1 günstiger
const RAW = ['korn', 'holz', 'bluete'];
const GOALS = [
  { k: 'brot', n: 5, tx: '5 Brot erzeugt' }, { k: 'honig', n: 6, tx: '6 Honig erzeugt' }, { k: 'moebel', n: 4, tx: '4 Möbel erzeugt' },
  { k: 'meister', n: 2, tx: '2 Meisterstücke' }, { k: 'rows', n: 2, tx: '2 Reihen geschlossen' }, { k: 'chain', n: 5, tx: 'Kette mit 5 Gliedern' },
];

// ---------- Zufall ----------
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const shuffle = (a, r) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clone = o => JSON.parse(JSON.stringify(o));

// ---------- Spielzustand ----------
function newPlayer(strat, r) {
  const deck = shuffle([...START, ...START].map(c => c.id), r);
  const p = { strat, vp: 0, coins: 4, deck, hand: [], disc: [], rows: [...Array(ROWS)].map(() => ({ S: [], W: [] })), made: {}, maxChain: 0, chains: [], goalsGot: 0 };
  draw(p, 5, r);
  return p;
}
const CARDS = Object.fromEntries([...START, ...MARKET_TYPES].map(c => [c.id, c]));
function draw(p, n, r) { for (let i = 0; i < n; i++) { if (!p.deck.length) { if (!p.disc.length) return; p.deck = shuffle(p.disc, r); p.disc = []; } p.hand.push(p.deck.pop()); } }
const used = row => row.S.reduce((s, t) => s + CARDS[t.id].w, 0) + row.W.reduce((s, t) => s + CARDS[t.id].w, 0);
const closed = row => used(row) >= COLS;
const closedCount = p => p.rows.filter(closed).length;
const tilesOf = p => p.rows.flatMap(rw => [...rw.S, ...rw.W]);

// ---------- Kette ----------
function runChain(p, ri, dir, start, dry = false) {
  const row = p.rows[ri], cl = closed(row);
  // LR: Stadt vom Tor nach rechts, bei geschlossener Reihe weiter in die Wildnis (vom Grenzrand zum Waldrand)
  const sOrder = row.S, wOrder = [...row.W].reverse();
  let order = dir === 'LR' ? (cl ? [...sOrder, ...wOrder] : sOrder) : (cl ? [...row.W, ...[...row.S].reverse()] : row.W);
  const b = { ...start }; let vp = 0, coins = 0, links = 0;
  for (const t of order) {
    const rules = [...CARDS[t.id].tile, ...t.edges.map(e => CARDS[e].edge).flat()];
    const made = {}; let acted = false;
    for (const ru of rules) {
      if (ru.t === 'src') { b[ru.g] = (b[ru.g] || 0) + ru.n; acted = true; }
      else if (ru.t === 'conv') { const k = Math.min(b[ru.from] || 0, ru.max); if (k) { b[ru.from] -= k; b[ru.to] = (b[ru.to] || 0) + k; made[ru.to] = (made[ru.to] || 0) + k; acted = true; } }
      else if (ru.t === 'score') { const k = Math.min(b[ru.g] || 0, ru.max); if (k) { b[ru.g] -= k; vp += k * ru.vp; acted = true; } }
      else if (ru.t === 'sell') { let k = ru.max; const gs = ru.gs === 'any' ? Object.keys(b) : ru.gs; for (const g of gs) { const x = Math.min(b[g] || 0, k); if (x) { b[g] -= x; k -= x; coins += x * ru.coin; vp += x * (ru.vp || 0); acted = true; } } }
      else if (ru.t === 'combo') { const k = Math.min(b[ru.a] || 0, b[ru.b] || 0, ru.max); if (k) { b[ru.a] -= k; b[ru.b] -= k; vp += k * ru.vp; acted = true; } }
      else if (ru.t === 'dup') { let k = ru.max; for (const g of RAW) { if (k && b[g]) { b[g]++; k--; acted = true; } } }
      else if (ru.t === 'vpPer') { if (made[ru.g]) vp += made[ru.g] * ru.vp; }
    }
    if (!dry) for (const g in made) p.made[g] = (p.made[g] || 0) + made[g];
    if (acted) links++;
  }
  coins += Math.floor(Object.values(b).reduce((x, y) => x + y, 0) / 2); // Rest am Kettenende: je 2 Waren 1 Münze
  if (!cl && RUHM_NUR_GESCHLOSSEN) { coins += vp; vp = 0; } // Kniff A: Ruhm nur in geschlossenen Reihen
  if (dry) return { vp, coins, links };
  p.vp += vp; p.coins += coins;
  p.maxChain = Math.max(p.maxChain, links); p.chains.push(links);
  return { vp, coins, links };
}

// ---------- Züge ----------
function landMoves(S, pi) {
  const p = S.players[pi], out = [];
  p.hand.forEach((id, hi) => {
    const c = CARDS[id];
    if (p.coins >= c.cost) for (let r = 0; r < ROWS; r++) if (COLS - used(p.rows[r]) >= c.w) out.push({ k: 'build', hi, r });
    if (p.coins >= 1) p.rows.forEach((rw, r) => { if (TUCK_CLOSED && !closed(rw)) return; ['S', 'W'].forEach(sd => rw[sd].forEach((t, ti) => { if (t.edges.length < 3) out.push({ k: 'tuck', hi, r, sd, ti }); })); });
    out.push({ k: 'brache', hi });
  });
  return out;
}
function tatMoves(S, pi) {
  const p = S.players[pi], out = [{ k: 'ruhe' }];
  const dirs = S.variant === 'jahreszeit' ? [S.season] : ['LR', 'RL'];
  p.hand.forEach((id, hi) => {
    const c = CARDS[id];
    if (c.eff.act) { for (let r = 0; r < ROWS; r++) for (const d of dirs) out.push({ k: 'eff', hi, r, d }); }
    else out.push({ k: 'eff', hi });
  });
  return out;
}
function legalMoves(S, pi) {
  const p = S.players[pi], out = [{ k: 'pause' }];
  const dirs = S.variant === 'jahreszeit' ? [S.season] : ['LR', 'RL'];
  p.hand.forEach((id, hi) => {
    const c = CARDS[id];
    if (c.eff.act) { for (let r = 0; r < ROWS; r++) for (const d of dirs) out.push({ k: 'eff', hi, r, d }); }
    else out.push({ k: 'eff', hi });
    if (p.coins >= c.cost) for (let r = 0; r < ROWS; r++) if (COLS - used(p.rows[r]) >= c.w) out.push({ k: 'build', hi, r });
    if (p.coins >= 1) p.rows.forEach((rw, r) => { if (TUCK_CLOSED && !closed(rw)) return; ['S', 'W'].forEach(sd => rw[sd].forEach((t, ti) => { if (t.edges.length < 3) out.push({ k: 'tuck', hi, r, sd, ti }); })); });
  });
  return out;
}
function applyMove(S, pi, m, r) {
  const p = S.players[pi];
  let disc = 0;
  if (m.k === 'pause') { p.coins += 2; p.disc.push(...p.hand); p.hand = []; draw(p, 5, r); return 0; }
  if (m.k === 'ruhe') { p.coins += 2; return 0; }
  if (m.k === 'brache') { const id = p.hand.splice(m.hi, 1)[0]; p.disc.push(id); p.coins += 1; return 0; }
  const id = p.hand.splice(m.hi, 1)[0], c = CARDS[id];
  if (m.k === 'eff') {
    if (c.eff.coins) p.coins += c.eff.coins;
    if (c.eff.act) runChain(p, m.r, m.d, c.eff.add || {});
    if (c.eff.buyDisc) disc = c.eff.buyDisc;
    p.disc.push(id);
    if (c.eff.draw) draw(p, c.eff.draw, r);
  } else if (m.k === 'build') {
    p.coins -= c.cost; p.rows[m.r][c.side].push({ id, edges: [] });
  } else if (m.k === 'tuck') {
    p.coins -= 1; p.rows[m.r][m.sd][m.ti].edges.push(id);
  }
  return disc;
}

// ---------- Wertung ----------
function finalScore(p) {
  let s = p.vp;
  const cl = closedCount(p);
  for (const rw of p.rows) if (closed(rw)) { const sc = rw.S.reduce((a, t) => a + CARDS[t.id].w, 0), wc = rw.W.reduce((a, t) => a + CARDS[t.id].w, 0); s += 2 * Math.min(sc, wc); }
  for (const t of tilesOf(p)) {
    if (t.edges.length >= 3) s += 5;
    for (const ru of [...CARDS[t.id].tile, ...t.edges.map(e => CARDS[e].edge).flat()]) if (ru.t === 'endRows') s += ru.vp * cl;
  }
  return s + Math.floor(p.coins / 4);
}
function goalProgress(p, g) {
  if (g.k === 'meister') return tilesOf(p).filter(t => t.edges.length >= 3).length;
  if (g.k === 'rows') return closedCount(p);
  if (g.k === 'chain') return p.maxChain;
  return p.made[g.k] || 0;
}
function checkGoals(S) {
  S.goals.forEach(g => S.players.forEach((p, pi) => {
    if (g.by.includes(pi) || g.by.length >= 2) return;
    if (goalProgress(p, g) >= g.n) { const v = g.by.length ? 3 : 6; p.vp += v; p.goalsGot++; g.by.push(pi); }
  }));
}

// ---------- Bots ----------
const STRATS = {
  kette: { e: 1.3, c: 1.0, f: 0.3, t: 0.5 },
  schliesser: { e: 0.6, c: 4.0, f: 0.9, t: 0.3 },
  meister: { e: 0.9, c: 1.0, f: 0.35, t: 1.4 },
  ausgewogen: { e: 1.0, c: 2.0, f: 0.5, t: 0.8 },
};
const TYPICAL = { korn: 1, holz: 1, bluete: 1 };
function engineValue(S, p) {
  // Ertrag je Reihe bei einer typischen Aktivierung; die zwei besten Reihen zählen (man aktiviert sie wiederholt)
  const dirs = S.variant === 'jahreszeit' ? ['LR', 'RL'] : ['LR', 'RL'];
  const per = [];
  for (let r = 0; r < ROWS; r++) {
    let best = 0;
    for (const d of dirs) { const res = runChain(p, r, d, TYPICAL, true); const v = res.vp + res.coins * 0.45 + res.links * 0.15; best = S.variant === 'jahreszeit' ? best + v / 2 : Math.max(best, v); }
    per.push(best);
  }
  per.sort((a, b) => b - a);
  return per[0] + 0.5 * per[1];
}
function evalState(S, pi) {
  const p = S.players[pi], w = STRATS[p.strat] || STRATS.ausgewogen;
  const ending = S.endAt !== null || S.players.some(o => closedCount(o) >= END_ROWS - 1);
  const filled = p.rows.reduce((a, rw) => a + used(rw), 0);
  const tucks = tilesOf(p).reduce((a, t) => a + t.edges.length + (t.edges.length >= 3 ? 1 : 0), 0);
  const lead = Math.max(...S.players.map(o => o.rows.reduce((a, rw) => a + used(rw), 0)));
  const rem = ending ? 0.6 : Math.max(1, (ROWS * COLS - lead) / 3) * 0.45; // erwartete weitere Aktivierungen
  let v = finalScore(p) + Math.min(p.coins, 8) * 0.3 + Math.max(0, p.coins - 8) * 0.08 + p.hand.length * 0.3;
  for (const rw of p.rows) if (!closed(rw)) { const sc = rw.S.reduce((a, t) => a + CARDS[t.id].w, 0), wc = rw.W.reduce((a, t) => a + CARDS[t.id].w, 0); v += 1.4 * Math.min(sc, wc) + 0.25 * (sc + wc); }
  v += w.e * rem * engineValue(S, p);
  v += w.c * closedCount(p) + w.f * filled + w.t * tucks + (closedCount(p) >= END_ROWS ? TRIGGER_BONUS : 0);
  // Ziele: Fortschritt anrechnen
  S.goals.forEach(g => { if (g.by.length < 2 && !g.by.includes(pi)) v += Math.min(1, goalProgress(p, g) / g.n) * 2; });
  return v;
}
function botTurn(S, pi, r) {
  const p = S.players[pi];
  let disc = 0, move;
  if (MODE === 'tatland') {
    // erst Land, dann Tat: Landzüge vorsortieren, Top 6 mit der besten Tat kombinieren
    const land = landMoves(S, pi);
    if (!land.length) { applyMove(S, pi, { k: 'ruhe' }, r); buy(S, pi, 0, r); draw(p, Math.max(0, 5 - p.hand.length), r); return { k: 'ruhe' }; }
    let cand;
    if (p.strat === 'zufall') cand = [land[Math.floor(r() * land.length)]];
    else cand = land.map(m => { const T = clone(S); applyMove(T, pi, m, rng(3)); return [m, evalState(T, pi)]; }).sort((a, b) => b[1] - a[1]).slice(0, 6).map(x => x[0]);
    let best = -1e9, bl = null, bt = null;
    for (const lm of cand) {
      const T = clone(S); applyMove(T, pi, lm, rng(3));
      const tats = tatMoves(T, pi);
      for (const tm of (p.strat === 'zufall' ? [tats[Math.floor(r() * tats.length)]] : tats)) {
        const U = clone(T); applyMove(U, pi, tm, rng(4)); const v = evalState(U, pi) + r() * 0.3;
        if (v > best) { best = v; bl = lm; bt = tm; }
      }
    }
    applyMove(S, pi, bl, r); disc = applyMove(S, pi, bt || { k: 'ruhe' }, r) || 0; move = bt || { k: 'ruhe' };
  } else for (let k = 0; k < PLAYS; k++) { if (!p.hand.length) break; move = bestMove(S, pi, r); disc = Math.max(disc, applyMove(S, pi, move, r)); if (move.k === 'pause') break; }
  buy(S, pi, disc, r);
  draw(p, Math.max(0, 5 - p.hand.length), r);
  return move;
}
function bestMove(S, pi, r) {
  const p = S.players[pi];
  let move;
  if (p.strat === 'zufall') { const ms = legalMoves(S, pi); move = ms[Math.floor(r() * ms.length)]; }
  else {
    let best = -1e9;
    for (const m of legalMoves(S, pi)) {
      const T = clone(S); applyMove(T, pi, m, rng(7));
      const v = evalState(T, pi) + r() * 0.3;
      if (v > best) { best = v; move = m; }
    }
  }
  return move;
}
function price(S, i) { return Math.max(0, CARDS[S.market[i]].cost - (i < 2 ? 1 : 0)); }
function buy(S, pi, disc, r) {
  const p = S.players[pi];
  let best = null, bv = 0.8;
  S.market.forEach((id, i) => {
    const pr = Math.max(0, price(S, i) - disc);
    if (pr > p.coins) return;
    const c = CARDS[id];
    const tileVal = c.tile.reduce((a, ru) => a + ({ src: ru.n * 0.6, conv: 1.2, score: ru.vp * 0.8, sell: 0.8, combo: 2.5, dup: 1, vpPer: ru.vp, endRows: ru.vp * 1.2 }[ru.t] || 0), 0);
    const v = (p.strat === 'zufall' ? r() * 3 : tileVal + 0.5) - pr * 0.45 + r() * 0.2;
    if (v > bv) { bv = v; best = i; }
  });
  if (best !== null) { p.coins -= Math.max(0, price(S, best) - disc); p.disc.push(S.market[best]); S.market.splice(best, 1); refill(S); }
}
function refill(S) { while (S.market.length < 6 && S.supply.length) S.market.push(S.supply.pop()); }

// ---------- Partie ----------
function playGame(strats, variant, seed) {
  const r = rng(seed);
  const S = { variant, season: 'LR', round: 0, endAt: null, players: strats.map(s => newPlayer(s, r)), supply: shuffle(MARKET_TYPES.flatMap(c => [c.id, c.id]), r), market: [], goals: shuffle([...GOALS], r).slice(0, 3).map(g => ({ ...g, by: [] })) };
  refill(S);
  let pi = 0, turns = 0, halfLeader = null;
  while (S.round < MAX_ROUNDS) {
    botTurn(S, pi, r); checkGoals(S); turns++;
    const p = S.players[pi];
    if (S.endAt === null && closedCount(p) >= END_ROWS) { S.endAt = pi; p.vp += TRIGGER_BONUS; }
    pi = (pi + 1) % S.players.length;
    if (pi === 0) {
      S.round++; S.season = S.season === 'LR' ? 'RL' : 'LR';
      // Auslage altert: älteste Karte fällt raus
      if (S.market.length) S.market.shift(); refill(S);
      if (S.round === 8) { const sc = S.players.map(finalScore); halfLeader = sc.indexOf(Math.max(...sc)); }
    }
    if (S.endAt !== null && pi === S.endAt) break;
  }
  const scores = S.players.map(finalScore);
  const win = scores.indexOf(Math.max(...scores));
  return { scores, win, strats, rounds: S.round, trigger: S.endAt, halfLeader, players: S.players };
}

// ---------- Auswertung ----------
const N = +(process.argv[2] || 600), NP = +(process.argv[3] || 3);
const pct = x => (100 * x).toFixed(0) + '%';
for (const variant of ['frei', 'jahreszeit']) {
  const names = Object.keys(STRATS).concat('zufall');
  const wins = {}, plays = {};
  let rounds = 0, margin = 0, winScore = 0, trigWin = 0, comeback = 0, cbN = 0, chainSum = 0, chainN = 0, chainMax = 0, fams = {}, famN = 0, noEnd = 0, rowsClosed = 0, cells = 0, built = 0, tucked = 0, pn = 0;
  for (let g = 0; g < N; g++) {
    const strats = shuffle([...names], rng(g * 31 + 5)).slice(0, NP);
    const res = playGame(strats, variant, g * 977 + 13);
    if (res.trigger === null) noEnd++;
    strats.forEach(s => plays[s] = (plays[s] || 0) + 1);
    wins[strats[res.win]] = (wins[strats[res.win]] || 0) + 1;
    rounds += res.rounds;
    const sorted = [...res.scores].sort((a, b) => b - a); margin += sorted[0] - sorted[1]; winScore += sorted[0];
    if (res.trigger === res.win) trigWin++;
    if (res.halfLeader !== null) { cbN++; if (res.halfLeader !== res.win) comeback++; }
    res.players.forEach(p => { pn++; rowsClosed += closedCount(p); cells += p.rows.reduce((a, rw) => a + used(rw), 0); built += tilesOf(p).filter(t => CARDS[t.id].fam !== 'start').length; tucked += tilesOf(p).reduce((a, t) => a + t.edges.length, 0); });
    res.players.forEach(p => { p.chains.forEach(l => { chainSum += l; chainN++; }); chainMax = Math.max(chainMax, p.maxChain); });
    const w = res.players[res.win]; tilesOf(w).forEach(t => { fams[CARDS[t.id].fam] = (fams[CARDS[t.id].fam] || 0) + 1; famN++; });
  }
  console.log(`\n=== Variante „${variant}“ · ${N} Partien · ${NP} Personen ===`);
  console.log('Siegquote je Strategie (Erwartung bei Gleichstand ' + pct(1 / NP) + '):');
  for (const s of names) console.log(`  ${s.padEnd(11)} ${pct((wins[s] || 0) / (plays[s] || 1)).padStart(4)}  (${plays[s] || 0} Partien)`);
  console.log(`Runden Ø ${(rounds / N).toFixed(1)} · Siegpunkte Ø ${(winScore / N).toFixed(1)} · Abstand 1./2. Ø ${(margin / N).toFixed(1)}`);
  console.log(`Ende-Auslöser gewinnt: ${pct(trigWin / N)} · Aufholjagd (Halbzeit-Führende verliert): ${pct(comeback / Math.max(1, cbN))} · ohne Ende (Rundengrenze): ${noEnd}`);
  console.log(`Je Person am Ende: ${(rowsClosed / pn).toFixed(1)} Reihen zu · ${(cells / pn).toFixed(1)}/${ROWS * COLS} Felder · ${(built / pn).toFixed(1)} Marktplättchen · ${(tucked / pn).toFixed(1)} eingeschoben`);
  console.log(`Kettenlänge Ø ${(chainSum / Math.max(1, chainN)).toFixed(2)} Glieder · längste ${chainMax}`);
  console.log('Plättchen der Sieger nach Familie: ' + Object.entries(fams).sort((a, b) => b[1] - a[1]).map(([f, n]) => `${f} ${pct(n / famN)}`).join(' · '));
}
