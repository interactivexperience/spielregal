// Spiegelschach – Regel-Engine (DOM-frei, läuft im Browser und in Node)
//
// Brett: Array mit 64 Zeichen in FEN-Reihenfolge (0 = a8 … 63 = h1), '.' = leer,
// Großbuchstaben = Weiß (P N B R Q K), Kleinbuchstaben = Schwarz.
// Stellung: { board, turn:'w'|'b', castling:'KQkq'-Teilmenge, ep:Feldindex|-1, half, full }
//
// Sandbox-Stellungen (z. B. Figuren ohne König für die Lektionen) sind erlaubt:
// Ohne König der ziehenden Seite gibt es kein Schach und keine Königspflicht.

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const FILES = 'abcdefgh';
export const sqName = i => FILES[i & 7] + (8 - (i >> 3));
export const sqIndex = n => (8 - Number(n[1])) * 8 + FILES.indexOf(n[0]);
const isWhite = ch => ch >= 'A' && ch <= 'Z';
const colorOf = ch => (ch === '.' ? null : isWhite(ch) ? 'w' : 'b');
const other = c => (c === 'w' ? 'b' : 'w');

// ---------- FEN ----------
export function parseFEN(fen) {
  const [placement, turn = 'w', castling = '-', ep = '-', half = '0', full = '1'] = fen.trim().split(/\s+/);
  const board = [];
  for (const row of placement.split('/')) {
    for (const ch of row) {
      if (ch >= '1' && ch <= '8') for (let k = 0; k < Number(ch); k++) board.push('.');
      else board.push(ch);
    }
  }
  if (board.length !== 64) throw new Error('Ungültiges FEN (Brett): ' + fen);
  return {
    board, turn: turn === 'b' ? 'b' : 'w',
    castling: castling === '-' ? '' : castling,
    ep: ep === '-' ? -1 : sqIndex(ep),
    half: Number(half) || 0, full: Number(full) || 1,
  };
}

export function toFEN(pos) {
  const rows = [];
  for (let r = 0; r < 8; r++) {
    let s = '', empty = 0;
    for (let f = 0; f < 8; f++) {
      const ch = pos.board[r * 8 + f];
      if (ch === '.') empty++;
      else { if (empty) { s += empty; empty = 0; } s += ch; }
    }
    if (empty) s += empty;
    rows.push(s);
  }
  return `${rows.join('/')} ${pos.turn} ${pos.castling || '-'} ${pos.ep >= 0 ? sqName(pos.ep) : '-'} ${pos.half} ${pos.full}`;
}

// ---------- Angriffe ----------
const KNIGHT = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const KING = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const BISHOP_DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const ROOK_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Wird Feld sq von einer Figur der Farbe `by` angegriffen?
export function isAttacked(board, sq, by) {
  const f = sq & 7, r = sq >> 3;
  const up = by === 'w' ? 1 : -1; // Weiße Bauern stehen "unterhalb" (höherer Reihenindex) des angegriffenen Felds
  const pawn = by === 'w' ? 'P' : 'p';
  for (const df of [-1, 1]) {
    const ff = f + df, rr = r + up;
    if (ff >= 0 && ff < 8 && rr >= 0 && rr < 8 && board[rr * 8 + ff] === pawn) return true;
  }
  const knight = by === 'w' ? 'N' : 'n', king = by === 'w' ? 'K' : 'k';
  for (const [df, dr] of KNIGHT) {
    const ff = f + df, rr = r + dr;
    if (ff >= 0 && ff < 8 && rr >= 0 && rr < 8 && board[rr * 8 + ff] === knight) return true;
  }
  for (const [df, dr] of KING) {
    const ff = f + df, rr = r + dr;
    if (ff >= 0 && ff < 8 && rr >= 0 && rr < 8 && board[rr * 8 + ff] === king) return true;
  }
  const bq = by === 'w' ? 'BQ' : 'bq', rq = by === 'w' ? 'RQ' : 'rq';
  for (const [df, dr] of BISHOP_DIRS) {
    let ff = f + df, rr = r + dr;
    while (ff >= 0 && ff < 8 && rr >= 0 && rr < 8) {
      const ch = board[rr * 8 + ff];
      if (ch !== '.') { if (bq.includes(ch)) return true; break; }
      ff += df; rr += dr;
    }
  }
  for (const [df, dr] of ROOK_DIRS) {
    let ff = f + df, rr = r + dr;
    while (ff >= 0 && ff < 8 && rr >= 0 && rr < 8) {
      const ch = board[rr * 8 + ff];
      if (ch !== '.') { if (rq.includes(ch)) return true; break; }
      ff += df; rr += dr;
    }
  }
  return false;
}

