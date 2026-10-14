#!/usr/bin/env node
// GLUT – Balancing-Simulation v0.1
// Aufruf:  node sim.mjs [--n 1000] [--set cool=1,dice=4] [--quiet]
// Die Regeln stehen in REGELN.md; hier sind sie 1:1 als Code abgebildet.
// Bots = einschrittige Greedy-Bewertung (value) mit Profil-Gewichten. Das ist eine UNTERGRENZE
// für Spielstärke: zeigt Ausreißer-Strategien, ersetzt keine Tests mit Menschen.

// ---------- Parameter (per --set überschreibbar) ----------
const PARAM = {
  rounds: 0,          // 0 = nach Spielerzahl (ROUNDS_BY)
  dice: 4,            // Start-Würfel je Spieler
  cool: 1,            // Abkühlung pro Einsatz
  ofenMin: 4,         // Schmelzofen: Mindesthitze
  startDuk: 3,
  schuerenExtraHolz: 1, // jedes weitere Schüren in einer Runde kostet Holz
  openOrders: 3,
  openCards: 4,
  guildFirst: 4, guildSecond: 2,
  dukPerRuhm: 4,
  noise: 0.15,
  rest: 0,            // 1 = Schüren nur durch Passen (Rasten würfelt kalte Würfel neu), kein Schüren mitten in der Runde
  lookDepth: 3, lookBeam: 3, lookTop: 8,   // Planer-Bot: Tiefe, Strahlbreite, Kandidaten im ersten Schritt
  orderQ: -3,          // Offset auf Güte-Anforderungen der Aufträge
  cap: 0,             // Slots pro Ort (0 = nach Spielerzahl)
  batchSand: 2,       // Sand je Glasmasse im Ofen
  priceMul: 1.5,        // Verkaufspreise
  orderMul: 1.3,        // Auftragsruhm
  passFirst: 1,       // 1 = wer zuerst passt, beginnt die nächste Runde
};
const SAND = [0, 1, 2, 3, 3, 4, 5];     // Sandbank: Ertrag nach Hitze
const PRICE0 = { S: 2, P: 5, Z: 5 };
const price = (t) => Math.round(PRICE0[t] * PARAM.priceMul);     // Kontor: Verkaufspreis
const ROUNDS_BY = { 2: 8, 3: 6, 4: 8 };
const capFor = (np) => (PARAM.cap || (np >= 3 ? 2 : 1));
const roundsFor = (np) => PARAM.rounds || ROUNDS_BY[np];
const scoreAt = (np) => [roundsFor(np) / 2, roundsFor(np)];
const PLACES = ['sand', 'asche', 'wald', 'ofen', 'blas', 'kontor', 'gilde'];

const CARDS = [
  { id: 'waechter',    tier: 3, cost: 7, guild: 'M', ruhm: 2, fx: 'nocool'  }, // erster Einsatz/Runde kühlt nicht
  { id: 'lehrling',    tier: 3, cost: 6, guild: 'M', ruhm: 1, fx: 'dice'    }, // +1 Würfel
  { id: 'ofenmeister', tier: 2, cost: 5, guild: 'M', ruhm: 2, fx: 'ofen3'   }, // Ofen ab Hitze 3
  { id: 'haendler',    tier: 2, cost: 5, guild: 'H', ruhm: 2, fx: 'kont1'   }, // +1 Dukat je verkauftem Stück
  { id: 'sandkarre',   tier: 1, cost: 3, guild: 'B', ruhm: 1, fx: 'sand1'   }, // Sandbank +1
  { id: 'holzrecht',   tier: 1, cost: 3, guild: 'B', ruhm: 1, fx: 'holz1'   }, // Wald +1
  { id: 'zunft',       tier: 2, cost: 5, guild: 'H', ruhm: 3, fx: null      },
  { id: 'glasmeister', tier: 2, cost: 5, guild: 'B', ruhm: 2, fx: 'qual1'   }, // Glasstücke +1 Güte
  { id: 'sparglut',    tier: 3, cost: 6, guild: 'M', ruhm: 2, fx: 'bfree'   }, // erstes Anfachen/Runde gratis
  { id: 'aschebrenner',tier: 1, cost: 3, guild: 'M', ruhm: 1, fx: 'soda1'   }, // Aschehütte +1
  { id: 'kontorist',   tier: 3, cost: 7, guild: 'H', ruhm: 3, fx: 'sell1'   }, // Kontor +1 Stück
  { id: 'lehrbrief',   tier: 1, cost: 2, guild: 'B', ruhm: 2, fx: null      },
];
const CARD = Object.fromEntries(CARDS.map(c => [c.id, c]));

