// Test der Schach-Engine (schach/engine.mjs). Aufruf aus dem Repo-Root:  node test/schach-engine.mjs
// Mit PERFT_DEEP=1 laufen zusätzlich die tieferen Perft-Stufen (dauert länger).
import {
  START_FEN, parseFEN, toFEN, legalMoves, makeMove, perft, inCheck, isMate, isStalemate, insufficientMaterial,
  isDraw, positionKey, toSAN, fromSAN, moveKey, moveFromUCI, sqName, sqIndex, bestMove, evaluate, BOT_LEVELS,
} from '../schach/engine.mjs';

let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.error('FAIL:', msg); } };
const eq = (a, b, msg) => ok(a === b, `${msg} (erwartet ${b}, war ${a})`);
const P = fen => parseFEN(fen);
const deep = !!process.env.PERFT_DEEP;

// ---------- FEN ----------
eq(toFEN(P(START_FEN)), START_FEN, 'FEN-Rundlauf Grundstellung');
const odd = 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1';
eq(toFEN(P(odd)), odd, 'FEN-Rundlauf Kiwipete');
eq(sqName(sqIndex('e4')), 'e4', 'Feldnamen');
eq(sqIndex('a8'), 0, 'a8 = 0');
eq(sqIndex('h1'), 63, 'h1 = 63');
eq(toFEN(P('8/8/8/3p4/4P3/8/8/8 w')), '8/8/8/3p4/4P3/8/8/8 w - - 0 1', 'knappes FEN wird ergänzt');