export function kingSquare(board, color) {
  return board.indexOf(color === 'w' ? 'K' : 'k');
}

export function inCheck(pos, color = pos.turn) {
  const k = kingSquare(pos.board, color);
  return k >= 0 && isAttacked(pos.board, k, other(color));
}

// ---------- Zuggenerierung ----------
// Zug: { from, to, piece, cap?, promo?, ep?, castle?:'K'|'Q', dbl? }
function pseudoMoves(pos) {
  const { board, turn } = pos;
  const white = turn === 'w';
  const moves = [];
  const mine = ch => ch !== '.' && isWhite(ch) === white;
  const theirs = ch => ch !== '.' && isWhite(ch) !== white;
  for (let from = 0; from < 64; from++) {
    const piece = board[from];
    if (!mine(piece)) continue;
    const f = from & 7, r = from >> 3, t = piece.toLowerCase();
    if (t === 'p') {
      const dir = white ? -1 : 1, startR = white ? 6 : 1, promoR = white ? 0 : 7;
      const r1 = r + dir;
      if (r1 < 0 || r1 > 7) continue;
      const push = (to, extra) => {
        if (to >> 3 === promoR) for (const p of ['q', 'r', 'b', 'n']) moves.push({ from, to, piece, promo: p, ...extra });
        else moves.push({ from, to, piece, ...extra });
      };
      if (board[r1 * 8 + f] === '.') {
        push(r1 * 8 + f, {});
        if (r === startR && board[(r + 2 * dir) * 8 + f] === '.') moves.push({ from, to: (r + 2 * dir) * 8 + f, piece, dbl: true });
      }
      for (const df of [-1, 1]) {
        const ff = f + df;
        if (ff < 0 || ff > 7) continue;
        const to = r1 * 8 + ff, target = board[to];
        if (theirs(target)) push(to, { cap: target });
        else if (to === pos.ep && target === '.') moves.push({ from, to, piece, cap: white ? 'p' : 'P', ep: true });
      }
    } else if (t === 'n' || t === 'k') {
      for (const [df, dr] of (t === 'n' ? KNIGHT : KING)) {
        const ff = f + df, rr = r + dr;
        if (ff < 0 || ff > 7 || rr < 0 || rr > 7) continue;
        const to = rr * 8 + ff, target = board[to];
        if (target === '.') moves.push({ from, to, piece });
        else if (theirs(target)) moves.push({ from, to, piece, cap: target });
      }
    } else {
      const dirs = t === 'b' ? BISHOP_DIRS : t === 'r' ? ROOK_DIRS : BISHOP_DIRS.concat(ROOK_DIRS);
      for (const [df, dr] of dirs) {
        let ff = f + df, rr = r + dr;
        while (ff >= 0 && ff < 8 && rr >= 0 && rr < 8) {
          const to = rr * 8 + ff, target = board[to];
          if (target === '.') moves.push({ from, to, piece });
          else { if (theirs(target)) moves.push({ from, to, piece, cap: target }); break; }
          ff += df; rr += dr;
        }
      }
    }
  }
  // Rochade
  const home = white ? 60 : 4;
  const king = white ? 'K' : 'k', rook = white ? 'R' : 'r', foe = other(turn);
  if (board[home] === king && pos.castling) {
    const ks = white ? 'K' : 'k', qs = white ? 'Q' : 'q';
    if (pos.castling.includes(ks) && board[home + 3] === rook && board[home + 1] === '.' && board[home + 2] === '.' &&
        !isAttacked(board, home, foe) && !isAttacked(board, home + 1, foe) && !isAttacked(board, home + 2, foe))
      moves.push({ from: home, to: home + 2, piece: king, castle: 'K' });
    if (pos.castling.includes(qs) && board[home - 4] === rook && board[home - 1] === '.' && board[home - 2] === '.' && board[home - 3] === '.' &&
        !isAttacked(board, home, foe) && !isAttacked(board, home - 1, foe) && !isAttacked(board, home - 2, foe))
      moves.push({ from: home, to: home - 2, piece: king, castle: 'Q' });
  }
  return moves;
}