const ORDER_T = [
  { need: [{ t: 'P', q: 8 }], ruhm: 5, duk: 0 },
  { need: [{ t: 'P', q: 10 }], ruhm: 7, duk: 0 },
  { need: [{ t: 'Z', q: 8 }], ruhm: 6, duk: 0 },
  { need: [{ t: 'Z', q: 10 }], ruhm: 8, duk: 0 },
  { need: [{ t: 'S', q: 4 }, { t: 'S', q: 4 }], ruhm: 4, duk: 2 },
  { need: [{ t: 'S', q: 5 }, { t: 'S', q: 5 }, { t: 'S', q: 3 }], ruhm: 7, duk: 0 },
  { need: [{ t: 'P', q: 6 }, { t: 'S', q: 4 }], ruhm: 7, duk: 0 },
  { need: [{ t: 'Z', q: 7 }, { t: 'S', q: 3 }], ruhm: 7, duk: 0 },
  { need: [{ t: 'P', q: 8 }, { t: 'Z', q: 8 }], ruhm: 11, duk: 0 },
  { need: [{ t: 'P', q: 6 }, { t: 'P', q: 6 }], ruhm: 9, duk: 0 },
  { need: [{ t: 'Z', q: 6 }, { t: 'Z', q: 6 }], ruhm: 9, duk: 0 },
  { need: [{ t: 'S', q: 6 }], ruhm: 3, duk: 3 },
];

// ---------- Profile ----------
const BASE_W = {
  sand: 0.3, soda: 0.4, holz: 0.6, masse: 1.3, duk: 0.5, heat: 0.3,
  piece: { S: 1.2, P: 3.0, Z: 3.0 }, orderBonus: 1.0,
  sign: { B: 0.9, H: 0.9, M: 0.9 }, cardFx: 1.2,
};
const merge = (o) => ({
  ...BASE_W, ...o,
  piece: { ...BASE_W.piece, ...(o.piece || {}) },
  sign: { ...BASE_W.sign, ...(o.sign || {}) },
});
const PROFILES = {
  ausgewogen: { w: merge({}) },
  blaeser:    { w: merge({ sign: { B: 1.5 }, piece: { S: 1.4, P: 3.6, Z: 3.6 } }) },
  haendler:   { w: merge({ sign: { H: 1.5 }, duk: 0.7 }) },
  meister:    { w: merge({ sign: { M: 1.5 }, cardFx: 2.2 }) },
  kurzsichtig:{ w: merge({ sand: 0.1, soda: 0.1, holz: 0.2, masse: 0.4, heat: 0.1, sign: { B: 0.3, H: 0.3, M: 0.3 } }) },
  zufall:     { random: true, w: merge({}) },
  planer:     { look: true, w: merge({}) },
  planer_bl:  { look: true, w: merge({ sign: { B: 1.5 }, piece: { S: 1.4, P: 3.6, Z: 3.6 } }) },
  planer_ha:  { look: true, w: merge({ sign: { H: 1.5 }, duk: 0.7 }) },
  planer_me:  { look: true, w: merge({ sign: { M: 1.5 }, cardFx: 2.2 }) },
};

// ---------- Hilfen ----------
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const roll = (r) => 1 + Math.floor(r() * 6);
function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const has = (p, fx) => p.cards.some(id => CARD[id].fx === fx);
const sum = (a) => a.reduce((x, y) => x + y, 0);
const clonePlayer = (p) => ({ ...p, dice: p.dice.slice(), res: { ...p.res }, pieces: p.pieces.map(x => ({ ...x })), cards: p.cards.slice(), signs: { ...p.signs }, src: { ...p.src }, st: { ...p.st } });

function assign(pieces, need) {
  const used = new Set(), res = [];
  const ord = need.map((_, i) => i).sort((a, b) => need[b].q - need[a].q);
  for (const i of ord) {
    let best = -1;
    pieces.forEach((pc, j) => {
      if (used.has(j) || pc.t !== need[i].t || pc.q < need[i].q) return;
      if (best < 0 || pc.q < pieces[best].q) best = j;
    });
    if (best < 0) return null;
    used.add(best); res.push(best);
  }
  return res;
}

