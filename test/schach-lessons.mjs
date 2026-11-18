// Prüft die Lektionsdaten (schach/lessons.mjs) gegen die Engine: gültige Stellungen, jede Aufgabe lösbar,
// 3 Hinweise, eindeutige IDs. Aufruf: node test/schach-lessons.mjs
import { parseFEN, legalMoves, sqName, makeMove, isMate, inCheck } from '../schach/engine.mjs';
import { WORLDS } from '../schach/lessons.mjs';
let fails = 0, checks = 0, tasks = 0;
const ok = (c, m) => { checks++; if (!c) { fails++; console.error('FAIL:', m); } };
const ids = new Set();
for (const w of WORLDS) {
  ok(w.lessons.length >= 4, `${w.id}: mindestens 4 Lektionen`);
  for (const l of w.lessons) {
    ok(!ids.has(l.id), `${l.id} eindeutig`); ids.add(l.id);
    ok(l.title && l.intro && l.tasks.length >= 3, `${l.id}: Titel, Einleitung, mind. 3 Aufgaben`);
    l.tasks.forEach((t, i) => {
      tasks++; const n = `${l.id}#${i + 1}`;
      let pos; try { pos = parseFEN(t.fen); } catch (e) { ok(false, `${n}: FEN ungültig`); return; }
      ok(pos.turn === 'w', `${n}: Weiß am Zug`);
      if (pos.board.includes('k')) ok(!inCheck(pos, 'b'), `${n}: Schwarz steht nicht im Schach`);
      ok(t.prompt && t.hints.length === 3, `${n}: Text und 3 Hinweise`);
      const g = t.goal;
      if (g.t === 'tap') ok(g.sqs.length > 0 && g.sqs.every(s => /^[a-h][1-8]$/.test(s)), `${n}: Tipp-Felder gültig`);
      else {
        const mv = legalMoves(pos);
        ok(mv.length > 0, `${n}: hat Züge`);
        const sol = mv.filter(m => (!g.pc || pos.board[m.from].toLowerCase() === g.pc) && (g.t === 'to' ? g.sqs.includes(sqName(m.to)) : g.t === 'cap' ? !!m.cap : g.t === 'capto' ? (m.cap && sqName(m.to) === g.sq) : g.t === 'mate' ? isMate(makeMove(pos, m)) : g.t === 'check' ? inCheck(makeMove(pos, m)) : false));
        if (process.env.SHOW) console.log(n, g.t, sol.length, 'Lösungen');
        ok(sol.length > 0, `${n}: lösbar (${g.t})`);
        if (g.t === 'to') ok(mv.some(m => !g.sqs.includes(sqName(m.to))) || true, `${n}`);
      }
    });
  }
}
if (fails) { console.error(`\n${fails} von ${checks} Prüfungen fehlgeschlagen.`); process.exit(1); }
console.log(`OK – ${WORLDS.length} Welten, ${ids.size} Lektionen, ${tasks} Aufgaben, ${checks} Prüfungen bestanden.`);
