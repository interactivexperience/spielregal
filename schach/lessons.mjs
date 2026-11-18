// Spiegelschach – Lektionen (Daten). Läuft im Browser (eingebettet) und in Node (Test: test/schach-lessons.mjs).
// Alle Stellungen: Weiß am Zug, oft ohne König (Sandbox der Engine). goal:
//   { t:'tap', sqs:[…] }   ein Feld antippen   · { t:'to', sqs:[…] } mit einer Figur auf eines dieser Felder ziehen
//   { t:'cap' }            irgendetwas schlagen · { t:'capto', sq:'d8' } genau dieses Feld schlagen
const FILES = 'abcdefgh';
export const file = c => [1, 2, 3, 4, 5, 6, 7, 8].map(r => c + r);
export const rank = r => FILES.split('').map(c => c + r);
const EMPTY = '8/8/8/8/8/8/8/8 w - - 0 1';
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const t = (fen, prompt, goal, hints) => ({ fen, prompt, goal, hints });

export const WORLDS = [
  {
    id: 'w1', name: 'Hinter dem Spiegel', coach: 'rabbit',
    lessons: [
      { id: 'w1-l1', title: 'Das Brett', coach: 'rabbit', intro: 'Oh je, ich bin spät dran! Hinter dem Spiegel ist alles ein Brett. Jedes Feld hat einen Namen aus Buchstabe und Zahl, zum Beispiel e4.', tasks: [
        t(EMPTY, 'Tippe das Feld e4.', { t: 'tap', sqs: ['e4'] }, ['Der Buchstabe steht unten am Brett: e ist die fünfte Spalte.', 'Die Zahl steht links: 4 ist die vierte Reihe von unten.', 'Gesucht: fünfte Spalte, vierte Reihe.']),
        t(EMPTY, 'Tippe das Feld a1.', { t: 'tap', sqs: ['a1'] }, ['a ist ganz links, 1 ist ganz unten.', 'Es ist die Ecke unten links.', 'Gesucht: die Ecke unten links.']),
        t(EMPTY, 'Tippe das Feld h8.', { t: 'tap', sqs: ['h8'] }, ['h ist ganz rechts, 8 ist ganz oben.', 'Es ist die Ecke oben rechts.', 'Gesucht: die Ecke oben rechts.']),
        t(EMPTY, 'Tippe das Feld d5.', { t: 'tap', sqs: ['d5'] }, ['d ist die vierte Spalte von links.', '5 ist die fünfte Reihe von unten.', 'Gesucht: vierte Spalte, fünfte Reihe.']),
      ] },
      { id: 'w1-l2', title: 'Reihen und Linien', coach: 'rabbit', intro: 'Waagerecht heißen die Felder Reihen (1 bis 8), senkrecht Linien (a bis h). Alles auf einer Linie gehört zusammen.', tasks: [
        t(EMPTY, 'Tippe irgendein Feld auf der Linie e.', { t: 'tap', sqs: file('e') }, ['Eine Linie läuft von unten nach oben.', 'Alle Felder der Linie e beginnen mit e.', 'Zum Beispiel e1, e2 oder e5.']),
        t(EMPTY, 'Tippe irgendein Feld in der Reihe 3.', { t: 'tap', sqs: rank(3) }, ['Eine Reihe läuft von links nach rechts.', 'Alle Felder der Reihe 3 enden auf 3.', 'Zum Beispiel a3, d3 oder h3.']),
        t(EMPTY, 'Tippe irgendein Feld auf der Linie b.', { t: 'tap', sqs: file('b') }, ['b ist die zweite Spalte von links.', 'Alle Felder beginnen mit b.', 'Zum Beispiel b2 oder b7.']),
        t(EMPTY, 'Tippe irgendein Feld in der Reihe 7.', { t: 'tap', sqs: rank(7) }, ['Reihe 7 ist die zweite von oben.', 'Alle Felder enden auf 7.', 'Zum Beispiel c7 oder g7.']),
      ] },
      { id: 'w1-l3', title: 'Die Aufstellung', coach: 'rabbit', intro: 'So steht das Heer am Anfang: vorn die Bauern, dahinter die Offiziere. Weiß steht unten, Schwarz oben.', tasks: [
        t(START, 'Tippe den weißen König.', { t: 'tap', sqs: ['e1'] }, ['Der König trägt ein Kreuz auf der Krone.', 'Er steht in der Mitte der hintersten weißen Reihe.', 'Gesucht: e1.']),
        t(START, 'Tippe die schwarze Dame.', { t: 'tap', sqs: ['d8'] }, ['Die Dame trägt eine Krone mit drei Perlen.', 'Sie steht neben dem schwarzen König, ganz oben.', 'Gesucht: d8.']),
        t(START, 'Tippe irgendeinen weißen Bauern.', { t: 'tap', sqs: rank(2) }, ['Die Bauern stehen in der zweiten Reihe.', 'Bei Weiß ist das Reihe 2.', 'Zum Beispiel e2.']),
        t(START, 'Tippe einen weißen Springer.', { t: 'tap', sqs: ['b1', 'g1'] }, ['Der Springer hat einen Pferdekopf.', 'Er steht neben dem Läufer.', 'Gesucht: b1 oder g1.']),
      ] },
      { id: 'w1-l4', title: 'Ziehen und Schlagen', coach: 'rabbit', intro: 'Jetzt wird gezogen! Tippe erst die Figur, dann ein Feld. Steht dort ein Gegner, schlägst du ihn und nimmst ihn vom Brett.', tasks: [
        t('8/8/8/8/8/8/8/R7 w - - 0 1', 'Zieh den Turm nach a5.', { t: 'to', sqs: ['a5'] }, ['Der Turm zieht gerade, so weit er will.', 'a5 liegt auf seiner Linie, nach oben.', 'Tippe den Turm, dann a5.']),
        t('3p4/8/8/8/3R4/8/8/8 w - - 0 1', 'Schlag den schwarzen Bauern.', { t: 'capto', sq: 'd8' }, ['Der Bauer steht auf derselben Linie wie dein Turm.', 'Der Weg dorthin ist frei.', 'Tippe den Turm, dann d8.']),
        t('8/8/8/8/p7/8/8/R7 w - - 0 1', 'Schlag den Bauern auf a4.', { t: 'capto', sq: 'a4' }, ['Er steht auf der Linie a, über deinem Turm.', 'Dazwischen ist alles frei.', 'Tippe den Turm, dann a4.']),
      ] },
      { id: 'w1-l5', title: 'Das Weiße Kaninchen', boss: true, card: { kind: 'rabbit', name: 'Das Weiße Kaninchen' }, coach: 'rabbit', intro: 'Fang mich, wenn du kannst! Zeig, was du gelernt hast: Felder finden, ziehen, schlagen.', tasks: [
        t(EMPTY, 'Tippe das Feld f6.', { t: 'tap', sqs: ['f6'] }, ['f ist die sechste Spalte.', '6 ist die sechste Reihe von unten.', 'Gesucht: sechste Spalte, sechste Reihe.']),
        t('8/8/8/8/8/8/1R6/8 w - - 0 1', 'Zieh den Turm nach b7.', { t: 'to', sqs: ['b7'] }, ['Der Turm bleibt auf seiner Linie b.', 'Er zieht nach oben.', 'Tippe den Turm, dann b7.']),
        t('7p/8/8/8/8/8/8/7R w - - 0 1', 'Schlag den Bauern auf h8.', { t: 'capto', sq: 'h8' }, ['Dein Turm steht auf der Linie h.', 'Der Bauer ganz oben auf derselben Linie.', 'Tippe den Turm, dann h8.']),
        t(EMPTY, 'Tippe das Feld c2.', { t: 'tap', sqs: ['c2'] }, ['c ist die dritte Spalte.', '2 ist die zweite Reihe von unten.', 'Gesucht: dritte Spalte, zweite Reihe.']),
      ] },
    ],
  },
  {
    id: 'w2', name: 'Garten der Blumen', coach: 'knight',
    lessons: [
      { id: 'w2-l1', title: 'Ein Schritt vor', coach: 'rabbit', intro: 'Im Garten gehen die Bauern geradeaus: ein Feld pro Zug, immer nach vorn, nie zurück.', tasks: [
        t('8/8/8/8/8/8/4P3/8 w - - 0 1', 'Zieh den Bauern ein Feld vor.', { t: 'to', sqs: ['e3'] }, ['Vorwärts heißt: in Richtung Schwarz.', 'Ein Feld bedeutet: e2 nach e3.', 'Tippe den Bauern, dann e3.']),
        t('8/8/8/8/1P6/8/8/8 w - - 0 1', 'Zieh den Bauern nach b5.', { t: 'to', sqs: ['b5'] }, ['Der Bauer steht auf b4.', 'Ein Feld vor ist b5.', 'Tippe den Bauern, dann b5.']),
        t('8/8/3P4/8/8/8/8/8 w - - 0 1', 'Zieh den Bauern nach d7.', { t: 'to', sqs: ['d7'] }, ['Der Bauer steht auf d6.', 'Ein Feld vor ist d7.', 'Tippe den Bauern, dann d7.']),
      ] },
      { id: 'w2-l2', title: 'Der Doppelschritt', coach: 'rabbit', intro: 'Ein Bauer, der noch auf seinem Startfeld steht, darf einmalig zwei Felder ziehen.', tasks: [
        t('8/8/8/8/8/8/4P3/8 w - - 0 1', 'Zieh den Bauern zwei Felder vor.', { t: 'to', sqs: ['e4'] }, ['Er steht noch auf dem Startfeld e2.', 'Zwei Felder vor sind e4.', 'Tippe den Bauern, dann e4.']),
        t('8/8/8/8/8/8/2P5/8 w - - 0 1', 'Zieh den Bauern nach c4.', { t: 'to', sqs: ['c4'] }, ['Der Bauer steht auf c2, seinem Start.', 'Er darf zwei Felder ziehen.', 'Tippe den Bauern, dann c4.']),
        t('8/8/8/8/8/8/7P/8 w - - 0 1', 'Zieh den Bauern nach h4.', { t: 'to', sqs: ['h4'] }, ['Auch der Randbauer darf zwei Felder.', 'h2 nach h4.', 'Tippe den Bauern, dann h4.']),
      ] },
      { id: 'w2-l3', title: 'Schräg schlagen', coach: 'knight', intro: 'Ich bin der Weiße Ritter! Der Bauer geht gerade, aber er schlägt schräg nach vorn. Genau das vergessen viele.', tasks: [
        t('8/8/8/3p4/4P3/8/8/8 w - - 0 1', 'Schlag den schwarzen Bauern.', { t: 'capto', sq: 'd5' }, ['Der Gegner steht schräg vor deinem Bauern.', 'Schräg vor e4 liegt d5.', 'Tippe den Bauern, dann d5.']),
        t('8/8/8/8/1p1p4/2P5/8/8 w - - 0 1', 'Schlag einen der beiden Bauern.', { t: 'cap' }, ['Beide stehen schräg vor deinem Bauern.', 'Schräg vor c3 liegen b4 und d4.', 'Tippe den Bauern, dann b4 oder d4.']),
        t('8/8/5p1p/6P1/8/8/8/8 w - - 0 1', 'Schlag einen Bauern.', { t: 'cap' }, ['Dein Bauer steht auf g5.', 'Schräg vor ihm liegen f6 und h6.', 'Tippe den Bauern, dann f6 oder h6.']),
      ] },
      { id: 'w2-l4', title: 'Blockiert!', coach: 'knight', intro: 'Steht ein Gegner direkt vor dem Bauern, kommt er nicht vorbei. Dann hilft nur Schlagen, wenn schräg einer steht.', tasks: [
        t('8/8/8/4pp2/4P3/8/8/8 w - - 0 1', 'Der Bauer e4 ist blockiert. Schlag den anderen Bauern.', { t: 'capto', sq: 'f5' }, ['Vor e4 steht ein Gegner, er kommt nicht vorbei.', 'Schräg vor ihm steht f5.', 'Tippe den Bauern, dann f5.']),
        t('8/8/8/8/8/pp6/P7/8 w - - 0 1', 'Schlag den Bauern auf b3.', { t: 'capto', sq: 'b3' }, ['Geradeaus steht a3 im Weg.', 'Schräg vor a2 liegt b3.', 'Tippe den Bauern, dann b3.']),
        t('8/8/8/8/8/3pp3/3P4/8 w - - 0 1', 'Schlag den Bauern auf e3.', { t: 'capto', sq: 'e3' }, ['Geradeaus steht d3 im Weg.', 'Schräg vor d2 liegt e3.', 'Tippe den Bauern, dann e3.']),
      ] },
      { id: 'w2-l5', title: 'Die Tigerlilie', boss: true, card: { kind: 'alice', name: 'Alice im Garten' }, coach: 'rabbit', intro: 'Wer die achte Reihe erreicht, wird verwandelt, meistens in eine Dame. So wird Alice zur Königin.', tasks: [
        t('8/P7/8/8/8/8/8/8 w - - 0 1', 'Zieh den Bauern auf die letzte Reihe.', { t: 'to', sqs: ['a8'] }, ['Der Bauer steht auf a7, ein Feld vor dem Ziel.', 'Ein Feld vor ist a8.', 'Tippe den Bauern, dann a8, dann wähle die Dame.']),
        t('8/6P1/8/8/8/8/8/8 w - - 0 1', 'Verwandle diesen Bauern.', { t: 'to', sqs: ['g8'] }, ['Er steht auf g7, ein Feld vor dem Ziel.', 'Ein Feld vor ist g8.', 'Tippe den Bauern, dann g8, dann wähle eine Figur.']),
        t('1r6/P7/8/8/8/8/8/8 w - - 0 1', 'Schlag die Burg und verwandle dich.', { t: 'capto', sq: 'b8' }, ['Schräg vor a7 liegt b8.', 'Dort steht ein schwarzer Turm.', 'Tippe den Bauern, dann b8, dann die Dame.']),
      ] },
    ],
  },
];