// ---------- Spielaufbau ----------
function newGame(profNames, seed) {
  const rnd = mulberry32(seed);
  const np = profNames.length;
  const players = profNames.map((name, seat) => ({
    name, seat, prof: PROFILES[name],
    dice: Array.from({ length: PARAM.dice }, () => roll(rnd)),
    res: { sand: 2, soda: 1, holz: 1, masse: 0, duk: PARAM.startDuk },
    pieces: [], cards: [], signs: { B: 0, H: 0, M: 0 }, ruhm: 0,
    passed: false, schueren: 0, noCoolUsed: false, bfreeUsed: false,
    src: { order: 0, guild: 0, card: 0, left: 0 },
    st: { turns: 0, work: 0, schueren: 0, orders: 0, sold: 0, built: 0 },
  }));
  const orderDeck = shuffle(ORDER_T.map(o => ({ ...o, need: o.need.map(n => ({ ...n, q: n.q + PARAM.orderQ })) })), rnd);
  const cardDeck = shuffle(CARDS.map(c => c.id), rnd);
  return {
    rnd, np, players, round: 1, first: 0,
    places: PLACES.map(() => []),
    orders: orderDeck.splice(0, PARAM.openOrders), orderDeck,
    market: cardDeck.splice(0, PARAM.openCards), cardDeck,
    turns: 0,
  };
}

// ---------- Aktionen ----------
// View = { p, places, orders, market, rnd, pi, real, g }
function view(g, pi, real) {
  return real
    ? { p: g.players[pi], places: g.places, orders: g.orders, market: g.market, rnd: g.rnd, pi, real, g }
    : { p: clonePlayer(g.players[pi]), places: g.places.map(a => a.slice()), orders: g.orders.slice(), market: g.market.slice(), rnd: g.rnd, pi, real, g };
}

function bcost(p, nb) { return Math.max(0, nb - ((has(p, 'bfree') && !p.bfreeUsed && nb > 0) ? 1 : 0)); }

function singles(p, maxB = 2) {
  const out = [], seen = new Set();
  p.dice.forEach((h, i) => {
    if (h <= 0) return;
    for (let b = 0; b <= maxB && h + b <= 6; b++) {
      const key = h + ':' + b;
      if (seen.has(key)) continue; seen.add(key);
      out.push({ i, b, eff: h + b, cost: bcost(p, b) });
    }
  });
  return out;
}
function pairs(p) {
  const out = [], seen = new Set();
  for (let i = 0; i < p.dice.length; i++) for (let j = i + 1; j < p.dice.length; j++) {
    const hi = p.dice[i], hj = p.dice[j]; if (hi <= 0 || hj <= 0) continue;
    for (let b1 = 0; b1 <= 1; b1++) for (let b2 = 0; b2 <= 1; b2++) {
      if (hi + b1 > 6 || hj + b2 > 6) continue;
      const key = [hi, hj, b1, b2].join(':'); if (seen.has(key)) continue; seen.add(key);
      out.push({ i, j, b1, b2, e1: hi + b1, e2: hj + b2, cost: bcost(p, b1 + b2) });
    }
  }
  return out;
}