export function makeMove(pos, mv) {
  const board = pos.board.slice();
  const white = pos.turn === 'w';
  let castling = pos.castling;
  const piece = board[mv.from];
  board[mv.from] = '.';
  if (mv.ep) board[mv.to + (white ? 8 : -8)] = '.';
  board[mv.to] = mv.promo ? (white ? mv.promo.toUpperCase() : mv.promo) : piece;
  if (mv.castle === 'K') { board[mv.from + 3] = '.'; board[mv.from + 1] = white ? 'R' : 'r'; }
  if (mv.castle === 'Q') { board[mv.from - 4] = '.'; board[mv.from - 1] = white ? 'R' : 'r'; }
  if (castling) {
    const strip = chars => { for (const c of chars) castling = castling.replace(c, ''); };
    if (piece === 'K') strip('KQ');
    if (piece === 'k') strip('kq');
    for (const [sq, c] of [[63, 'K'], [56, 'Q'], [7, 'k'], [0, 'q']]) if (mv.from === sq || mv.to === sq) strip(c);
  }
  const reset = piece.toLowerCase() === 'p' || !!mv.cap;
  return {
    board, turn: white ? 'b' : 'w', castling,
    ep: mv.dbl ? (mv.from + mv.to) / 2 : -1,
    half: reset ? 0 : pos.half + 1,
    full: pos.full + (white ? 0 : 1),
  };
}

export function legalMoves(pos) {
  const kingExists = kingSquare(pos.board, pos.turn) >= 0;
  const all = pseudoMoves(pos);
  if (!kingExists) return all;
  const out = [];
  for (const mv of all) {
    const next = makeMove(pos, mv);
    if (!inCheck(next, pos.turn)) out.push(mv);
  }
  return out;
}

// ---------- Spielende ----------
export function isMate(pos) { return kingSquare(pos.board, pos.turn) >= 0 && inCheck(pos) && legalMoves(pos).length === 0; }
export function isStalemate(pos) { return kingSquare(pos.board, pos.turn) >= 0 && !inCheck(pos) && legalMoves(pos).length === 0; }

export function insufficientMaterial(pos) {
  const rest = [];
  pos.board.forEach((ch, i) => { if (ch !== '.' && ch.toLowerCase() !== 'k') rest.push([ch.toLowerCase(), i]); });
  if (rest.length === 0) return true;
  if (rest.length === 1 && (rest[0][0] === 'b' || rest[0][0] === 'n')) return true;
  if (rest.every(([t]) => t === 'b')) {
    const shade = rest.map(([, i]) => ((i >> 3) + (i & 7)) & 1);
    return shade.every(s => s === shade[0]);
  }
  return false;
}

// Schlüssel einer Stellung für die Dreifach-Wiederholung (en passant nur, wenn schlagbar)
export function positionKey(pos) {
  let ep = '-';
  if (pos.ep >= 0) {
    const f = pos.ep & 7, r = pos.ep >> 3, pawn = pos.turn === 'w' ? 'P' : 'p', pr = pos.turn === 'w' ? r + 1 : r - 1;
    if ((f > 0 && pos.board[pr * 8 + f - 1] === pawn) || (f < 7 && pos.board[pr * 8 + f + 1] === pawn)) ep = String(pos.ep);
  }
  return pos.board.join('') + pos.turn + (pos.castling || '-') + ep;
}

// history: Liste bisheriger positionKey-Werte (inkl. aktueller Stellung)
export function isDraw(pos, history = []) {
  if (pos.half >= 100) return true;
  if (insufficientMaterial(pos)) return true;
  const key = positionKey(pos);
  if (history.filter(k => k === key).length >= 3) return true;
  return isStalemate(pos);
}

// ---------- Notation ----------
const LETTERS = { en: { N: 'N', B: 'B', R: 'R', Q: 'Q', K: 'K' }, de: { N: 'S', B: 'L', R: 'T', Q: 'D', K: 'K' } };

export function toSAN(pos, mv, opts = {}) {
  const lang = opts.lang === 'de' ? 'de' : 'en', L = LETTERS[lang];
  let s;
  if (mv.castle) s = mv.castle === 'K' ? 'O-O' : 'O-O-O';
  else {
    const t = mv.piece.toUpperCase();
    if (t === 'P') {
      s = (mv.cap ? FILES[mv.from & 7] + 'x' : '') + sqName(mv.to);
      if (mv.promo) s += '=' + L[mv.promo.toUpperCase()];
    } else {
      const same = legalMoves(pos).filter(m => m.piece === mv.piece && m.to === mv.to && m.from !== mv.from);
      let dis = '';
      if (same.length) {
        const fileUnique = same.every(m => (m.from & 7) !== (mv.from & 7));
        const rankUnique = same.every(m => (m.from >> 3) !== (mv.from >> 3));
        dis = fileUnique ? FILES[mv.from & 7] : rankUnique ? String(8 - (mv.from >> 3)) : sqName(mv.from);
      }
      s = L[t] + dis + (mv.cap ? 'x' : '') + sqName(mv.to);
    }
  }
  const next = makeMove(pos, mv);
  if (inCheck(next)) s += legalMoves(next).length === 0 ? '#' : '+';
  return s;
}

