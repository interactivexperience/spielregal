// Spiegelschach – Lektionen (Daten). Läuft im Browser (eingebettet) und in Node (Test: test/schach-lessons.mjs).
// Alle Stellungen: Weiß am Zug, oft ohne König (Sandbox der Engine). goal:
//   { t:'tap', sqs:[…] }   ein Feld antippen   · { t:'to', sqs:[…] } mit einer Figur auf eines dieser Felder ziehen
//   { t:'cap' }            irgendetwas schlagen · { t:'capto', sq:'d8' } genau dieses Feld schlagen
const FILES = 'abcdefgh';
export const file = c => [1, 2, 3, 4, 5, 6, 7, 8].map(r => c + r);
export const rank = r => FILES.split('').map(c => c + r);
const sqLight = sq => (FILES.indexOf(sq[0]) + Number(sq[1]) - 1) % 2 === 1;
const allSq = FILES.split('').flatMap(f => file(f));
const LIGHT = allSq.filter(sqLight), DARK = allSq.filter(q => !sqLight(q));
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
  {
    id: 'w3', name: 'Das Kartenschloss', coach: 'rabbit',
    lessons: [
      { id: 'w3-l1', title: 'Gerade Wege', coach: 'rabbit', intro: 'Im Kartenschloss steht der Turm Wache. Er läuft nur gerade: vor, zurück, nach links und nach rechts, so weit er will.', tasks: [
        t('8/8/8/8/8/8/8/R7 w - - 0 1', 'Zieh den Turm nach h1.', { t: 'to', sqs: ['h1'] }, ['Der Turm läuft die Reihe entlang.', 'Von a1 nach rechts bis ganz an den Rand.', 'Tippe den Turm, dann h1.']),
        t('8/8/8/8/3R4/8/8/8 w - - 0 1', 'Zieh den Turm nach d8.', { t: 'to', sqs: ['d8'] }, ['Der Turm bleibt auf der Linie d.', 'Er läuft nach oben bis zum Rand.', 'Tippe den Turm, dann d8.']),
        t('7R/8/8/8/8/8/8/8 w - - 0 1', 'Zieh den Turm nach a8.', { t: 'to', sqs: ['a8'] }, ['Der Turm steht in der Reihe 8.', 'Er läuft nach links bis zum Rand.', 'Tippe den Turm, dann a8.']),
      ] },
      { id: 'w3-l2', title: 'Im Weg', coach: 'rabbit', intro: 'Der Turm springt nicht. Eigene Figuren versperren ihm den Weg, und einen Gegner kann er nur schlagen, nicht überspringen.', tasks: [
        t('8/8/8/8/P7/8/8/R7 w - - 0 1', 'Zieh den Turm so weit nach oben wie möglich.', { t: 'to', sqs: ['a3'] }, ['Dein eigener Bauer steht auf a4.', 'Der Turm darf nicht durch ihn hindurch.', 'Das letzte freie Feld ist a3.']),
        t('8/8/8/8/8/3P4/8/3R4 w - - 0 1', 'Zieh den Turm nach h1.', { t: 'to', sqs: ['h1'] }, ['Der Bauer vor dem Turm versperrt den Weg nach oben.', 'Nach rechts ist alles frei.', 'Tippe den Turm, dann h1.']),
        t('8/8/8/8/8/8/8/R2p4 w - - 0 1', 'Schlag den schwarzen Bauern.', { t: 'capto', sq: 'd1' }, ['Der Bauer steht in derselben Reihe wie dein Turm.', 'Dazwischen ist alles frei.', 'Tippe den Turm, dann d1.']),
      ] },
      { id: 'w3-l3', title: 'Der Turm schlägt zu', coach: 'rabbit', intro: 'Der Turm schlägt so, wie er zieht: gerade. Die gegnerische Figur kommt vom Brett, der Turm steht danach auf ihrem Feld.', tasks: [
        t('4r3/8/8/8/8/8/8/4R3 w - - 0 1', 'Schlag den schwarzen Turm.', { t: 'capto', sq: 'e8' }, ['Beide Türme stehen auf der Linie e.', 'Der Weg ist frei.', 'Tippe deinen Turm, dann e8.']),
        t('8/8/8/8/1p2R3/8/8/8 w - - 0 1', 'Schlag den Bauern auf b4.', { t: 'capto', sq: 'b4' }, ['Der Bauer steht in derselben Reihe.', 'Dazwischen liegen c4 und d4, beide frei.', 'Tippe den Turm, dann b4.']),
        t('8/8/8/8/8/8/p7/R7 w - - 0 1', 'Schlag den Bauern direkt über dem Turm.', { t: 'capto', sq: 'a2' }, ['Er steht auf a2, genau über a1.', 'Der Turm schlägt auch nach vorn.', 'Tippe den Turm, dann a2.']),
      ] },
      { id: 'w3-l4', title: 'Die Erste im Weg', coach: 'rabbit', intro: 'Stehen mehrere Gegner in einer Reihe, erreichst du nur den ersten. Die hinteren sind gedeckt von den vorderen.', tasks: [
        t('3r4/3b4/8/8/8/8/8/3R4 w - - 0 1', 'Schlag die Figur, die dein Turm erreicht.', { t: 'capto', sq: 'd7' }, ['Der Läufer auf d7 steht vor dem Turm auf d8.', 'Den Turm erreichst du nicht.', 'Tippe den Turm, dann d7.']),
        t('8/8/8/8/R2p3p/8/8/8 w - - 0 1', 'Schlag den Bauern, den du erreichst.', { t: 'capto', sq: 'd4' }, ['In der Reihe stehen zwei Bauern.', 'Der erste steht auf d4.', 'Tippe den Turm, dann d4.']),
        t('8/8/8/8/p3R2p/8/8/8 w - - 0 1', 'Schlag einen der beiden Bauern.', { t: 'cap' }, ['Links und rechts steht je ein Bauer.', 'Beide sind frei erreichbar.', 'Tippe den Turm, dann a4 oder h4.']),
      ] },
      { id: 'w3-l5', title: 'Die Kartenwache', boss: true, card: { kind: 'rook', name: 'Die Kartenwache' }, coach: 'rabbit', intro: 'Halt! Wer an der Kartenwache vorbei will, muss den Turm beherrschen. Los, zeig es mir!', tasks: [
        t('8/8/8/8/8/8/8/3R4 w - - 0 1', 'Zieh den Turm nach d8.', { t: 'to', sqs: ['d8'] }, ['Der Turm läuft die Linie d hinauf.', 'Nichts steht im Weg.', 'Tippe den Turm, dann d8.']),
        t('8/8/8/8/2P5/8/8/2R5 w - - 0 1', 'Zieh den Turm so weit nach oben wie möglich.', { t: 'to', sqs: ['c3'] }, ['Dein Bauer steht auf c4.', 'Der Turm kommt nicht hindurch.', 'Das letzte freie Feld ist c3.']),
        t('2r5/8/8/8/8/8/8/2R5 w - - 0 1', 'Schlag den schwarzen Turm.', { t: 'capto', sq: 'c8' }, ['Beide stehen auf der Linie c.', 'Der Weg ist frei.', 'Tippe deinen Turm, dann c8.']),
        t('8/8/8/8/8/8/6p1/6R1 w - - 0 1', 'Schlag den Bauern.', { t: 'capto', sq: 'g2' }, ['Er steht direkt über deinem Turm.', 'Der Turm schlägt nach vorn.', 'Tippe den Turm, dann g2.']),
      ] },
    ],
  },
  {
    id: 'w4', name: 'Wald ohne Namen', coach: 'cat',
    lessons: [
      { id: 'w4-l1', title: 'Schräge Wege', coach: 'cat', intro: 'Im Wald ohne Namen gibt es keine geraden Wege, nur schräge. Der Läufer wandert auf den Diagonalen, so weit er will.', tasks: [
        t('8/8/8/8/8/8/8/2B5 w - - 0 1', 'Zieh den Läufer nach h6.', { t: 'to', sqs: ['h6'] }, ['Der Läufer zieht immer schräg.', 'Von c1 geht es über d2, e3, f4 und g5.', 'Tippe den Läufer, dann h6.']),
        t('8/8/8/8/3B4/8/8/8 w - - 0 1', 'Zieh den Läufer nach a7.', { t: 'to', sqs: ['a7'] }, ['Von d4 schräg nach links oben.', 'Über c5 und b6 nach a7.', 'Tippe den Läufer, dann a7.']),
        t('8/8/8/8/8/8/8/5B2 w - - 0 1', 'Zieh den Läufer nach a6.', { t: 'to', sqs: ['a6'] }, ['Von f1 schräg nach links oben.', 'Über e2, d3, c4 und b5.', 'Tippe den Läufer, dann a6.']),
      ] },
      { id: 'w4-l2', title: 'Hell und dunkel', coach: 'cat', intro: 'Der Läufer bleibt sein Leben lang auf einer Farbe. Wer auf einem hellen Feld startet, betritt nie ein dunkles.', tasks: [
        t(EMPTY, 'Tippe ein dunkles Feld.', { t: 'tap', sqs: DARK }, ['a1 ist dunkel.', 'Dunkle Felder liegen schräg nebeneinander.', 'Zum Beispiel a1, c1 oder b2.']),
        t(EMPTY, 'Tippe ein helles Feld.', { t: 'tap', sqs: LIGHT }, ['a1 ist dunkel, b1 daneben ist hell.', 'Helle und dunkle Felder wechseln sich ab.', 'Zum Beispiel b1, a2 oder d1.']),
        t('8/8/8/8/8/8/8/5B2 w - - 0 1', 'Zieh den Läufer in die Reihe 4.', { t: 'to', sqs: ['c4'] }, ['Der Läufer steht auf f1, einem hellen Feld.', 'Er erreicht Reihe 4 nur schräg links.', 'Tippe den Läufer, dann c4.']),
      ] },
      { id: 'w4-l3', title: 'Der Läufer schlägt', coach: 'cat', intro: 'Auch geschlagen wird schräg. Zeig, dass du die Diagonalen im Blick hast.', tasks: [
        t('8/8/5p2/8/3B4/8/8/8 w - - 0 1', 'Schlag den schwarzen Bauern.', { t: 'capto', sq: 'f6' }, ['Der Bauer liegt auf einer Diagonale von d4.', 'Über e5 geht es nach f6.', 'Tippe den Läufer, dann f6.']),
        t('8/8/8/8/8/p7/8/2B5 w - - 0 1', 'Schlag den Bauern auf a3.', { t: 'capto', sq: 'a3' }, ['Von c1 schräg nach links oben.', 'Über b2 nach a3.', 'Tippe den Läufer, dann a3.']),
        t('8/6p1/8/8/3B4/8/8/8 w - - 0 1', 'Schlag den Bauern auf g7.', { t: 'capto', sq: 'g7' }, ['Von d4 schräg nach rechts oben.', 'Über e5 und f6 nach g7.', 'Tippe den Läufer, dann g7.']),
      ] },
      { id: 'w4-l4', title: 'Blockiert', coach: 'cat', intro: 'Wie der Turm springt auch der Läufer nicht. Eigene Figuren und Gegner versperren die Diagonale.', tasks: [
        t('8/8/8/8/8/2P5/1B6/8 w - - 0 1', 'Zieh den Läufer auf das freie Feld daneben.', { t: 'to', sqs: ['a3', 'a1', 'c1'] }, ['Der Bauer auf c3 versperrt eine Diagonale.', 'Es bleiben a1, a3 und c1.', 'Tippe den Läufer, dann eines dieser Felder.']),
        t('8/8/8/8/8/8/3P4/2B5 w - - 0 1', 'Zieh den Läufer nach a3.', { t: 'to', sqs: ['a3'] }, ['Der Bauer auf d2 versperrt die rechte Diagonale.', 'Die linke ist frei: b2, a3.', 'Tippe den Läufer, dann a3.']),
        t('8/6r1/5p2/8/3B4/8/8/8 w - - 0 1', 'Schlag die Figur, die dein Läufer erreicht.', { t: 'capto', sq: 'f6' }, ['Der Bauer auf f6 steht vor dem Turm.', 'Den Turm erreichst du nicht.', 'Tippe den Läufer, dann f6.']),
      ] },
      { id: 'w4-l5', title: 'Die Grinsekatze', boss: true, card: { kind: 'cat', name: 'Die Grinsekatze' }, coach: 'cat', intro: 'Mal bin ich da, mal nicht. Aber schräg bin ich immer. Fang mich, wenn du kannst!', tasks: [
        t('8/8/8/8/8/8/8/2B5 w - - 0 1', 'Zieh den Läufer nach h6.', { t: 'to', sqs: ['h6'] }, ['Von c1 schräg nach rechts oben.', 'Über d2, e3, f4 und g5.', 'Tippe den Läufer, dann h6.']),
        t('8/8/8/7p/8/8/8/R2B4 w - - 0 1', 'Der Turm kann nicht, der Läufer schon. Schlag den Bauern.', { t: 'capto', sq: 'h5' }, ['Der Bauer liegt nicht auf einer Linie des Turms.', 'Von d1 schräg nach rechts oben: e2, f3, g4, h5.', 'Tippe den Läufer, dann h5.']),
        t('4r3/8/8/8/8/8/8/4RB2 w - - 0 1', 'Schlag den schwarzen Turm.', { t: 'capto', sq: 'e8' }, ['Dein Turm steht auf der Linie e.', 'Der Läufer kann den Turm nicht erreichen.', 'Tippe den Turm, dann e8.']),
      ] },
    ],
  },
  {
    id: 'w5', name: 'Der Weiße Ritter', coach: 'wknight',
    lessons: [
      { id: 'w5-l1', title: 'Der L-Sprung', coach: 'wknight', intro: 'Hoppla, schon wieder runtergefallen! Der Springer zieht in einem L: zwei Felder gerade und eines zur Seite.', tasks: [
        t('8/8/8/8/8/8/8/1N6 w - - 0 1', 'Zieh den Springer nach c3.', { t: 'to', sqs: ['c3'] }, ['Von b1: ein Feld nach rechts, zwei nach oben.', 'Das ergibt ein L.', 'Tippe den Springer, dann c3.']),
        t('8/8/8/4N3/8/8/8/8 w - - 0 1', 'Zieh den Springer nach f7.', { t: 'to', sqs: ['f7'] }, ['Von e5: ein Feld nach rechts, zwei nach oben.', 'Das ergibt ein L.', 'Tippe den Springer, dann f7.']),
        t('8/8/8/8/8/8/8/6N1 w - - 0 1', 'Zieh den Springer nach f3.', { t: 'to', sqs: ['f3'] }, ['Von g1: ein Feld nach links, zwei nach oben.', 'Das ergibt ein L.', 'Tippe den Springer, dann f3.']),
      ] },
      { id: 'w5-l2', title: 'Über alle Köpfe', coach: 'wknight', intro: 'Der Springer ist der Einzige, der über andere Figuren springt. Ihm ist egal, was dazwischen steht.', tasks: [
        t('8/8/8/8/8/8/PPPPPPPP/1N6 w - - 0 1', 'Spring über die Bauern nach c3.', { t: 'to', sqs: ['c3'] }, ['Vor dem Springer stehen Bauern.', 'Er springt einfach darüber.', 'Tippe den Springer, dann c3.']),
        t(START, 'Zieh den Springer von g1 nach f3.', { t: 'to', sqs: ['f3'] }, ['Der Springer steht rechts unten neben dem Läufer.', 'Ein Feld nach links, zwei nach oben.', 'Tippe den Springer auf g1, dann f3.']),
        t(START, 'Zieh den Springer von b1 nach c3.', { t: 'to', sqs: ['c3'] }, ['Der Springer steht links unten neben dem Läufer.', 'Ein Feld nach rechts, zwei nach oben.', 'Tippe den Springer auf b1, dann c3.']),
      ] },
      { id: 'w5-l3', title: 'Der Springer schlägt', coach: 'wknight', intro: 'Geschlagen wird ebenfalls im L: Der Springer landet genau auf dem Feld des Gegners.', tasks: [
        t('8/8/4p3/8/3N4/8/8/8 w - - 0 1', 'Schlag den Bauern auf e6.', { t: 'capto', sq: 'e6' }, ['Von d4: ein Feld nach rechts, zwei nach oben.', 'Das ist ein L-Zug.', 'Tippe den Springer, dann e6.']),
        t('8/8/8/8/8/2N5/8/1p6 w - - 0 1', 'Schlag den Bauern auf b1.', { t: 'capto', sq: 'b1' }, ['Von c3: ein Feld nach links, zwei nach unten.', 'Der Springer darf auch rückwärts.', 'Tippe den Springer, dann b1.']),
        t('8/8/8/6p1/8/5N2/8/8 w - - 0 1', 'Schlag den Bauern auf g5.', { t: 'capto', sq: 'g5' }, ['Von f3: ein Feld nach rechts, zwei nach oben.', 'Das ist ein L-Zug.', 'Tippe den Springer, dann g5.']),
      ] },
      { id: 'w5-l4', title: 'Die Gabel', coach: 'wknight', intro: 'Mein Lieblingstrick: Der Springer greift zwei Figuren zugleich an. Der Gegner kann nur eine retten.', tasks: [
        t('r3r3/8/8/1N6/8/8/8/8 w - - 0 1', 'Zieh den Springer so, dass er beide Türme angreift.', { t: 'to', sqs: ['c7'] }, ['Die Türme stehen auf a8 und e8.', 'Von c7 sind beide einen L-Zug entfernt.', 'Tippe den Springer, dann c7.']),
        t('3q1r2/8/8/6N1/8/8/8/8 w - - 0 1', 'Gabel: greif Dame und Turm gleichzeitig an.', { t: 'to', sqs: ['e6'] }, ['Dame auf d8, Turm auf f8.', 'Von e6 greift der Springer beide an.', 'Tippe den Springer, dann e6.']),
        t('2r3r1/8/8/3N4/8/8/8/8 w - - 0 1', 'Zieh den Springer auf das Gabelfeld.', { t: 'to', sqs: ['e7'] }, ['Die Türme stehen auf c8 und g8.', 'Von e7 sind beide einen L-Zug entfernt.', 'Tippe den Springer, dann e7.']),
      ] },
      { id: 'w5-l5', title: 'Ritter-Duell', boss: true, card: { kind: 'wknight', name: 'Der Weiße Ritter' }, coach: 'wknight', intro: 'Ein Duell! Wer springt am besten? Ich habe geübt, falle aber trotzdem vom Pferd.', tasks: [
        t('8/8/8/8/8/8/8/6N1 w - - 0 1', 'Zieh den Springer nach e2.', { t: 'to', sqs: ['e2'] }, ['Von g1: zwei Felder nach links, eines nach oben.', 'Das ergibt ein L.', 'Tippe den Springer, dann e2.']),
        t('8/8/8/3r4/8/4N3/8/8 w - - 0 1', 'Schlag den schwarzen Turm.', { t: 'capto', sq: 'd5' }, ['Von e3: ein Feld nach links, zwei nach oben.', 'Das ist ein L-Zug.', 'Tippe den Springer, dann d5.']),
        t('2r3r1/8/8/3N4/8/8/8/8 w - - 0 1', 'Gabel: greif beide Türme an.', { t: 'to', sqs: ['e7'] }, ['Die Türme stehen auf c8 und g8.', 'Von e7 sind beide einen L-Zug entfernt.', 'Tippe den Springer, dann e7.']),
        t(START, 'Spring über die Bauern nach f3.', { t: 'to', sqs: ['f3', 'h3'] }, ['Zwei Ziele sind möglich.', 'Von g1 geht es nach f3 oder h3.', 'Tippe den Springer, dann f3.']),
      ] },
    ],
  },
];