function actions(s) {
  const p = s.p, R = p.res, out = [{ type: 'pass' }];
  if (!PARAM.rest && p.dice.some(h => h === 0)) {
    const c = p.schueren > 0 ? PARAM.schuerenExtraHolz : 0;
    if (R.holz >= c) out.push({ type: 'schueren' });
  }
  const free = (k) => { const o = s.places[PLACES.indexOf(k)]; return o.length < capFor(s.g.np) && !o.includes(s.pi); };
  const S = singles(p), D = pairs(p);
  const ofenMin = has(p, 'ofen3') ? PARAM.ofenMin - 1 : PARAM.ofenMin;
  if (free('sand')) for (const d of S) if (d.cost <= R.holz) out.push({ type: 'work', place: 'sand', d });
  if (free('asche')) for (const d of S) if (d.eff <= 3 && d.cost <= R.holz) out.push({ type: 'work', place: 'asche', d });
  if (free('wald')) for (const d of S) if (d.cost <= R.holz) out.push({ type: 'work', place: 'wald', d });
  if (free('ofen') && R.sand >= PARAM.batchSand && R.soda >= 1) for (const d of S) if (d.eff >= ofenMin && d.cost <= R.holz) out.push({ type: 'work', place: 'ofen', d });
  if (free('blas')) {
    if (R.masse >= 1) for (const d of S) if (d.cost <= R.holz) out.push({ type: 'work', place: 'blas', mode: 'S', d });
    if (R.masse >= 2) for (const d of D) if (d.cost + 1 <= R.holz) {
      if (d.e1 === d.e2) out.push({ type: 'work', place: 'blas', mode: 'P', d });
      else if (Math.abs(d.e1 - d.e2) === 1) out.push({ type: 'work', place: 'blas', mode: 'Z', d });
    }
  }
  if (free('kontor')) {
    for (const d of S) {
      if (d.eff < 2 || d.cost > R.holz) continue;
      if (p.pieces.length) {
        const max = Math.ceil(d.eff / 2) + (has(p, 'sell1') ? 1 : 0);
        for (const dir of [1, -1]) {
          const idx = p.pieces.map((_, i) => i).sort((a, b) => dir * (price(p.pieces[a].t) - price(p.pieces[b].t)) || p.pieces[a].q - p.pieces[b].q);
          for (let n = 1; n <= Math.min(max, idx.length); n++) out.push({ type: 'work', place: 'kontor', mode: 'sell', idx: idx.slice(0, n), d });
        }
      }
      s.orders.forEach((o, oi) => { const a = assign(p.pieces, o.need); if (a) out.push({ type: 'work', place: 'kontor', mode: 'deliver', oi, idx: a, d }); });
    }
  }
  if (free('gilde')) for (const d of S) {
    if (d.cost > R.holz) continue;
    s.market.forEach((id, mi) => { const c = CARD[id]; if (c.tier <= d.eff && R.duk >= c.cost) out.push({ type: 'work', place: 'gilde', mi, d }); });
  }
  return out;
}

function cool(p, dice) {
  for (const { i, eff } of dice) {
    if (has(p, 'nocool') && !p.noCoolUsed) { p.dice[i] = eff; p.noCoolUsed = true; }
    else p.dice[i] = Math.max(0, eff - PARAM.cool);
  }
}

function apply(s, a) {
  const p = s.p, R = p.res;
  if (a.type === 'pass') {
    p.passed = true;
    if (PARAM.rest) { for (let i = 0; i < p.dice.length; i++) if (p.dice[i] === 0) p.dice[i] = s.real ? roll(s.rnd) : 3.5; if (s.real && p.dice.some(h => h > 0)) p.st.schueren++; }
    return;
  }
  if (a.type === 'schueren') {
    if (p.schueren > 0) R.holz -= PARAM.schuerenExtraHolz;
    p.schueren++; p.st.schueren++;
    for (let i = 0; i < p.dice.length; i++) if (p.dice[i] === 0) p.dice[i] = s.real ? roll(s.rnd) : 3.5;
    return;
  }
  p.st.work++;
  const d = a.d;
  const dl = d.i !== undefined && d.j === undefined ? [{ i: d.i, eff: d.eff }] : [{ i: d.i, eff: d.e1 }, { i: d.j, eff: d.e2 }];
  const nb = d.j === undefined ? d.b : d.b1 + d.b2;
  const c = bcost(p, nb); R.holz -= c; if (nb > 0 && has(p, 'bfree') && !p.bfreeUsed) p.bfreeUsed = true;
  s.places[PLACES.indexOf(a.place)].push(s.pi);
  const e = d.eff;
  switch (a.place) {
    case 'sand': R.sand += SAND[e] + (has(p, 'sand1') ? 1 : 0); break;
    case 'asche': R.soda += 2 + (has(p, 'soda1') ? 1 : 0); break;
    case 'wald': R.holz += Math.ceil(e / 3) + (has(p, 'holz1') ? 1 : 0); break;
    case 'ofen': {
      const mn = has(p, 'ofen3') ? PARAM.ofenMin - 1 : PARAM.ofenMin;
      const n = Math.min(e - mn + 1, Math.floor(R.sand / PARAM.batchSand), R.soda);
      R.sand -= PARAM.batchSand * n; R.soda -= n; R.masse += n; p.signs.M += 1; break;
    }
    case 'blas': {
      const q = has(p, 'qual1') ? 1 : 0;
      if (a.mode === 'S') { R.masse -= 1; p.pieces.push({ t: 'S', q: e + q }); p.signs.B += 1; }
      else { R.masse -= 2; R.holz -= 1; p.pieces.push({ t: a.mode, q: d.e1 + d.e2 + q }); p.signs.B += 2; }
      p.st.built++; break;
    }
    case 'kontor': {
      if (a.mode === 'sell') {
        for (const i of a.idx) R.duk += price(p.pieces[i].t) + (has(p, 'kont1') ? 1 : 0);
        p.pieces = p.pieces.filter((_, i) => !a.idx.includes(i)); p.signs.H += 1; p.st.sold += a.idx.length;
      } else {
        const o = s.orders[a.oi];
        p.pieces = p.pieces.filter((_, i) => !a.idx.includes(i));
        { const rr = Math.round(o.ruhm * PARAM.orderMul); p.ruhm += rr; p.src.order += rr; } R.duk += o.duk; p.signs.H += 2; p.st.orders++;
        if (s.real) { const nx = s.g.orderDeck.shift(); if (nx) s.orders[a.oi] = nx; else s.orders.splice(a.oi, 1); }
        else s.orders.splice(a.oi, 1);
      }
      break;
    }
    case 'gilde': {
      const id = s.market[a.mi], cd = CARD[id];
      R.duk -= cd.cost; p.cards.push(id); p.signs[cd.guild] += 2;
      if (cd.fx === 'dice') p.dice.push(0);
      if (s.real) { const nx = s.g.cardDeck.shift(); if (nx) s.market[a.mi] = nx; else s.market.splice(a.mi, 1); }
      else s.market.splice(a.mi, 1);
      break;
    }
  }
  cool(p, dl);
}