const GERMAN_TO_EN = { S: 'N', L: 'B', T: 'R', D: 'Q' };
function normalizeSAN(san) {
  let s = san.replace(/[+#!?]/g, '').replace(/0/g, 'O').replace(/\s+/g, '').replace('=', '');
  if (/^[SLTD]/.test(s)) s = GERMAN_TO_EN[s[0]] + s.slice(1);
  s = s.replace(/([a-h][18])([SLTDNBRQ])$/, (m, sq, p) => sq + (GERMAN_TO_EN[p] || p));
  return s;
}

export function fromSAN(pos, san) {
  const target = normalizeSAN(san);
  const moves = legalMoves(pos);
  for (const mv of moves) if (normalizeSAN(toSAN(pos, mv, { lang: 'en' })) === target) return mv;
  return moveFromUCI(pos, san.trim());
}

export const moveKey = mv => sqName(mv.from) + sqName(mv.to) + (mv.promo || '');
export function moveFromUCI(pos, uci) {
  return legalMoves(pos).find(m => moveKey(m) === uci.toLowerCase()) || null;
}

// ---------- perft ----------
export function perft(pos, depth) {
  if (depth === 0) return 1;
  const moves = legalMoves(pos);
  if (depth === 1) return moves.length;
  let n = 0;
  for (const mv of moves) n += perft(makeMove(pos, mv), depth - 1);
  return n;
}

// ---------- Bewertung und Bot ----------
const VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
// Positionstabellen aus Sicht von Weiß (Index 0 = a8)
const PST = {
  p: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5,
      0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  n: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30,
      -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
  b: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10,
      -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
  r: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
  q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5,
      0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
  k: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30,
      -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
};

// Bewertung in Hundertstel-Bauern aus Sicht der ziehenden Seite
export function evaluate(pos) {
  let score = 0;
  for (let i = 0; i < 64; i++) {
    const ch = pos.board[i];
    if (ch === '.') continue;
    const t = ch.toLowerCase();
    if (isWhite(ch)) score += VALUE[t] + PST[t][i];
    else score -= VALUE[t] + PST[t][(7 - (i >> 3)) * 8 + (i & 7)];
  }
  return pos.turn === 'w' ? score : -score;
}

const MATE = 30000;
function orderMoves(moves) {
  const val = mv => (mv.cap ? 10 * VALUE[mv.cap.toLowerCase()] - VALUE[mv.piece.toLowerCase()] : 0) + (mv.promo ? 800 : 0);
  return moves.sort((a, b) => val(b) - val(a));
}

function quiesce(pos, alpha, beta, depth) {
  const stand = evaluate(pos);
  if (depth <= 0) return stand;
  if (stand >= beta) return stand;
  if (stand > alpha) alpha = stand;
  for (const mv of orderMoves(legalMoves(pos).filter(m => m.cap || m.promo))) {
    const score = -quiesce(makeMove(pos, mv), -beta, -alpha, depth - 1);
    if (score >= beta) return score;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function search(pos, depth, alpha, beta, ply, qs) {
  if (depth === 0) return qs ? quiesce(pos, alpha, beta, 4) : evaluate(pos);
  const moves = legalMoves(pos);
  if (moves.length === 0) {
    if (kingSquare(pos.board, pos.turn) < 0) return 0;
    return inCheck(pos) ? -MATE + ply : 0;
  }
  let best = -Infinity;
  for (const mv of orderMoves(moves)) {
    const score = -search(makeMove(pos, mv), depth - 1, -beta, -alpha, ply + 1, qs);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

// Stärkestufen für Mini-Duelle und Bosse
export const BOT_LEVELS = {
  1: { depth: 1, qs: false, margin: 130 }, // patzt oft, nimmt aber geschenkte Figuren
  2: { depth: 2, qs: true, margin: 40 },
  3: { depth: 3, qs: true, margin: 0 },
};

// Liefert den gewählten Zug oder null. rng liefert Zahlen in [0,1) (für Tests ersetzbar).
export function bestMove(pos, { level = 2, depth, qs, margin, rng = Math.random } = {}) {
  const cfg = { ...(BOT_LEVELS[level] || BOT_LEVELS[2]) };
  if (depth != null) cfg.depth = depth;
  if (qs != null) cfg.qs = qs;
  if (margin != null) cfg.margin = margin;
  const moves = legalMoves(pos);
  if (moves.length === 0) return null;
  const scored = orderMoves(moves).map(mv => ({ mv, score: -search(makeMove(pos, mv), cfg.depth - 1, -Infinity, Infinity, 1, cfg.qs) }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0].score;
  const pool = scored.filter(s => s.score >= top - cfg.margin);
  return pool[Math.floor(rng() * pool.length)].mv;
}
