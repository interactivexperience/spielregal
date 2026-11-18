// Spiegelschach – Lektionen (Daten). Läuft im Browser (eingebettet) und in Node (Test: test/schach-lessons.mjs).
// Alle Stellungen: Weiß am Zug, oft ohne König (Sandbox der Engine). goal:
//   { t:'tap', sqs:[…] }   ein Feld antippen   · { t:'to', sqs:[…] } mit einer Figur auf eines dieser Felder ziehen
//   { t:'mate' }           ein Zug, der Schachmatt setzt · { t:'check' } ein Zug, der Schach bietet
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
  {
    id: 'w6', name: 'Rasen der Roten Königin', coach: 'rqueen',
    lessons: [
      { id: 'w6-l1', title: 'Die mächtige Dame', coach: 'rqueen', intro: 'Hier muss man rennen, um am selben Ort zu bleiben! Die Dame ist die stärkste Figur: Sie zieht wie Turm und Läufer zusammen.', tasks: [
        t('8/8/8/8/8/8/8/3Q4 w - - 0 1', 'Zieh die Dame nach h5.', { t: 'to', sqs: ['h5'] }, ['Von d1 schräg nach rechts oben.', 'Über e2, f3 und g4 nach h5.', 'Tippe die Dame, dann h5.']),
        t('8/8/8/8/8/8/8/Q7 w - - 0 1', 'Zieh die Dame nach a8.', { t: 'to', sqs: ['a8'] }, ['Die Dame darf gerade ziehen wie ein Turm.', 'Die Linie a hinauf bis zum Rand.', 'Tippe die Dame, dann a8.']),
        t('8/8/8/8/4Q3/8/8/8 w - - 0 1', 'Zieh die Dame nach b7.', { t: 'to', sqs: ['b7'] }, ['Von e4 schräg nach links oben.', 'Über d5 und c6 nach b7.', 'Tippe die Dame, dann b7.']),
      ] },
      { id: 'w6-l2', title: 'Die Dame schlägt', coach: 'rqueen', intro: 'Sie schlägt in alle acht Richtungen. Wer vor ihr steht, hat meistens ein Problem.', tasks: [
        t('8/8/8/8/3Q2p1/8/8/8 w - - 0 1', 'Schlag den Bauern auf g4.', { t: 'capto', sq: 'g4' }, ['Der Bauer steht in derselben Reihe wie die Dame.', 'Dazwischen ist alles frei.', 'Tippe die Dame, dann g4.']),
        t('8/8/5p2/8/3Q4/8/8/8 w - - 0 1', 'Schlag den Bauern auf f6.', { t: 'capto', sq: 'f6' }, ['Er steht auf einer Diagonale von d4.', 'Über e5 nach f6.', 'Tippe die Dame, dann f6.']),
        t('8/p7/8/8/8/8/8/Q7 w - - 0 1', 'Schlag den Bauern auf a7.', { t: 'capto', sq: 'a7' }, ['Er steht auf der Linie a, über der Dame.', 'Dazwischen ist alles frei.', 'Tippe die Dame, dann a7.']),
      ] },
      { id: 'w6-l3', title: 'Was ist was wert?', coach: 'rqueen', intro: 'Bauer 1, Springer 3, Läufer 3, Turm 5, Dame 9. Wer die Werte kennt, schlägt klug: lieber den Turm als den Bauern.', tasks: [
        t('8/3p4/8/8/3Q3r/8/8/8 w - - 0 1', 'Schlag die wertvollere Figur: Turm oder Bauer?', { t: 'capto', sq: 'h4' }, ['Der Turm ist 5 wert, der Bauer nur 1.', 'Der Turm steht in der Reihe der Dame.', 'Tippe die Dame, dann h4.']),
        t('8/8/8/8/n2Q3r/8/8/8 w - - 0 1', 'Schlag die wertvollere Figur: Springer oder Turm?', { t: 'capto', sq: 'h4' }, ['Der Springer ist 3 wert, der Turm 5.', 'Beide stehen in deiner Reihe.', 'Tippe die Dame, dann h4.']),
        t('8/1q6/8/8/8/8/8/1R2p3 w - - 0 1', 'Schlag die Dame.', { t: 'capto', sq: 'b7' }, ['Die Dame ist 9 wert, der Bauer nur 1.', 'Die Dame steht auf der Linie b.', 'Tippe den Turm, dann b7.']),
      ] },
      { id: 'w6-l4', title: 'Tauschen will gelernt sein', coach: 'rqueen', intro: 'Wer eine gedeckte Figur schlägt, wird zurückgeschlagen. Schau, ob die Figur beschützt ist, bevor du zuschlägst.', tasks: [
        t('3r4/8/8/6p1/3Q3r/8/8/8 w - - 0 1', 'Schlag den ungedeckten Turm.', { t: 'capto', sq: 'd8' }, ['Der Turm auf h4 wird vom Bauern auf g5 gedeckt.', 'Der Turm auf d8 steht allein.', 'Tippe die Dame, dann d8.']),
        t('3q4/8/8/8/8/8/8/3Q4 w - - 0 1', 'Schlag die Dame: ein gleicher Tausch.', { t: 'capto', sq: 'd8' }, ['Beide Damen stehen sich gegenüber.', 'Dame gegen Dame ist ein fairer Tausch.', 'Tippe deine Dame, dann d8.']),
        t('8/8/8/4b3/8/8/8/Q7 w - - 0 1', 'Schlag den Läufer.', { t: 'capto', sq: 'e5' }, ['Er steht auf der langen Diagonale a1 bis h8.', 'Von a1 über b2, c3 und d4 nach e5.', 'Tippe die Dame, dann e5.']),
      ] },
      { id: 'w6-l5', title: 'Die Weiße Königin', boss: true, card: { kind: 'queen', name: 'Die Weiße Königin' }, coach: 'rqueen', intro: 'Rennen, rennen, rennen! Wer meine Schwester besiegen will, muss mit der Dame umgehen können.', tasks: [
        t('8/8/8/8/8/8/8/3Q4 w - - 0 1', 'Zieh die Dame nach h5.', { t: 'to', sqs: ['h5'] }, ['Von d1 schräg nach rechts oben.', 'Über e2, f3 und g4 nach h5.', 'Tippe die Dame, dann h5.']),
        t('8/3p4/8/8/3Q3r/8/8/8 w - - 0 1', 'Schlag die wertvollere Figur.', { t: 'capto', sq: 'h4' }, ['Turm 5, Bauer 1.', 'Der Turm steht in der Reihe der Dame.', 'Tippe die Dame, dann h4.']),
        t('3r4/8/8/6p1/3Q3r/8/8/8 w - - 0 1', 'Schlag die Figur, die niemand deckt.', { t: 'capto', sq: 'd8' }, ['Der Turm auf h4 ist durch den Bauern gedeckt.', 'Der Turm auf d8 ist ungedeckt.', 'Tippe die Dame, dann d8.']),
      ] },
    ],
  },
  {
    id: 'w7', name: 'Der schlafende König', coach: 'king',
    lessons: [
      { id: 'w7-l1', title: 'Der König', coach: 'king', intro: 'Pssst! Der König schläft. Er ist die wichtigste Figur, aber er zieht nur ein einziges Feld, in jede Richtung.', tasks: [
        t('8/8/8/8/8/8/8/4K3 w - - 0 1', 'Zieh den König ein Feld nach oben.', { t: 'to', sqs: ['e2'] }, ['Ein Feld heißt: genau ein Feld.', 'Von e1 nach oben liegt e2.', 'Tippe den König, dann e2.']),
        t('8/8/8/8/3K4/8/8/8 w - - 0 1', 'Zieh den König schräg nach links oben.', { t: 'to', sqs: ['c5'] }, ['Schräg: ein Feld nach links und eines nach oben.', 'Von d4 ist das c5.', 'Tippe den König, dann c5.']),
        t('8/8/8/8/8/8/8/7K w - - 0 1', 'Zieh den König schräg nach links oben.', { t: 'to', sqs: ['g2'] }, ['Von h1 ein Feld nach links und eines nach oben.', 'Das ist g2.', 'Tippe den König, dann g2.']),
      ] },
      { id: 'w7-l2', title: 'Schach!', coach: 'king', intro: 'Greift eine Figur den König an, heißt das Schach. Der Gegner muss sofort reagieren. Schach bieten ist oft der erste Schritt zum Sieg.', tasks: [
        t('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', 'Biete Schach mit dem Turm.', { t: 'check' }, ['Der schwarze König steht auf e8.', 'Ein Turm auf der 8. Reihe greift ihn an.', 'Tippe den Turm, dann a8.']),
        t('4k3/8/8/8/8/8/8/3QK3 w - - 0 1', 'Biete Schach mit der Dame.', { t: 'check' }, ['Die Dame greift auf Linien und Diagonalen an.', 'Zum Beispiel von d8 aus.', 'Tippe die Dame, dann d8.']),
        t('7k/8/8/8/8/8/8/K5R1 w - - 0 1', 'Biete Schach mit dem Turm.', { t: 'check' }, ['Der schwarze König steht auf h8.', 'Ein Turm auf der 8. Reihe greift ihn an.', 'Tippe den Turm, dann g8.']),
      ] },
      { id: 'w7-l3', title: 'Schachmatt', coach: 'king', intro: 'Kann der König nicht entkommen, ist es Schachmatt und die Partie ist zu Ende. Finde den Zug, der das erreicht.', tasks: [
        t('6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1', 'Setze matt: die eigenen Bauern versperren dem König den Weg.', { t: 'mate' }, ['Der König wird von seinen eigenen Bauern eingesperrt.', 'Ein Turm auf der 8. Reihe genügt.', 'Tippe den Turm, dann a8.']),
        t('7k/8/6K1/8/8/8/8/Q7 w - - 0 1', 'Setze matt mit Dame und König.', { t: 'mate' }, ['Dein König nimmt ihm g7 und h7.', 'Die Dame muss die 8. Reihe angreifen.', 'Tippe die Dame, dann a8.']),
        t('7k/R7/8/8/8/8/8/1R2K3 w - - 0 1', 'Setze matt mit zwei Türmen.', { t: 'mate' }, ['Der Turm auf a7 sperrt die 7. Reihe.', 'Der andere Turm muss die 8. Reihe angreifen.', 'Tippe den Turm auf b1, dann b8.']),
      ] },
      { id: 'w7-l4', title: 'Rochade und en passant', coach: 'king', intro: 'Zwei Sonderzüge! Bei der Rochade zieht der König zwei Felder zum Turm hin und der Turm springt auf die andere Seite. En passant ist ein besonderer Schlag des Bauern.', tasks: [
        t('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'Rochiere kurz: der König zieht nach g1.', { t: 'to', sqs: ['g1'] }, ['Der König zieht zwei Felder zum Turm hin.', 'Der Turm springt dann auf f1.', 'Tippe den König, dann g1.']),
        t('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'Rochiere lang: der König zieht nach c1.', { t: 'to', sqs: ['c1'] }, ['Der König zieht zwei Felder nach links.', 'Der Turm springt dann auf d1.', 'Tippe den König, dann c1.']),
        t('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', 'Schlag den Bauern d5 im Vorbeigehen (en passant).', { t: 'to', sqs: ['d6'] }, ['Der schwarze Bauer ist gerade zwei Felder gezogen.', 'Dein Bauer schlägt ihn, als wäre er nur eines gezogen.', 'Tippe den Bauern auf e5, dann d6.']),
      ] },
      { id: 'w7-l5', title: 'Matt in 1', boss: true, card: { kind: 'king', name: 'Der schlafende König' }, coach: 'king', intro: 'Weck ihn nicht, aber setz ihn matt! Aufgepasst: Ein falscher Zug kann auch ein Patt sein, dann ist es unentschieden.', tasks: [
        t('7k/5K2/8/8/8/8/8/6Q1 w - - 0 1', 'Matt in 1. Vorsicht vor Patt!', { t: 'mate' }, ['Dame nach g6 wäre ein Patt, der König hätte keinen Zug.', 'Die Dame muss geschützt sein.', 'Tippe die Dame, dann g7.']),
        t('k7/8/1K6/8/8/8/8/7Q w - - 0 1', 'Matt in 1. Vorsicht vor Patt!', { t: 'mate' }, ['Dame nach c7 wäre ein Patt.', 'Die Dame muss die 8. Reihe angreifen.', 'Tippe die Dame, dann h8.']),
        t('5k2/8/5K2/8/8/8/8/7R w - - 0 1', 'Matt in 1 mit Turm und König.', { t: 'mate' }, ['Dein König nimmt ihm e7, f7 und g7.', 'Der Turm muss die 8. Reihe angreifen.', 'Tippe den Turm, dann h8.']),
      ] },
    ],
  },
  {
    id: 'w8', name: 'Krocketplatz', coach: 'cat',
    lessons: [
      { id: 'w8-l1', title: 'Die Gabel', coach: 'cat', intro: 'Auf dem Krocketplatz schlägt man zwei Igel mit einem Schlag. Eine Gabel greift zwei Figuren gleichzeitig an.', tasks: [
        t('8/8/1r1r4/8/2P5/8/8/8 w - - 0 1', 'Gabel mit dem Bauern: greif beide Türme an.', { t: 'to', sqs: ['c5'] }, ['Der Bauer schlägt schräg.', 'Von c5 greift er b6 und d6 an.', 'Tippe den Bauern, dann c5.']),
        t('3q3k/8/8/4N3/8/8/8/4K3 w - - 0 1', 'Gabel gegen König und Dame.', { t: 'to', sqs: ['f7'] }, ['Der Springer springt im L.', 'Von f7 greift er h8 und d8 an.', 'Tippe den Springer, dann f7.']),
        t('8/8/2r1r3/8/3P4/8/8/8 w - - 0 1', 'Gabel mit dem Bauern: greif beide Türme an.', { t: 'to', sqs: ['d5'] }, ['Der Bauer schlägt schräg nach vorn.', 'Von d5 greift er c6 und e6 an.', 'Tippe den Bauern, dann d5.']),
      ] },
      { id: 'w8-l2', title: 'Die Fesselung', coach: 'cat', intro: 'Steht eine Figur zwischen deinem Angreifer und dem gegnerischen König, ist sie gefesselt. Sie darf sich nicht bewegen, sonst steht der König im Schach.', tasks: [
        t('4k3/4n3/8/8/8/8/8/4R3 w - - 0 1', 'Schlag den gefesselten Springer.', { t: 'capto', sq: 'e7' }, ['Der Springer steht zwischen Turm und König.', 'Er kann nicht ausweichen.', 'Tippe den Turm, dann e7.']),
        t('6k1/5q2/8/8/8/1B6/8/6K1 w - - 0 1', 'Schlag die gefesselte Dame.', { t: 'capto', sq: 'f7' }, ['Die Dame steht zwischen Läufer und König.', 'Auf der Diagonale b3 bis g8.', 'Tippe den Läufer, dann f7.']),
        t('4k3/4n3/8/8/8/8/8/R5K1 w - - 0 1', 'Fessle den Springer mit dem Turm.', { t: 'to', sqs: ['e1'] }, ['Der Turm muss auf die Linie e.', 'Dann steht der Springer zwischen Turm und König.', 'Tippe den Turm, dann e1.']),
      ] },
      { id: 'w8-l3', title: 'Der Spieß', coach: 'cat', intro: 'Beim Spieß steht die wertvolle Figur vorn und muss weichen. Dahinter wartet eine zweite Figur, die man dann schlägt.', tasks: [
        t('3k2r1/8/8/8/8/8/8/R3K3 w - - 0 1', 'Spieß: Schach auf der 8. Reihe, dahinter wartet der Turm.', { t: 'to', sqs: ['a8'] }, ['Der König steht vor dem Turm.', 'Er muss ausweichen, dann schlägst du den Turm.', 'Tippe den Turm, dann a8.']),
        t('r2k4/8/8/8/8/8/8/4K2R w - - 0 1', 'Spieß: greif den König an, dahinter steht der Turm.', { t: 'to', sqs: ['h8'] }, ['Der König steht vor dem Turm auf a8.', 'Ein Turm auf der 8. Reihe greift beide an.', 'Tippe den Turm, dann h8.']),
        t('4r3/8/8/4k3/8/8/8/R5K1 w - - 0 1', 'Spieß auf der Linie e.', { t: 'to', sqs: ['e1'] }, ['Der König steht vor dem Turm auf e8.', 'Von e1 greift dein Turm beide an.', 'Tippe den Turm, dann e1.']),
      ] },
      { id: 'w8-l4', title: 'Der Abzug', coach: 'cat', intro: 'Beim Abzug gibt eine Figur den Weg frei. Die Figur dahinter greift an, und die vordere Figur darf noch ihren eigenen Zug machen!', tasks: [
        t('4k3/8/8/8/8/8/4B3/4R1K1 w - - 0 1', 'Zieh den Läufer weg und gib Schach.', { t: 'check' }, ['Der Läufer steht vor dem Turm.', 'Jeder Läuferzug gibt die Linie e frei.', 'Tippe den Läufer, dann irgendein Feld.']),
        t('4k3/8/3p4/8/4N3/8/8/4R1K1 w - - 0 1', 'Schlag den Bauern und gib dabei Schach.', { t: 'capto', sq: 'd6' }, ['Der Springer deckt die Linie e.', 'Wenn er schlägt, greift der Turm an.', 'Tippe den Springer, dann d6.']),
        t('7k/8/8/8/3N4/8/8/B3K3 w - - 0 1', 'Zieh den Springer weg und gib Schach.', { t: 'check' }, ['Der Springer steht vor dem Läufer.', 'Der Läufer greift die lange Diagonale an.', 'Tippe den Springer, dann irgendein Feld.']),
      ] },
      { id: 'w8-l5', title: 'Das Krocket-Turnier', boss: true, card: { kind: 'knight', name: 'Das Krocket-Turnier' }, coach: 'cat', intro: 'Ein Turnier mit Flamingos als Schläger! Gabel, Fesselung und Abzug: zeig mir alle drei.', tasks: [
        t('8/8/1r1r4/8/2P5/8/8/8 w - - 0 1', 'Gabel: greif beide Türme an.', { t: 'to', sqs: ['c5'] }, ['Der Bauer schlägt schräg.', 'Von c5 greift er b6 und d6 an.', 'Tippe den Bauern, dann c5.']),
        t('4k3/4n3/8/8/8/8/8/4R3 w - - 0 1', 'Schlag die gefesselte Figur.', { t: 'capto', sq: 'e7' }, ['Der Springer steht zwischen Turm und König.', 'Er kann nicht ausweichen.', 'Tippe den Turm, dann e7.']),
        t('7k/8/8/8/3N4/8/8/B3K3 w - - 0 1', 'Abzug: zieh den Springer und gib Schach.', { t: 'check' }, ['Der Springer deckt die Diagonale.', 'Der Läufer greift an, sobald der Springer weg ist.', 'Tippe den Springer, dann irgendein Feld.']),
      ] },
    ],
  },
  {
    id: 'w9', name: 'Der Tränensee', coach: 'rabbit',
    lessons: [
      { id: 'w9-l1', title: 'Die Mitte besetzen', coach: 'rabbit', intro: 'Beim Wettlauf des Dodo gewinnt, wer gut startet. Regel 1: Die Mitte des Bretts gehört dir. Zieh einen Mittelbauern zwei Felder vor.', tasks: [
        t(START, 'Zieh den Königsbauern zwei Felder vor.', { t: 'to', sqs: ['e4'] }, ['Der Königsbauer steht auf e2.', 'Zwei Felder vor ist e4.', 'Tippe den Bauern, dann e4.']),
        t(START, 'Zieh den Damenbauern zwei Felder vor.', { t: 'to', sqs: ['d4'] }, ['Der Damenbauer steht auf d2.', 'Zwei Felder vor ist d4.', 'Tippe den Bauern, dann d4.']),
        t(START, 'Zieh einen Mittelbauern zwei Felder vor.', { t: 'to', sqs: ['e4', 'd4'] }, ['Die Mitte sind die Linien d und e.', 'Du hast zwei Möglichkeiten.', 'Tippe e2 oder d2, dann zwei Felder vor.']),
      ] },
      { id: 'w9-l2', title: 'Figuren entwickeln', coach: 'rabbit', intro: 'Regel 2: Hol die Springer und Läufer ins Spiel, bevor du mit der Dame loslegst. Figuren, die zu Hause bleiben, helfen nicht.', tasks: [
        t('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', 'Entwickle den Springer nach f3.', { t: 'to', sqs: ['f3'] }, ['Der Springer steht auf g1.', 'Ein Feld nach links, zwei nach oben.', 'Tippe den Springer, dann f3.']),
        t('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', 'Entwickle den Läufer nach c4.', { t: 'to', sqs: ['c4'] }, ['Der Läufer steht auf f1.', 'Der Weg ist frei, weil e2 leer ist.', 'Tippe den Läufer, dann c4.']),
        t('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', 'Entwickle den Springer nach c3.', { t: 'to', sqs: ['c3'] }, ['Der Springer steht auf b1.', 'Ein Feld nach rechts, zwei nach oben.', 'Tippe den Springer, dann c3.']),
      ] },
      { id: 'w9-l3', title: 'Rochieren', coach: 'rabbit', intro: 'Regel 3: Bring den König früh in Sicherheit. Mit der Rochade steht er hinter den Bauern und der Turm kommt ins Spiel.', tasks: [
        t('r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1', 'Rochiere kurz.', { t: 'to', sqs: ['g1'] }, ['Zwischen König und Turm ist alles frei.', 'Der König zieht zwei Felder zum Turm.', 'Tippe den König, dann g1.']),
        t('rnbqk2r/ppppbppp/5n2/4p3/4P3/3B1N2/PPPP1PPP/RNBQK2R w KQkq - 0 1', 'Rochiere kurz.', { t: 'to', sqs: ['g1'] }, ['Läufer und Springer sind schon entwickelt.', 'f1 und g1 sind frei.', 'Tippe den König, dann g1.']),
        t('r3kb1r/ppp2ppp/2n1bn2/3pp3/3PP3/2NBBN2/PPPQ1PPP/R3K2R w KQkq - 0 1', 'Rochiere lang.', { t: 'to', sqs: ['c1'] }, ['Zwischen König und Turm auf a1 ist alles frei.', 'Der König zieht zwei Felder nach links.', 'Tippe den König, dann c1.']),
      ] },
      { id: 'w9-l4', title: 'Drei einfache Aufbauten', coach: 'rabbit', intro: 'Nach 1. e4 e5 2. Sf3 Sc6 gibt es drei Klassiker. Jeder folgt den drei Regeln: Mitte, Entwicklung, Sicherheit.', tasks: [
        t('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', 'Der Italiener: Läufer nach c4.', { t: 'to', sqs: ['c4'] }, ['Der Läufer zielt auf den Punkt f7.', 'Er zieht von f1 schräg nach c4.', 'Tippe den Läufer, dann c4.']),
        t('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', 'Der Spanier: Läufer nach b5.', { t: 'to', sqs: ['b5'] }, ['Der Läufer greift den Springer an.', 'Er zieht von f1 schräg nach b5.', 'Tippe den Läufer, dann b5.']),
        t('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', 'Der Schotte: Bauer nach d4.', { t: 'to', sqs: ['d4'] }, ['Der Bauer öffnet die Mitte.', 'Er steht auf d2 und zieht zwei Felder.', 'Tippe den Bauern, dann d4.']),
      ] },
      { id: 'w9-l5', title: 'Der Dodo', boss: true, card: { kind: 'bishop', name: 'Der Dodo' }, coach: 'rabbit', intro: 'Auf die Plätze, fertig, los! Alle drei Regeln auf einmal: Mitte, Entwicklung, Sicherheit.', tasks: [
        t(START, 'Besetze die Mitte mit einem Bauern.', { t: 'to', sqs: ['e4', 'd4'] }, ['Die Mitte sind die Linien d und e.', 'Zwei Felder vor vom Startfeld.', 'Tippe e2 oder d2, dann zwei Felder vor.']),
        t('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', 'Entwickle den Springer nach f3.', { t: 'to', sqs: ['f3'] }, ['Der Springer steht auf g1.', 'Ein Feld nach links, zwei nach oben.', 'Tippe den Springer, dann f3.']),
        t('rnbqk2r/ppppbppp/5n2/4p3/4P3/3B1N2/PPPP1PPP/RNBQK2R w KQkq - 0 1', 'Bring den König in Sicherheit.', { t: 'to', sqs: ['g1'] }, ['Läufer und Springer sind entwickelt.', 'Rochiere kurz.', 'Tippe den König, dann g1.']),
      ] },
    ],
  },
  {
    id: 'w10', name: 'Die achte Reihe', coach: 'alice',
    lessons: [
      { id: 'w10-l1', title: 'Matt mit der Dame', coach: 'alice', intro: 'Fast geschafft! Auf der achten Reihe wartet das Finale. Zuerst brauchst du Matt mit Dame und König, dazu gehört meistens die Hilfe des eigenen Königs.', tasks: [
        t('5k2/8/5K2/8/8/8/8/Q7 w - - 0 1', 'Setze matt.', { t: 'mate' }, ['Dein König nimmt ihm e7, f7 und g7.', 'Die Dame muss die 8. Reihe angreifen.', 'Tippe die Dame, dann a8.']),
        t('k7/2K5/8/8/8/8/8/7Q w - - 0 1', 'Setze matt.', { t: 'mate' }, ['Dein König nimmt ihm b7 und b8.', 'Die Dame muss die Linie a angreifen.', 'Tippe die Dame, dann a1.']),
        t('7k/5K2/8/8/8/8/6Q1/8 w - - 0 1', 'Setze matt.', { t: 'mate' }, ['Dein König schützt das Feld g7.', 'Die Dame geht nach g7.', 'Tippe die Dame, dann g7.']),
      ] },
      { id: 'w10-l2', title: 'Matt mit dem Turm', coach: 'alice', intro: 'Auch ein Turm genügt, wenn der König hilft. Er sperrt dem gegnerischen König die Fluchtfelder.', tasks: [
        t('k7/8/1K6/8/8/8/8/7R w - - 0 1', 'Setze matt mit dem Turm.', { t: 'mate' }, ['Dein König nimmt ihm a7, b7 und b8.', 'Der Turm greift die 8. Reihe an.', 'Tippe den Turm, dann h8.']),
        t('7k/8/6K1/8/8/8/8/R7 w - - 0 1', 'Setze matt mit dem Turm.', { t: 'mate' }, ['Dein König nimmt ihm g7 und h7.', 'Der Turm greift die 8. Reihe an.', 'Tippe den Turm, dann a8.']),
        t('3k4/R7/3K4/8/8/8/8/8 w - - 0 1', 'Setze matt mit dem Turm.', { t: 'mate' }, ['Der Turm sperrt schon die 7. Reihe.', 'Der König nimmt ihm c7, d7 und e7.', 'Tippe den Turm, dann a8.']),
      ] },
      { id: 'w10-l3', title: 'Bauernrennen', coach: 'alice', intro: 'Erreicht ein Bauer die achte Reihe, wird er verwandelt, meistens in eine Dame. Wer als Erster ankommt, gewinnt oft die Partie.', tasks: [
        t('k7/7P/8/8/8/8/8/4K3 w - - 0 1', 'Verwandle den Bauern.', { t: 'to', sqs: ['h8'] }, ['Der Bauer steht auf h7, ein Feld vor dem Ziel.', 'Ein Feld vor ist h8.', 'Tippe den Bauern, dann h8, dann die Dame.']),
        t('8/8/8/8/8/8/4P3/4K2k w - - 0 1', 'Gewinne Zeit: zieh den Bauern zwei Felder.', { t: 'to', sqs: ['e4'] }, ['Er steht noch auf seinem Startfeld.', 'Zwei Felder vor ist e4.', 'Tippe den Bauern, dann e4.']),
        t('3r4/2P5/8/8/8/8/8/4K2k w - - 0 1', 'Schlag den Turm und verwandle dich.', { t: 'capto', sq: 'd8' }, ['Schräg vor c7 liegt d8.', 'Dort steht ein schwarzer Turm.', 'Tippe den Bauern, dann d8, dann die Dame.']),
      ] },
      { id: 'w10-l4', title: 'Matt in 1', coach: 'alice', intro: 'Noch ein Training für das Finale: Finde jedes Mal den einen Zug, der den König mattsetzt.', tasks: [
        t('6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', 'Setze matt.', { t: 'mate' }, ['Der schwarze König steckt hinter seinen Bauern.', 'Ein Turm auf der 8. Reihe genügt.', 'Tippe den Turm, dann d8.']),
        t('6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1', 'Setze matt.', { t: 'mate' }, ['Der König ist von eigenen Figuren eingesperrt.', 'Der Springer macht den letzten Schritt.', 'Tippe den Springer, dann f7.']),
        t('6k1/5ppp/8/8/8/8/8/3Q2K1 w - - 0 1', 'Setze matt.', { t: 'mate' }, ['Der König steckt hinter seinen Bauern.', 'Die Dame greift die 8. Reihe an.', 'Tippe die Dame, dann d8.']),
      ] },
      { id: 'w10-l5', title: 'Die Rote Königin', boss: true, card: { kind: 'rqueen', name: 'Die Rote Königin' }, coach: 'rqueen', intro: 'Kopf ab! Wenn du mich besiegen willst, brauchst du Matt, und zwar im richtigen Moment.', tasks: [
        t('1k6/8/1K6/8/8/8/8/7R w - - 0 1', 'Matt in 1.', { t: 'mate' }, ['Dein König nimmt ihm a7, b7 und c7.', 'Der Turm greift die 8. Reihe an.', 'Tippe den Turm, dann h8.']),
        t('kr6/pp6/8/1N6/8/8/8/1K6 w - - 0 1', 'Matt in 1.', { t: 'mate' }, ['Der König ist von eigenen Figuren eingesperrt.', 'Der Springer macht den letzten Schritt.', 'Tippe den Springer, dann c7.']),
        t('7k/5K2/8/8/8/8/6Q1/8 w - - 0 1', 'Matt in 1.', { t: 'mate' }, ['Dein König schützt das Feld g7.', 'Die Dame geht nach g7.', 'Tippe die Dame, dann g7.']),
      ] },
    ],
  },
];