// ---------- Bewertung ----------
function value(s, pr, roundsLeft) {
  const p = s.p, R = p.res, W = pr.w;
  const m = roundsLeft >= 3 ? 1 : roundsLeft === 2 ? 0.7 : 0.3;
  let v = p.ruhm;
  v += m * (W.sand * R.sand + W.soda * R.soda + W.holz * R.holz + W.masse * R.masse + W.heat * sum(p.dice));
  v += (roundsLeft >= 3 ? W.duk : 0.3 * W.duk + 0.7 * W.duk * (roundsLeft - 1) / 2) * R.duk;
  for (const pc of p.pieces) {
    const useful = s.orders.some(o => o.need.some(n => n.t === pc.t && pc.q >= n.q));
    v += Math.max(1, m * (W.piece[pc.t] + (useful ? W.orderBonus : 0)));
  }
  for (const g of 'BHM') v += W.sign[g] * p.signs[g];
  for (const id of p.cards) v += CARD[id].ruhm + m * W.cardFx;
  return v;
}


const cloneView = (s) => ({ ...s, real: false, p: clonePlayer(s.p), places: s.places.map(a => a.slice()), orders: s.orders.slice(), market: s.market.slice() });
// Beam-Suche über die nächsten eigenen Züge (Gegner bleiben fest). Bewertet jeden Pfad nach seinem besten Zwischenstand.
function chooseLook(g, pi, pl, s0, acts, left) {
  const v0 = value(s0, pl.prof, left);
  const first = [];
  for (const a of acts) {
    if (a.type === 'pass') continue;
    const sv = cloneView(s0); apply(sv, a);
    first.push({ a, sv, v: value(sv, pl.prof, left) });
  }
  first.sort((x, y) => y.v - x.v);
  let best = null, bv = 0;
  if (PARAM.rest) {
    const sv = cloneView(s0); apply(sv, { type: 'pass' });
    const dv = value(sv, pl.prof, left) - v0 + (g.rnd() - 0.5) * 2 * PARAM.noise;
    if (dv > bv) { bv = dv; best = { type: 'pass' }; }
  }
  for (const f of first.slice(0, PARAM.lookTop)) {
    let top = f.v, frontier = [f.sv];
    for (let d = 2; d <= PARAM.lookDepth; d++) {
      const kids = [];
      for (const st of frontier) for (const a of actions(st)) {
        if (a.type === 'pass') continue;
        const c = cloneView(st); apply(c, a);
        kids.push({ c, v: value(c, pl.prof, left) });
      }
      if (!kids.length) break;
      kids.sort((x, y) => y.v - x.v);
      top = Math.max(top, kids[0].v);
      frontier = kids.slice(0, PARAM.lookBeam).map(k => k.c);
    }
    const dv = top - v0 + (g.rnd() - 0.5) * 2 * PARAM.noise;
    if (dv > bv) { bv = dv; best = f.a; }
  }
  return best || acts[0];
}