// ---------- Perft (Standardwerte der Schach-Programmierung) ----------
const PERFT = [
  ['Grundstellung', START_FEN, [20, 400, 8902, 197281], 4865609],
  ['Kiwipete', odd, [48, 2039, 97862], 4085603],
  ['Stellung 3', '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', [14, 191, 2812, 43238], 674624],
  ['Stellung 4', 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1', [6, 264, 9467], 422333],
  ['Stellung 5', 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8', [44, 1486, 62379], 2103487],
  ['Stellung 6', 'r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10', [46, 2079, 89890], 3894594],
];
for (const [name, fen, counts, deepCount] of PERFT) {
  const pos = P(fen);
  counts.forEach((n, i) => eq(perft(pos, i + 1), n, `Perft ${name} Tiefe ${i + 1}`));
  if (deep) eq(perft(pos, counts.length + 1), deepCount, `Perft ${name} Tiefe ${counts.length + 1}`);
}

// ---------- Spezialregeln ----------
// en passant
{
  const pos = P('rnbqkbnr/ppp1pppp/8/8/3pP3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 3');
  const ep = legalMoves(pos).find(m => m.ep);
  ok(ep && moveKey(ep) === 'd4e3', 'en passant möglich: d4e3');
  const after = makeMove(pos, ep);
  eq(after.board[sqIndex('e4')], '.', 'en passant entfernt den Bauern');
  eq(after.board[sqIndex('e3')], 'p', 'schwarzer Bauer steht auf e3');
}
// Doppelschritt setzt das en-passant-Feld
{
  const pos = makeMove(P(START_FEN), moveFromUCI(P(START_FEN), 'e2e4'));
  eq(pos.ep, sqIndex('e3'), 'ep-Feld nach e2e4');
  eq(pos.turn, 'b', 'Zugrecht wechselt');
}
// Umwandlung: vier Möglichkeiten
{
  const pos = P('8/P7/8/8/8/8/8/k6K w - - 0 1');
  const promo = legalMoves(pos).filter(m => m.piece === 'P');
  eq(promo.length, 4, 'Umwandlung ergibt 4 Züge');
  const q = makeMove(pos, promo.find(m => m.promo === 'q'));
  eq(q.board[sqIndex('a8')], 'Q', 'Umwandlung zur Dame');
}
// Rochade
{
  const pos = P('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
  const castles = legalMoves(pos).filter(m => m.castle);
  eq(castles.length, 2, 'Weiß kann beide Seiten rochieren');
  const after = makeMove(pos, castles.find(m => m.castle === 'K'));
  eq(after.board[sqIndex('g1')], 'K', 'König nach g1');
  eq(after.board[sqIndex('f1')], 'R', 'Turm nach f1');
  eq(after.castling, 'kq', 'Weiß verliert die Rochaderechte');
  // nicht durch Schach hindurch
  const attacked = P('r3k2r/8/8/8/8/8/5r2/R3K2R w KQkq - 0 1');
  ok(!legalMoves(attacked).some(m => m.castle === 'K'), 'keine Rochade durch angegriffenes Feld f1');
  // nicht aus dem Schach
  const checked = P('4k3/8/8/8/8/8/4r3/R3K2R w KQ - 0 1');
  ok(!legalMoves(checked).some(m => m.castle), 'keine Rochade im Schach');
  // Rechte erlöschen, wenn der Turm zieht
  const moved = makeMove(pos, moveFromUCI(pos, 'h1h2'));
  ok(!moved.castling.includes('K') && moved.castling.includes('Q'), 'Turmzug nimmt nur die Rochade dieser Seite');
}
// gefesselte Figur darf nicht ziehen
{
  const pos = P('4k3/4r3/8/8/8/8/4N3/4K3 w - - 0 1');
  ok(!legalMoves(pos).some(m => m.piece === 'N'), 'gefesselter Springer hat keine Züge');
}

// ---------- Matt, Patt, Remis ----------
ok(isMate(P('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3')), 'Narrenmatt erkannt');
ok(!isMate(P(START_FEN)), 'Grundstellung ist nicht matt');
ok(isStalemate(P('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')), 'Patt erkannt');
ok(inCheck(P('4k3/8/8/8/8/8/4r3/4K3 w - - 0 1')), 'Schach erkannt');
ok(insufficientMaterial(P('8/8/8/4k3/8/8/8/4K3 w - - 0 1')), 'K gegen K');
ok(insufficientMaterial(P('8/8/8/4k3/8/8/2N5/4K3 w - - 0 1')), 'K+S gegen K');
ok(insufficientMaterial(P('8/8/4b3/4k3/8/8/2B5/4K3 w - - 0 1')), 'Läufer auf gleicher Farbe');
ok(!insufficientMaterial(P('8/8/8/4k3/8/8/2B5/2B1K3 w - - 0 1')), 'zwei Läufer auf verschiedenen Farben reichen');
ok(!insufficientMaterial(P('8/8/8/4k3/8/8/2P5/4K3 w - - 0 1')), 'ein Bauer reicht');
ok(isDraw(P('8/8/8/4k3/8/8/8/4K3 w - - 0 1')), 'Remis durch zu wenig Material');
ok(isDraw(P('4k3/8/8/8/8/8/8/R3K3 w - - 100 80')), 'Remis nach 50 Zügen');
{
  let pos = P(START_FEN);
  const hist = [positionKey(pos)];
  for (let i = 0; i < 2; i++) {
    for (const u of ['g1f3', 'g8f6', 'f3g1', 'f6g8']) { pos = makeMove(pos, moveFromUCI(pos, u)); hist.push(positionKey(pos)); }
  }
  ok(isDraw(pos, hist), 'dreifache Wiederholung');
  ok(!isDraw(pos, hist.slice(0, 5)), 'nach nur zwei Wiederholungen noch kein Remis');
}

// ---------- Sandbox (Figuren ohne König) ----------
eq(legalMoves(P('8/8/8/3N4/8/8/8/8 w - - 0 1')).length, 8, 'einsamer Springer: 8 Züge');
eq(legalMoves(P('8/8/8/3R4/8/8/8/8 w - - 0 1')).length, 14, 'einsamer Turm: 14 Züge');
eq(legalMoves(P('8/8/8/3B4/8/8/8/8 w - - 0 1')).length, 13, 'einsamer Läufer: 13 Züge');
eq(legalMoves(P('8/8/8/3Q4/8/8/8/8 w - - 0 1')).length, 27, 'einsame Dame: 27 Züge');
eq(legalMoves(P('8/8/8/8/8/8/4P3/8 w - - 0 1')).length, 2, 'Bauer auf e2: Schritt und Doppelschritt');
eq(legalMoves(P('8/8/8/8/8/4p3/4P3/8 w - - 0 1')).length, 0, 'blockierter Bauer');
eq(legalMoves(P('8/8/8/8/4p3/3pPp2/4p3/8 w - - 0 1')).filter(m => m.cap).length, 0, 'Bauer schlägt nicht geradeaus oder rückwärts');
eq(legalMoves(P('8/8/8/8/8/3p1p2/4P3/8 w - - 0 1')).filter(m => m.cap).length, 2, 'Bauer schlägt schräg');
ok(!inCheck(P('8/8/8/3N4/8/8/8/8 w - - 0 1')), 'ohne König kein Schach');
ok(!isMate(P('8/8/8/3N4/8/8/8/8 w - - 0 1')), 'ohne König kein Matt');

// ---------- Notation (SAN, deutsch und englisch) ----------
{
  const pos = P(START_FEN);
  eq(toSAN(pos, moveFromUCI(pos, 'e2e4')), 'e4', 'SAN e4');
  eq(toSAN(pos, moveFromUCI(pos, 'g1f3')), 'Nf3', 'SAN Nf3');
  eq(toSAN(pos, moveFromUCI(pos, 'g1f3'), { lang: 'de' }), 'Sf3', 'SAN Sf3 (deutsch)');
  eq(moveKey(fromSAN(pos, 'Sf3')), 'g1f3', 'fromSAN deutsch');
  eq(moveKey(fromSAN(pos, 'Nf3')), 'g1f3', 'fromSAN englisch');
  eq(moveKey(fromSAN(pos, 'e2e4')), 'e2e4', 'fromSAN akzeptiert UCI');
  eq(fromSAN(pos, 'Ke5'), null, 'ungültiger Zug gibt null');
  const mate = P('rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq g3 0 2');
  eq(toSAN(mate, moveFromUCI(mate, 'd8h4')), 'Qh4#', 'Matt-Zeichen');
  const cas = P('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
  eq(toSAN(cas, moveFromUCI(cas, 'e1g1')), 'O-O', 'kurze Rochade');
  eq(toSAN(cas, moveFromUCI(cas, 'e1c1')), 'O-O-O', 'lange Rochade');
  const dis = P('4k3/8/8/8/8/8/K7/R6R w - - 0 1');
  eq(toSAN(dis, moveFromUCI(dis, 'a1d1')), 'Rad1', 'Eindeutigkeit über die Linie');
  const pr = P('8/P7/8/8/8/8/8/k6K w - - 0 1');
  eq(toSAN(pr, moveFromUCI(pr, 'a7a8q'), { lang: 'de' }), 'a8=D+', 'Umwandlung deutsch mit Schach');
}
// Rundlauf: für jeden Zug in mehreren Stellungen muss fromSAN(toSAN(zug)) wieder den Zug liefern
for (const fen of [START_FEN, odd, '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1']) {
  const pos = P(fen);
  for (const mv of legalMoves(pos)) {
    for (const lang of ['en', 'de']) {
      const back = fromSAN(pos, toSAN(pos, mv, { lang }));
      ok(back && moveKey(back) === moveKey(mv), `SAN-Rundlauf ${fen.slice(0, 18)}… ${moveKey(mv)} (${lang})`);
    }
  }
}

// ---------- Bewertung ----------
ok(Math.abs(evaluate(P(START_FEN))) < 50, 'Grundstellung etwa ausgeglichen');
ok(evaluate(P('4k3/8/8/8/8/8/8/Q3K3 w - - 0 1')) > 800, 'Dame mehr ist deutlich besser');
ok(evaluate(P('4k3/8/8/8/8/8/8/Q3K3 b - - 0 1')) < -800, 'Bewertung aus Sicht der ziehenden Seite');

// ---------- Bot ----------
const rngFixed = () => 0.37;
{
  // Matt in einem Zug: alle Stufen müssen es finden
  const m1 = P('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1');
  for (const level of [1, 2, 3]) eq(moveKey(bestMove(m1, { level, rng: rngFixed })), 'a1a8', `Stufe ${level} findet Matt in 1`);
  // geschenkte Dame: alle Stufen nehmen sie
  const free = P('4k3/8/8/3q4/8/8/3R4/4K3 w - - 0 1');
  for (const level of [1, 2, 3]) eq(moveKey(bestMove(free, { level, rng: rngFixed })), 'd2d5', `Stufe ${level} nimmt die freie Dame`);
  // eigene Dame nicht einstellen: Weiß kann die Dame schlagen oder nicht – Stufe 3 darf nicht verlieren
  const trap = P('4k3/8/8/8/3p4/4n3/8/3QK3 w - - 0 1');
  const mv = bestMove(trap, { level: 3, rng: rngFixed });
  const after = makeMove(trap, mv);
  const loss = legalMoves(after).some(r => r.cap === 'Q');
  ok(!loss, 'Stufe 3 stellt die Dame nicht ein');
  eq(bestMove(P('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'), { level: 3 }), null, 'kein Zug im Patt');
  // Verlauf: Stufe 3 gewinnt gegen Stufe 1 meistens Material (feste Zufallsfolge)
  let seed = 1; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let pos = P(START_FEN), t0 = Date.now(), plies = 0;
  while (plies < 40 && legalMoves(pos).length) {
    const lvl = pos.turn === 'w' ? 3 : 1;
    pos = makeMove(pos, bestMove(pos, { level: lvl, rng })); plies++;
  }
  const mat = evaluate(P(toFEN({ ...pos, turn: 'w' })));
  ok(mat > 0, `Stufe 3 (Weiß) steht nach 40 Halbzügen besser als Stufe 1 (${mat})`);
  ok(Date.now() - t0 < 60000, `Partie-Test läuft in unter 60 s (${Date.now() - t0} ms)`);
}
// Stufen müssen existieren
ok(BOT_LEVELS[1] && BOT_LEVELS[2] && BOT_LEVELS[3], 'drei Stufen definiert');
{
  // Tempo: ein Zug der Stufe 3 aus der Grundstellung
  const t0 = Date.now();
  bestMove(P(START_FEN), { level: 3, rng: rngFixed });
  const ms = Date.now() - t0;
  ok(ms < 8000, `Stufe 3 antwortet aus der Grundstellung in unter 8 s (${ms} ms)`);
  console.log(`Info: Stufe 3 aus der Grundstellung: ${ms} ms`);
}

if (fails) { console.error(`\n${fails} von ${checks} Prüfungen fehlgeschlagen.`); process.exit(1); }
console.log(`OK – ${checks} Prüfungen bestanden${deep ? ' (inkl. tiefer Perft)' : ''}.`);