function choose(g, pi) {
  const pl = g.players[pi], s0 = view(g, pi, true);
  const acts = actions(s0);
  if (pl.prof.random) {
    const nonPass = acts.filter(a => a.type !== 'pass');
    return nonPass.length && g.rnd() > 0.1 ? nonPass[Math.floor(g.rnd() * nonPass.length)] : acts[0];
  }
  const left = roundsFor(g.np) - g.round + 1;
  if (pl.prof.look) return chooseLook(g, pi, pl, s0, acts, left);
  const v0 = value(s0, pl.prof, left);
  let best = acts[0], bv = 0;
  for (const a of acts) {
    if (a.type === 'pass' && !PARAM.rest) continue;
    const sv = view(g, pi, false); apply(sv, a);
    const dv = value(sv, pl.prof, left) - v0 + (g.rnd() - 0.5) * 2 * PARAM.noise;
    if (dv > bv) { bv = dv; best = a; }
  }
  return best;
}

// ---------- Spielablauf ----------
function scoreGuilds(g) {
  for (const gu of 'BHM') {
    const vals = g.players.map(p => p.signs[gu]);
    const order = [...new Set(vals)].filter(v => v > 0).sort((a, b) => b - a);
    const first = order[0]; if (!first) continue;
    const win = g.players.filter(p => p.signs[gu] === first);
    const pts = [PARAM.guildFirst, PARAM.guildSecond];
    if (win.length > 1) {
      const share = Math.floor((pts[0] + (win.length >= 2 ? pts[1] : 0)) / win.length);
      for (const p of win) { p.ruhm += share; p.src.guild += share; }
    } else {
      win[0].ruhm += pts[0]; win[0].src.guild += pts[0];
      if (g.np > 2) {
        const sec = order[1];
        if (sec) { const w2 = g.players.filter(p => p.signs[gu] === sec); const sh = Math.floor(pts[1] / w2.length); for (const p of w2) { p.ruhm += sh; p.src.guild += sh; } }
      }
    }
  }
}

function playGame(profNames, seed) {
  const g = newGame(profNames, seed);
  for (let r = 1; r <= roundsFor(g.np); r++) {
    g.round = r; g.places = PLACES.map(() => []);
    for (const p of g.players) { p.passed = false; p.schueren = 0; p.noCoolUsed = false; p.bfreeUsed = false; }
    let cur = g.first, guard = 0, firstPass = -1;
    while (g.players.some(p => !p.passed) && guard++ < 300) {
      if (!g.players[cur].passed) {
        const a = choose(g, cur);
        apply(view(g, cur, true), a); g.players[cur].st.turns++; g.turns++;
        if (a.type === 'pass' && firstPass < 0) firstPass = cur;
      }
      cur = (cur + 1) % g.np;
    }
    if (guard >= 300) throw new Error('Runde hängt');
    if (scoreAt(g.np).includes(r)) scoreGuilds(g);
    g.first = PARAM.passFirst && firstPass >= 0 ? firstPass : (g.first + 1) % g.np;
  }
  for (const p of g.players) {
    const kar = sum(p.cards.map(id => CARD[id].ruhm)); p.ruhm += kar; p.src.card += kar;
    const left = p.pieces.length + Math.floor(p.res.duk / PARAM.dukPerRuhm); p.ruhm += left; p.src.left += left;
    // Invarianten
    for (const k in p.res) if (p.res[k] < 0) throw new Error('negativ ' + k);
    for (const h of p.dice) if (h < 0 || h > 6) throw new Error('Hitze ' + h);
  }
  return g;
}

// ---------- Auswertung ----------
function run(label, profNames, n, seed0 = 1) {
  const np = profNames.length;
  const agg = profNames.map(() => ({ wins: 0, ruhm: 0, ruhm2: 0, order: 0, guild: 0, card: 0, left: 0, orders: 0, work: 0, schueren: 0, built: 0, sold: 0 }));
  const bySeat = Array(np).fill(0);
  let turns = 0;
  const profAgg = {};
  for (let k = 0; k < n; k++) {
    // Sitzordnung rotieren, damit Profile fair verteilt sind
    const rot = k % np;
    const names = profNames.map((_, i) => profNames[(i + rot) % np]);
    const g = playGame(names, seed0 * 100003 + k);
    turns += g.turns;
    const top = Math.max(...g.players.map(p => p.ruhm));
    const tied = g.players.filter(p => p.ruhm === top);
    const w = tied.length > 1 ? tied.sort((a, b) => b.res.duk - a.res.duk)[0] : tied[0];
    bySeat[w.seat]++;
    g.players.forEach(p => {
      const key = p.name;
      const a = profAgg[key] || (profAgg[key] = { n: 0, wins: 0, ruhm: 0, ruhm2: 0, order: 0, guild: 0, card: 0, left: 0, orders: 0, work: 0, schueren: 0, built: 0, sold: 0 });
      a.n++; a.wins += p === w ? 1 : 0; a.ruhm += p.ruhm; a.ruhm2 += p.ruhm * p.ruhm;
      a.order += p.src.order; a.guild += p.src.guild; a.card += p.src.card; a.left += p.src.left;
      a.orders += p.st.orders; a.work += p.st.work; a.schueren += p.st.schueren; a.built += p.st.built; a.sold += p.st.sold;
    });
  }
  console.log(`\n== ${label}  (${np} Spieler, ${n} Partien, Züge/Partie ${(turns / n).toFixed(0)})`);
  console.log('Sieg nach Sitz:', bySeat.map(x => (100 * x / n).toFixed(0) + '%').join(' / '), ' (Sitz 0 = Startspieler in Runde 1)');
  console.log('Profil        Sieg%  Ruhm  ±    Aufträge Gilde Karten Rest | Aufträge/P Arbeit Schüren Gebaut Verkauft');
  for (const [k, a] of Object.entries(profAgg)) {
    const mean = a.ruhm / a.n, sd = Math.sqrt(a.ruhm2 / a.n - mean * mean), f = (x) => (x / a.n).toFixed(1).padStart(5);
    console.log(k.padEnd(13), (100 * a.wins / a.n).toFixed(0).padStart(4) + '%', mean.toFixed(1).padStart(5), sd.toFixed(1).padStart(4), f(a.order).padStart(9), f(a.guild), f(a.card), f(a.left), '|', f(a.orders).padStart(10), f(a.work).padStart(6), f(a.schueren).padStart(7), f(a.built).padStart(6), f(a.sold).padStart(8));
  }
  return profAgg;
}

// ---------- CLI ----------
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const n = +arg('n', 600);
const setS = arg('set', '');
for (const kv of setS.split(',').filter(Boolean)) { const [k, v] = kv.split('='); if (!(k in PARAM)) throw new Error('unbekannter Parameter ' + k); PARAM[k] = +v; }
if (setS) console.log('Parameter:', setS);

const ST = ['ausgewogen', 'blaeser', 'haendler', 'meister'];
if (argv.includes('--planer')) {
  run('Planer vs ausgewogen 2p', ['planer', 'ausgewogen'], n);
  run('Planer-Spiegel 2p', ['planer', 'planer'], n);
  run('Planer-Spiegel 4p', ['planer', 'planer', 'planer', 'planer'], n);
  run('Planer-Strategien 4p (Bläser/Händler/Meister/ausgewogen)', ['planer_bl', 'planer_ha', 'planer_me', 'planer'], n);
  run('Planer-Strategien 3p', ['planer_bl', 'planer_ha', 'planer_me'], n);
} else {
run('Spiegel 2p', ['ausgewogen', 'ausgewogen'], n);
run('Spiegel 3p', ['ausgewogen', 'ausgewogen', 'ausgewogen'], n);
run('Spiegel 4p', ['ausgewogen', 'ausgewogen', 'ausgewogen', 'ausgewogen'], n);
run('Strategien 4p (Bläser/Händler/Meister/ausgewogen)', ST, n);
run('Kontrolle: ausgewogen gegen Zufall 2p', ['ausgewogen', 'zufall'], n);
run('Kontrolle: ausgewogen gegen kurzsichtig 2p', ['ausgewogen', 'kurzsichtig'], n);
}
