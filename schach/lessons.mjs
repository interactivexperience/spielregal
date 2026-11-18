// Spiegelschach – Lektionen (Daten). Läuft im Browser (eingebettet) und in Node (Test: test/schach-lessons.mjs).
// Alle Stellungen: Weiß am Zug, oft ohne König (Sandbox der Engine). goal:
//   { t:'tap', sqs:[…] }   ein Feld antippen   · { t:'to', sqs:[…] } mit einer Figur auf eines dieser Felder ziehen
//   { t:'mate' }           ein Zug, der Schachmatt setzt · { t:'check' } ein Zug, der Schach bietet
//   optional pc:'n' (Figurenart, die ziehen muss) bei to/capto
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
const mate1 = (fen, who, to) => t(fen, 'Matt in 1.', { t: 'mate' }, ['Der schwarze König hat kaum Fluchtfelder.', 'Dein König nimmt ihm Felder weg, die Figur muss das Schach geben.', `Tippe ${who}, dann ${to}.`]);


// Figurenkunde: jede Figur mit Beispielstellung (die Züge der Figur auf dem Feld sq werden gezeigt) und ihren Schritten.
export const PIECES = {
  pawn: { name: 'Bauer', icon: 'pawn', fen: '8/8/8/8/8/3p4/4P3/8 w - - 0 1', sq: 'e2', poem: ['Ein Schritt nach vorn, nie rückwärts, nein,', 'vom Start darf’s auch ein Doppelschritt sein.', 'Er schlägt nur schräg, nie geradeaus,', 'und ganz am Ende wird er zur Dame. Applaus!'], wert: '1', steps: ['Er geht ein Feld nach vorn, nie zurück.', 'Vom Startfeld aus darf er einmalig zwei Felder gehen.', 'Er schlägt schräg nach vorn (roter Ring), geradeaus darf er nicht schlagen.', 'Erreicht er die letzte Reihe, wird er verwandelt, meist in eine Dame.'] },
  rook: { name: 'Turm', icon: 'rook', fen: '8/3p4/8/8/1P1R4/8/8/8 w - - 0 1', sq: 'd4', poem: ['Der Turm geht gerade, weit und frei,', 'nach vorn, zurück, links, rechts dabei.', 'Den Gegner schlägt er, nimmt sein Haus,', 'vor eigenen Freunden ist es aus.'], wert: '5', steps: ['Er zieht gerade: vor, zurück, nach links und nach rechts.', 'So weit er will, bis etwas im Weg steht.', 'Einen Gegner schlägt er (roter Ring), an eigenen Figuren kommt er nicht vorbei.', 'Wert: 5.'] },
  bishop: { name: 'Läufer', icon: 'bishop', fen: '8/6p1/8/8/3B4/8/1P6/8 w - - 0 1', sq: 'd4', poem: ['Der Läufer geht auf schrägen Wegen,', 'so weit er kann, den Gegnern entgegen.', 'Er bleibt der Farbe seines Feldes treu', 'und schlägt nur schräg, ganz ohne Scheu.'], wert: '3', steps: ['Er zieht schräg in alle vier Richtungen.', 'So weit er will, bis etwas im Weg steht.', 'Er bleibt immer auf der Farbe seines Startfelds.', 'Einen Gegner schlägt er schräg (roter Ring). Wert: 3.'] },
  knight: { name: 'Springer', icon: 'knight', fen: '8/8/4p3/3P4/3N4/8/8/8 w - - 0 1', sq: 'd4', poem: ['Zwei Schritte gerade, einer zur Seite,', 'so springt das Pferd in die Weite.', 'Es hüpft als Einziges über alle hinweg', 'und schlägt, wo es landet. Das ist sein Zweck.'], wert: '3', steps: ['Er springt im L: zwei Felder gerade und eines zur Seite.', 'Er ist die einzige Figur, die über andere hinwegspringt.', 'Er schlägt auf dem Feld, auf dem er landet (roter Ring).', 'Wert: 3.'] },
  queen: { name: 'Dame', icon: 'queen', fen: '8/3p4/8/8/3Q4/8/1P6/8 w - - 0 1', sq: 'd4', poem: ['Die Dame zieht wie Turm und Läufer zugleich,', 'gerade und schräg durch das ganze Reich.', 'In acht Richtungen, so weit sie mag,', 'und schlägt, was im Weg steht, auf einen Schlag.'], wert: '9', steps: ['Sie zieht gerade wie ein Turm.', 'Sie zieht schräg wie ein Läufer.', 'Also in alle acht Richtungen, so weit sie will, bis etwas im Weg steht.', 'Sie schlägt, wie sie zieht (roter Ring). Wert: 9, die stärkste Figur.'] },
  king: { name: 'König', icon: 'king', fen: '8/8/8/8/4K3/5p2/8/8 w - - 0 1', sq: 'e4', poem: ['Ein Feld nur zieht der König weit,', 'gerade, schräg, zu jeder Zeit.', 'Ins Schach darf er nie freiwillig gehen,', 'und Matt heißt: Er kann nicht mehr entgehen.'], wert: 'unbezahlbar', steps: ['Er zieht ein Feld in jede Richtung, gerade und schräg.', 'Er darf nie auf ein Feld ziehen, das ein Gegner bedroht.', 'Wird er bedroht, heißt das Schach. Kann er nicht entkommen, ist es Schachmatt.', 'Er ist die wichtigste Figur und hat keinen Wert, denn ohne ihn endet die Partie.'] },
};

export const WORLDS = [
  {
    id: 'w1', name: 'Hinter dem Spiegel', coach: 'rabbit',
    lessons: [
      { id: 'w1-l1', title: 'Das Brett', coach: 'rabbit', intro: 'Oh je, ich bin spät dran! Hinter dem Spiegel ist alles ein Brett. Jedes Feld hat einen Namen aus Buchstabe und Zahl, zum Beispiel e4.', tasks: [
        t(EMPTY, 'Tippe das Feld e4.', { t: 'tap', sqs: ['e4'] }, ['Der Buchstabe steht unten am Brett: e ist die fünfte Spalte.', 'Die Zahl steht links: 4 ist die vierte Reihe von unten.', 'Gesucht: fünfte Spalte, vierte Reihe.']),
      ] },
      { id: 'w1-l2', title: 'Reihen und Linien', coach: 'rabbit', intro: 'Waagerecht heißen die Felder Reihen (1 bis 8), senkrecht Linien (a bis h). Alles auf einer Linie gehört zusammen.', tasks: [
        t(EMPTY, 'Tippe irgendein Feld auf der Linie e.', { t: 'tap', sqs: file('e') }, ['Eine Linie läuft von unten nach oben.', 'Alle Felder der Linie e beginnen mit e.', 'Zum Beispiel e1, e2 oder e5.']),
      ] },
      { id: 'w1-l3', title: 'Die Aufstellung', coach: 'rabbit', intro: 'So steht das Heer am Anfang: vorn die Bauern, dahinter die Offiziere. Weiß steht unten, Schwarz oben.', tasks: [
        t(START, 'Tippe den weißen König.', { t: 'tap', sqs: ['e1'] }, ['Der König trägt ein Kreuz auf der Krone.', 'Er steht in der Mitte der hintersten weißen Reihe.', 'Gesucht: e1.']),
      ] },
      { id: 'w1-l4', title: 'Ziehen und Schlagen', coach: 'rabbit', intro: 'Jetzt wird gezogen! Tippe erst die Figur, dann ein Feld. Steht dort ein Gegner, schlägst du ihn und nimmst ihn vom Brett.', tasks: [
        t('8/8/8/8/8/8/8/R7 w - - 0 1', 'Zieh den Turm nach a5.', { t: 'to', sqs: ['a5'] }, ['Der Turm zieht gerade, so weit er will.', 'a5 liegt auf seiner Linie, nach oben.', 'Tippe den Turm, dann a5.']),
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
      { id: 'w2-l1', piece: 'pawn', title: 'Ein Schritt vor', coach: 'rabbit', intro: 'Im Garten gehen die Bauern geradeaus: ein Feld pro Zug, immer nach vorn, nie zurück.', tasks: [
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
      { id: 'w3-l1', piece: 'rook', title: 'Gerade Wege', coach: 'rabbit', intro: 'Im Kartenschloss steht der Turm Wache. Er läuft nur gerade: vor, zurück, nach links und nach rechts, so weit er will.', tasks: [
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
      { id: 'w4-l1', piece: 'bishop', title: 'Schräge Wege', coach: 'cat', intro: 'Im Wald ohne Namen gibt es keine geraden Wege, nur schräge. Der Läufer wandert auf den Diagonalen, so weit er will.', tasks: [
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
      { id: 'w5-l1', piece: 'knight', title: 'Der L-Sprung', coach: 'wknight', intro: 'Hoppla, schon wieder runtergefallen! Der Springer zieht in einem L: zwei Felder gerade und eines zur Seite.', tasks: [
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
      { id: 'w6-l1', piece: 'queen', title: 'Die mächtige Dame', coach: 'rqueen', intro: 'Hier muss man rennen, um am selben Ort zu bleiben! Die Dame ist die stärkste Figur: Sie zieht wie Turm und Läufer zusammen.', tasks: [
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
      { id: 'w7-l1', piece: 'king', title: 'Der König', coach: 'king', intro: 'Pssst! Der König schläft. Er ist die wichtigste Figur, aber er zieht nur ein einziges Feld, in jede Richtung.', tasks: [
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
        t('7k/8/6K1/8/8/8/Q7/8 w - - 0 1', 'Setze matt mit Dame und König.', { t: 'mate' }, ['Dein König nimmt ihm g7 und h7.', 'Die Dame muss die 8. Reihe angreifen.', 'Tippe die Dame, dann a8.']),
        t('7k/R7/8/8/8/8/8/1R2K3 w - - 0 1', 'Setze matt mit zwei Türmen.', { t: 'mate' }, ['Der Turm auf a7 sperrt die 7. Reihe.', 'Der andere Turm muss die 8. Reihe angreifen.', 'Tippe den Turm auf b1, dann b8.']),
      ] },
      { id: 'w7-l4', title: 'Rochade und en passant', coach: 'king', intro: 'Zwei Sonderzüge! Bei der Rochade zieht der König zwei Felder zum Turm hin und der Turm springt auf die andere Seite. En passant ist ein besonderer Schlag des Bauern.', tasks: [
        t('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'Rochiere kurz: der König zieht nach g1.', { t: 'to', sqs: ['g1'] }, ['Der König zieht zwei Felder zum Turm hin.', 'Der Turm springt dann auf f1.', 'Tippe den König, dann g1.']),
        t('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'Rochiere lang: der König zieht nach c1.', { t: 'to', sqs: ['c1'] }, ['Der König zieht zwei Felder nach links.', 'Der Turm springt dann auf d1.', 'Tippe den König, dann c1.']),
        t('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', 'Schlag den Bauern d5 im Vorbeigehen (en passant).', { t: 'to', sqs: ['d6'] }, ['Der schwarze Bauer ist gerade zwei Felder gezogen.', 'Dein Bauer schlägt ihn, als wäre er nur eines gezogen.', 'Tippe den Bauern auf e5, dann d6.']),
      ] },
      { id: 'w7-l5', title: 'Matt in 1', boss: true, card: { kind: 'king', name: 'Der schlafende König' }, coach: 'king', intro: 'Weck ihn nicht, aber setz ihn matt! Aufgepasst: Ein falscher Zug kann auch ein Patt sein, dann ist es unentschieden.', tasks: [
        t('7k/5K2/8/8/8/8/8/6Q1 w - - 0 1', 'Matt in 1. Vorsicht vor Patt!', { t: 'mate' }, ['Dame nach g6 wäre ein Patt, der König hätte keinen Zug.', 'Die Dame muss geschützt sein.', 'Tippe die Dame, dann g7.']),
        t('k7/8/1K6/8/8/8/7Q/8 w - - 0 1', 'Matt in 1. Vorsicht vor Patt!', { t: 'mate' }, ['Dame nach c7 wäre ein Patt.', 'Die Dame muss die 8. Reihe angreifen.', 'Tippe die Dame, dann h8.']),
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
        t('k7/2K5/8/8/8/8/7Q/8 w - - 0 1', 'Setze matt.', { t: 'mate' }, ['Dein König nimmt ihm b7 und b8.', 'Die Dame muss die Linie a angreifen.', 'Tippe die Dame, dann a2.']),
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
  {
    id: 'w11', name: 'Die Teegesellschaft', coach: 'rabbit',
    lessons: [
      { id: 'w11-l1', title: 'Die Mitte besetzen', coach: 'rabbit', intro: 'Beim Hutmacher ist es immer sechs Uhr: Wer Zeit verliert, verliert Tempo. Im Zentrum stehen die Figuren am besten, also fang dort an.', tasks: [
        t(START, 'Besetze die Mitte mit einem Bauern.', { t: 'to', sqs: ['e4', 'd4'], pc: 'p' }, ['Die Mitte sind die Linien d und e.', 'Zwei Felder vor vom Startfeld.', 'Tippe e2 oder d2, dann zwei Felder vor.']),
        t('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', 'Greif die Mitte mit dem Springer an.', { t: 'to', sqs: ['f3'], pc: 'n' }, ['Der Springer von g1 greift e5 an.', 'Ein Feld nach links, zwei nach oben.', 'Tippe den Springer, dann f3.']),
        t('rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 2', 'Greif das schwarze Zentrum mit dem c-Bauern an.', { t: 'to', sqs: ['c4'], pc: 'p' }, ['Der Bauer c4 greift den Bauern d5 an.', 'Er steht auf c2 und zieht zwei Felder.', 'Tippe den Bauern, dann c4.']),
      ] },
      { id: 'w11-l2', title: 'Zeit gewinnen', coach: 'rabbit', intro: 'Jeder Zug, der eine neue Figur ins Spiel bringt, gewinnt Zeit. Wer eine Figur zweimal zieht, verschenkt einen Zug.', tasks: [
        t('r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', 'Entwickle die letzte Leichtfigur.', { t: 'to', sqs: ['c3'], pc: 'n' }, ['Der Springer b1 steht noch zu Hause.', 'Ein Feld nach rechts, zwei nach oben.', 'Tippe den Springer, dann c3.']),
        t('rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', 'Entwickle den Läufer aktiv.', { t: 'to', sqs: ['c4', 'b5'], pc: 'b' }, ['Der Läufer f1 ist noch nicht im Spiel.', 'c4 und b5 sind aktive Felder.', 'Tippe den Läufer, dann c4 oder b5.']),
        t('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', 'Entwickle einen Springer, statt die Dame zu ziehen.', { t: 'to', sqs: ['f3', 'c3'], pc: 'n' }, ['Die Dame bleibt vorerst zu Hause.', 'Springer ziehen im L.', 'Tippe einen Springer, dann f3 oder c3.']),
      ] },
      { id: 'w11-l3', title: 'Früh rochieren', coach: 'rabbit', intro: 'Wer früh rochiert, bringt den König in Sicherheit und den Turm ins Spiel. Prüfe vorher, ob alle Felder dazwischen frei sind.', tasks: [
        t('r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', 'Rochiere kurz.', { t: 'to', sqs: ['g1'], pc: 'k' }, ['Zwischen König und Turm ist alles frei.', 'Der König zieht zwei Felder zum Turm.', 'Tippe den König, dann g1.']),
        t('rnbqk2r/ppppbppp/5n2/4p3/4P3/3B1N2/PPPP1PPP/RNBQK2R w KQkq - 0 1', 'Rochiere kurz.', { t: 'to', sqs: ['g1'], pc: 'k' }, ['Läufer und Springer sind entwickelt.', 'f1 und g1 sind frei.', 'Tippe den König, dann g1.']),
        t('r3kb1r/ppp2ppp/2n1bn2/3pp3/3PP3/2NBBN2/PPPQ1PPP/R3K2R w KQkq - 0 1', 'Rochiere, wie du magst.', { t: 'to', sqs: ['c1', 'g1'], pc: 'k' }, ['Beide Rochaden sind möglich.', 'Der König zieht zwei Felder zu einem Turm.', 'Tippe den König, dann c1 oder g1.']),
      ] },
      { id: 'w11-l4', title: 'Die Dame bleibt zu Hause', coach: 'rabbit', intro: 'Wer die Dame früh herausholt, wird von den kleinen Figuren gejagt. Erst Springer und Läufer, dann die Dame.', tasks: [
        t('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', 'Entwickle mit dem Springer statt mit der Dame.', { t: 'to', sqs: ['c3', 'f3'], pc: 'n' }, ['Die Dame bleibt am besten noch zu Hause.', 'Springer ziehen im L.', 'Tippe einen Springer, dann c3 oder f3.']),
        t('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', 'Dritter Zug: der Läufer kommt heraus.', { t: 'to', sqs: ['c4', 'b5'], pc: 'b' }, ['Der Läufer f1 hat freie Diagonalen.', 'c4 und b5 sind starke Felder.', 'Tippe den Läufer, dann c4 oder b5.']),
        t('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', 'Öffne die Mitte mit dem d-Bauern.', { t: 'to', sqs: ['d4'], pc: 'p' }, ['Der Bauer d2 darf zwei Felder.', 'So öffnet sich das Zentrum für deine Figuren.', 'Tippe den Bauern, dann d4.']),
      ] },
      { id: 'w11-l5', title: 'Der Hutmacher', boss: true, card: { kind: 'rook', name: 'Der Hutmacher' }, coach: 'rabbit', intro: 'Es ist sechs Uhr, immer sechs Uhr! Zeig, dass du Zeit nicht verschwendest.', tasks: [
        t(START, 'Besetze die Mitte.', { t: 'to', sqs: ['e4', 'd4'], pc: 'p' }, ['Zwei Felder vor mit einem Mittelbauern.', 'Die Linien d und e.', 'Tippe e2 oder d2, dann zwei Felder vor.']),
        t('r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', 'Entwickle die letzte Leichtfigur.', { t: 'to', sqs: ['c3'], pc: 'n' }, ['Der Springer b1 steht noch zu Hause.', 'Ein Feld nach rechts, zwei nach oben.', 'Tippe den Springer, dann c3.']),
        t('rnbqk2r/ppppbppp/5n2/4p3/4P3/3B1N2/PPPP1PPP/RNBQK2R w KQkq - 0 1', 'Bring den König in Sicherheit.', { t: 'to', sqs: ['g1'], pc: 'k' }, ['Läufer und Springer sind entwickelt.', 'Rochiere kurz.', 'Tippe den König, dann g1.']),
      ] },
    ],
  },
  {
    id: 'w12', name: 'Die Raupe auf dem Pilz', coach: 'cat',
    lessons: [
      { id: 'w12-l1', title: 'Das Läuferpaar', coach: 'cat', intro: 'Wer dich ansieht, fragt: Wer bist du? Zwei Läufer auf offenen Diagonalen sind eine starke Waffe. Tausch lieber Springer als Läufer ab.', tasks: [
        t('4k3/8/8/3n4/8/2N5/8/2B1KB2 w - - 0 1', 'Tausche mit dem Springer, behalte beide Läufer.', { t: 'capto', sq: 'd5', pc: 'n' }, ['Der schwarze Springer steht auf d5.', 'Dein Springer c3 kann ihn schlagen.', 'Tippe den Springer, dann d5.']),
        t('4k3/8/8/8/3n4/5N2/8/2B1KB2 w - - 0 1', 'Tausche mit dem Springer, behalte beide Läufer.', { t: 'capto', sq: 'd4', pc: 'n' }, ['Der schwarze Springer steht auf d4.', 'Dein Springer f3 kann ihn schlagen.', 'Tippe den Springer, dann d4.']),
        t('4k3/8/8/8/8/8/8/2B1KB2 w - - 0 1', 'Stell einen Läufer auf die lange Diagonale.', { t: 'to', sqs: ['b2'], pc: 'b' }, ['Die lange Diagonale läuft von a1 nach h8.', 'Der Läufer c1 kommt nach b2.', 'Tippe den Läufer, dann b2.']),
      ] },
      { id: 'w12-l2', title: 'Springer-Vorposten', coach: 'cat', intro: 'Ein Vorposten ist ein Feld tief im gegnerischen Gebiet, das kein feindlicher Bauer angreifen kann. Dort steht ein Springer unverwundbar.', tasks: [
        t('4k3/pp3ppp/8/8/4P3/2N5/PPP2PPP/4K3 w - - 0 1', 'Stell den Springer auf den Vorposten d5.', { t: 'to', sqs: ['d5'], pc: 'n' }, ['Schwarz hat keinen c- oder e-Bauern mehr.', 'Der Springer c3 springt nach d5.', 'Tippe den Springer, dann d5.']),
        t('4k3/pp3ppp/8/8/3P4/5N2/PPP2PPP/4K3 w - - 0 1', 'Stell den Springer auf den Vorposten e5.', { t: 'to', sqs: ['e5'], pc: 'n' }, ['Schwarz hat keinen d- oder f-Bauern mehr.', 'Der Springer f3 springt nach e5.', 'Tippe den Springer, dann e5.']),
        t('4k3/pp1p2pp/8/8/4P3/4N3/PPP2PPP/4K3 w - - 0 1', 'Stell den Springer auf den Vorposten f5.', { t: 'to', sqs: ['f5'], pc: 'n' }, ['Kein schwarzer Bauer kann f5 angreifen.', 'Der Springer e3 springt nach f5.', 'Tippe den Springer, dann f5.']),
      ] },
      { id: 'w12-l3', title: 'Türme auf offene Linien', coach: 'cat', intro: 'Türme brauchen offene Linien, auf denen kein Bauer steht. Dort haben sie freie Bahn bis in das gegnerische Lager.', tasks: [
        t('4k3/pp3ppp/8/8/8/8/PP3PPP/R5K1 w - - 0 1', 'Zieh den Turm auf eine offene Linie.', { t: 'to', sqs: ['c1', 'd1', 'e1'], pc: 'r' }, ['Die Linien c, d und e sind offen.', 'Dort stehen keine Bauern.', 'Tippe den Turm, dann c1, d1 oder e1.']),
        t('3k4/pp3ppp/8/8/8/8/PP3PPP/4RRK1 w - - 0 1', 'Zieh den Turm auf die 7. Reihe.', { t: 'to', sqs: ['e7'], pc: 'r' }, ['Die Linie e ist offen.', 'Die 7. Reihe ist die zweite von oben.', 'Tippe den Turm auf e1, dann e7.']),
        t('4r3/pp3ppp/8/8/8/8/PP3PPP/4R1K1 w - - 0 1', 'Tausche die Türme auf der offenen Linie.', { t: 'capto', sq: 'e8', pc: 'r' }, ['Beide Türme stehen auf der Linie e.', 'Der Weg ist frei.', 'Tippe den Turm, dann e8.']),
      ] },
      { id: 'w12-l4', title: 'Mit der richtigen Figur schlagen', coach: 'cat', intro: 'Wer ist hier der Beste für den Schlag? Meistens ist es die Figur mit dem geringsten Wert, damit du nichts Wertvolles riskierst.', tasks: [
        t('4k3/8/8/3p4/8/2N5/8/3QK3 w - - 0 1', 'Schlag den Bauern mit dem Springer, nicht mit der Dame.', { t: 'capto', sq: 'd5', pc: 'n' }, ['Der Bauer steht auf d5.', 'Dein Springer c3 greift d5 an.', 'Tippe den Springer, dann d5.']),
        t('4k3/8/5p2/8/8/2B5/8/3QK3 w - - 0 1', 'Schlag den Bauern mit dem Läufer.', { t: 'capto', sq: 'f6', pc: 'b' }, ['Der Bauer steht auf f6.', 'Dein Läufer c3 greift ihn auf der Diagonale an.', 'Tippe den Läufer, dann f6.']),
        t('4k3/p7/8/8/8/8/R7/Q3K3 w - - 0 1', 'Schlag den Bauern mit dem Turm.', { t: 'capto', sq: 'a7', pc: 'r' }, ['Der Bauer steht auf a7.', 'Dein Turm a2 greift die Linie hinauf an.', 'Tippe den Turm, dann a7.']),
      ] },
      { id: 'w12-l5', title: 'Die Raupe', boss: true, card: { kind: 'bishop', name: 'Die Raupe' }, coach: 'cat', intro: 'Wer … bist … du? Zeig der Raupe, dass jede deiner Figuren ihre Rolle kennt.', tasks: [
        t('4k3/pp3ppp/8/8/4P3/2N5/PPP2PPP/4K3 w - - 0 1', 'Springer auf den Vorposten.', { t: 'to', sqs: ['d5'], pc: 'n' }, ['Schwarz hat keinen c- oder e-Bauern mehr.', 'Der Springer c3 springt nach d5.', 'Tippe den Springer, dann d5.']),
        t('4k3/pp3ppp/8/8/8/8/PP3PPP/R5K1 w - - 0 1', 'Turm auf eine offene Linie.', { t: 'to', sqs: ['c1', 'd1', 'e1'], pc: 'r' }, ['Die Linien c, d und e sind offen.', 'Dort stehen keine Bauern.', 'Tippe den Turm, dann c1, d1 oder e1.']),
        t('4k3/8/8/3n4/8/2N5/8/2B1KB2 w - - 0 1', 'Tausche mit dem Springer, behalte beide Läufer.', { t: 'capto', sq: 'd5', pc: 'n' }, ['Der schwarze Springer steht auf d5.', 'Dein Springer c3 kann ihn schlagen.', 'Tippe den Springer, dann d5.']),
      ] },
    ],
  },
  {
    id: 'w13', name: 'Der Rosengarten', coach: 'alice',
    lessons: [
      { id: 'w13-l1', title: 'Bauernketten', coach: 'alice', intro: 'Rote Rosen, weiße Rosen, nichts darf verrutschen! Bauern, die sich gegenseitig decken, bilden eine Kette. Angreifen muss man ihren Fuß.', tasks: [
        t('4k3/8/4p3/3p4/8/8/8/3RK3 w - - 0 1', 'Schlag den Fuß der Kette.', { t: 'capto', sq: 'd5', pc: 'r' }, ['Die Kette läuft von e6 nach d5.', 'Der Bauer d5 ist der Fuß.', 'Tippe den Turm, dann d5.']),
        t('4k3/8/8/8/3P4/8/4P3/4K3 w - - 0 1', 'Stütze deinen Bauern d4 mit einem anderen Bauern.', { t: 'to', sqs: ['e3'], pc: 'p' }, ['Ein Bauer deckt schräg hinter sich.', 'e3 deckt d4.', 'Tippe den Bauern e2, dann e3.']),
        t('4k3/8/8/8/4P3/8/3P4/4K3 w - - 0 1', 'Stütze deinen Bauern e4 mit einem anderen Bauern.', { t: 'to', sqs: ['d3'], pc: 'p' }, ['Ein Bauer deckt schräg hinter sich.', 'd3 deckt e4.', 'Tippe den Bauern d2, dann d3.']),
      ] },
      { id: 'w13-l2', title: 'Freibauern', coach: 'alice', intro: 'Ein Freibauer hat auf seiner Linie und den Nachbarlinien keinen Gegner vor sich. Niemand kann ihn aufhalten, außer den Figuren.', tasks: [
        t('4k3/p4ppp/8/3P4/8/8/P4PPP/4K3 w - - 0 1', 'Tippe den Freibauern.', { t: 'tap', sqs: ['d5'] }, ['Der Freibauer hat keinen Gegner auf c, d oder e.', 'Er steht in der Mitte des Bretts.', 'Gesucht: d5.']),
        t('4k3/pp3ppp/8/8/3P4/8/PP3PPP/4K3 w - - 0 1', 'Tippe den Freibauern.', { t: 'tap', sqs: ['d4'] }, ['Schwarz hat keinen c-, d- oder e-Bauern.', 'Er steht in der Mitte.', 'Gesucht: d4.']),
        t('4k3/pp3ppp/8/3P4/8/8/PP3PPP/4K3 w - - 0 1', 'Schick den Freibauern voran.', { t: 'to', sqs: ['d6'], pc: 'p' }, ['Er steht auf d5.', 'Ein Feld vor ist d6.', 'Tippe den Bauern, dann d6.']),
      ] },
      { id: 'w13-l3', title: 'Doppel- und Randbauern', coach: 'alice', intro: 'Zwei Bauern auf einer Linie behindern sich: ein Doppelbauer. Ein Randbauer hat nur einen Nachbarn und ist schwächer. Isolierte Bauern haben gar keinen.', tasks: [
        t('4k3/8/8/8/8/4P3/4P3/4K3 w - - 0 1', 'Tippe einen der Doppelbauern.', { t: 'tap', sqs: ['e2', 'e3'] }, ['Doppelbauern stehen auf derselben Linie.', 'Beide auf der Linie e.', 'Gesucht: e2 oder e3.']),
        t('4k3/8/8/8/8/8/P1P5/4K3 w - - 0 1', 'Tippe den Randbauern.', { t: 'tap', sqs: ['a2'] }, ['Der Randbauer steht am Rand des Bretts.', 'Er steht auf der Linie a.', 'Gesucht: a2.']),
        t('4k3/8/8/8/8/8/P1P2P2/4K3 w - - 0 1', 'Tippe einen isolierten Bauern.', { t: 'tap', sqs: ['a2', 'c2', 'f2'] }, ['Isolierte Bauern haben keinen Nachbarn auf den Nebenlinien.', 'Keine Bauern auf b, d oder e daneben.', 'Gesucht: a2, c2 oder f2.']),
      ] },
      { id: 'w13-l4', title: 'Umwandlung und en passant', coach: 'alice', intro: 'Bauern sind wertvoller, als sie aussehen: Auf der achten Reihe werden sie zur Dame. Der Schlag en passant gehört auch zu ihren Tricks.', tasks: [
        t('4k3/P7/8/8/8/8/8/4K3 w - - 0 1', 'Verwandle den Bauern.', { t: 'to', sqs: ['a8'], pc: 'p' }, ['Er steht auf a7, ein Feld vor dem Ziel.', 'Ein Feld vor ist a8.', 'Tippe den Bauern, dann a8, dann die Dame.']),
        t('1r2k3/P7/8/8/8/8/8/4K3 w - - 0 1', 'Schlag den Turm und verwandle dich.', { t: 'capto', sq: 'b8', pc: 'p' }, ['Schräg vor a7 liegt b8.', 'Dort steht ein schwarzer Turm.', 'Tippe den Bauern, dann b8.']),
        t('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', 'Schlag den Bauern d5 im Vorbeigehen.', { t: 'to', sqs: ['d6'], pc: 'p' }, ['Der schwarze Bauer ist gerade zwei Felder gezogen.', 'Dein Bauer schlägt ihn, als wäre er nur eines gezogen.', 'Tippe den Bauern e5, dann d6.']),
      ] },
      { id: 'w13-l5', title: 'Der Gärtner', boss: true, card: { kind: 'pawn', name: 'Der Gärtner' }, coach: 'alice', intro: 'Wer pflegt die Rosen am besten? Zeig dem Gärtner, dass du Bauern verstehst.', tasks: [
        t('4k3/p4ppp/8/3P4/8/8/P4PPP/4K3 w - - 0 1', 'Tippe den Freibauern.', { t: 'tap', sqs: ['d5'] }, ['Der Freibauer hat keinen Gegner auf c, d oder e.', 'Er steht in der Mitte des Bretts.', 'Gesucht: d5.']),
        t('4k3/8/8/8/3P4/8/4P3/4K3 w - - 0 1', 'Stütze den Bauern d4.', { t: 'to', sqs: ['e3'], pc: 'p' }, ['Ein Bauer deckt schräg hinter sich.', 'e3 deckt d4.', 'Tippe den Bauern e2, dann e3.']),
        t('1r2k3/P7/8/8/8/8/8/4K3 w - - 0 1', 'Schlag den Turm und verwandle dich.', { t: 'capto', sq: 'b8', pc: 'p' }, ['Schräg vor a7 liegt b8.', 'Dort steht ein schwarzer Turm.', 'Tippe den Bauern, dann b8.']),
      ] },
    ],
  },
  {
    id: 'w14', name: 'Der Gerichtssaal', coach: 'rqueen',
    lessons: [
      { id: 'w14-l1', title: 'Wer greift an?', coach: 'rqueen', intro: 'Kopf ab! Die Herzkönigin hasst unsichere Könige. Bevor du etwas tust, schau: Wer bedroht meinen König?', tasks: [
        t('4k3/8/8/8/8/8/8/r3K3 w - - 0 1', 'Tippe die Figur, die deinen König angreift.', { t: 'tap', sqs: ['a1'] }, ['Dein König steht auf e1.', 'Die Figur steht in derselben Reihe.', 'Gesucht: a1.']),
        t('4k3/8/8/8/8/6b1/8/4K3 w - - 0 1', 'Tippe die Figur, die deinen König angreift.', { t: 'tap', sqs: ['g3'] }, ['Dein König steht auf e1.', 'Die Figur greift schräg an.', 'Gesucht: g3.']),
        t('4k3/8/8/8/8/3n4/8/4K3 w - - 0 1', 'Tippe die Figur, die deinen König angreift.', { t: 'tap', sqs: ['d3'] }, ['Dein König steht auf e1.', 'Die Figur springt im L.', 'Gesucht: d3.']),
      ] },
      { id: 'w14-l2', title: 'Den König retten', coach: 'rqueen', intro: 'Es gibt drei Wege aus dem Schach: ausweichen, den Angreifer schlagen oder dazwischenstellen. Such den richtigen.', tasks: [
        t('4k3/8/8/8/8/8/8/r3K3 w - - 0 1', 'Weich aus: zieh den König aus der Reihe 1.', { t: 'to', sqs: ['d2', 'e2', 'f2'], pc: 'k' }, ['Der Turm beherrscht die ganze Reihe 1.', 'Geh eine Reihe höher.', 'Tippe den König, dann d2, e2 oder f2.']),
        t('4k3/8/8/8/8/8/4r3/4K3 w - - 0 1', 'Schlag den angreifenden Turm.', { t: 'capto', sq: 'e2', pc: 'k' }, ['Der Turm steht direkt neben deinem König.', 'Er ist ungedeckt.', 'Tippe den König, dann e2.']),
        t('4k3/8/8/8/8/3R4/8/r3K3 w - - 0 1', 'Stell den Turm dazwischen.', { t: 'to', sqs: ['b1', 'c1', 'd1'], pc: 'r' }, ['Zwischen Turm a1 und König e1 sind drei Felder.', 'Dein Turm d3 kann auf d1 ziehen.', 'Tippe den Turm, dann d1.']),
      ] },
      { id: 'w14-l3', title: 'Luft für den König', coach: 'rqueen', intro: 'Ein König hinter drei Bauern kann ersticken. Schaffe ihm Luft mit einem Bauernzug, damit die Grundreihe nicht zur Falle wird.', tasks: [
        t('6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', 'Schaffe Luft für deinen König.', { t: 'to', sqs: ['h3', 'g3', 'f3'], pc: 'p' }, ['Dein König ist hinter drei Bauern eingesperrt.', 'Ein Bauer muss ein Feld nach vorn.', 'Tippe einen Bauern, dann h3, g3 oder f3.']),
        t('3r2k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1', 'Schaffe Luft, bevor der Turm kommt.', { t: 'to', sqs: ['h3', 'g3', 'f3'], pc: 'p' }, ['Schwarz kontrolliert die d-Linie.', 'Ohne Luft droht ein Grundreihenmatt.', 'Tippe einen Bauern, dann h3, g3 oder f3.']),
        t('6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1', 'Zeig die Schwäche: setze matt.', { t: 'mate' }, ['Der schwarze König ist eingesperrt.', 'Ein Turm auf der 8. Reihe genügt.', 'Tippe den Turm, dann a8.']),
      ] },
      { id: 'w14-l4', title: 'Sichere Felder', coach: 'rqueen', intro: 'Ein König darf nie auf ein angegriffenes Feld ziehen. Zähle nach, welche Felder die gegnerischen Figuren beherrschen.', tasks: [
        t('4k3/8/8/8/8/8/3r4/4K3 w - - 0 1', 'Zieh den König auf das sichere Feld in Reihe 1.', { t: 'to', sqs: ['f1'], pc: 'k' }, ['Der Turm d2 beherrscht die Reihe 2 und die Linie d.', 'd1 ist angegriffen, f1 nicht.', 'Tippe den König, dann f1.']),
        t('4k3/8/8/8/8/5q2/8/4K3 w - - 0 1', 'Zieh den König auf das einzige sichere Feld.', { t: 'to', sqs: ['d2'], pc: 'k' }, ['Die Dame f3 beherrscht e2, f2, d1 und f1.', 'Nur ein Nachbarfeld ist frei.', 'Tippe den König, dann d2.']),
        t('4k3/8/b7/8/8/8/8/4K3 w - - 0 1', 'Zieh den König auf ein sicheres Feld.', { t: 'to', sqs: ['d1', 'd2'], pc: 'k' }, ['Der Läufer a6 beherrscht die Diagonale a6 bis f1.', 'e2 und f1 sind angegriffen.', 'Tippe den König, dann d1 oder d2.']),
      ] },
      { id: 'w14-l5', title: 'Die Herzkönigin', boss: true, card: { kind: 'king', name: 'Die Herzkönigin' }, coach: 'rqueen', intro: 'Kopf ab! Wenn dein König sicher ist, darfst du bleiben. Zeig, wie du ihn schützt.', tasks: [
        t('4k3/8/8/8/8/6b1/8/4K3 w - - 0 1', 'Tippe die Figur, die deinen König angreift.', { t: 'tap', sqs: ['g3'] }, ['Dein König steht auf e1.', 'Die Figur greift schräg an.', 'Gesucht: g3.']),
        t('4k3/8/8/8/8/3R4/8/r3K3 w - - 0 1', 'Stell den Turm dazwischen.', { t: 'to', sqs: ['b1', 'c1', 'd1'], pc: 'r' }, ['Zwischen Turm a1 und König e1 sind drei Felder.', 'Dein Turm d3 kann auf d1 ziehen.', 'Tippe den Turm, dann d1.']),
        t('6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', 'Schaffe Luft für deinen König.', { t: 'to', sqs: ['h3', 'g3', 'f3'], pc: 'p' }, ['Dein König ist hinter drei Bauern eingesperrt.', 'Ein Bauer muss ein Feld nach vorn.', 'Tippe einen Bauern, dann h3, g3 oder f3.']),
      ] },
    ],
  },
  {
    id: 'w15', name: 'Das Heckenlabyrinth', coach: 'cat',
    lessons: [
      { id: 'w15-l1', title: 'Das Zentrum', coach: 'cat', intro: 'Im Labyrinth ist der Weg durch die Mitte am kürzesten. Figuren im Zentrum erreichen alle Ecken des Bretts.', tasks: [
        t('4k3/8/8/8/8/2N5/8/4K3 w - - 0 1', 'Stell den Springer ins Zentrum.', { t: 'to', sqs: ['e4', 'd5'], pc: 'n' }, ['Die Mitte sind die Felder d4, d5, e4 und e5.', 'Der Springer c3 erreicht zwei davon.', 'Tippe den Springer, dann e4 oder d5.']),
        t('4k3/8/8/8/8/8/1B6/4K3 w - - 0 1', 'Stell den Läufer ins Zentrum.', { t: 'to', sqs: ['e5', 'd4'], pc: 'b' }, ['Der Läufer b2 steht auf der langen Diagonale.', 'Er erreicht d4 und e5.', 'Tippe den Läufer, dann e5 oder d4.']),
        t('4k3/8/8/8/8/8/8/3QK3 w - - 0 1', 'Stell die Dame ins Zentrum.', { t: 'to', sqs: ['d4', 'd5'], pc: 'q' }, ['Die Dame d1 läuft die Linie d hinauf.', 'In der Mitte steht sie stark.', 'Tippe die Dame, dann d4 oder d5.']),
      ] },
      { id: 'w15-l2', title: 'Raumvorteil', coach: 'cat', intro: 'Bauern, die weiter vorn stehen, nehmen dem Gegner Platz weg. Wer mehr Raum hat, hat mehr Auswahl.', tasks: [
        t(START, 'Gewinne Raum mit einem Mittelbauern.', { t: 'to', sqs: ['e4', 'd4', 'c4'], pc: 'p' }, ['Zwei Felder vor mit einem Bauern in der Mitte.', 'Die Linien c, d oder e.', 'Tippe einen Bauern, dann zwei Felder vor.']),
        t('4k3/ppp2ppp/8/8/4P3/8/PPP2PPP/4K3 w - - 0 1', 'Schieb den Bauern auf die 5. Reihe.', { t: 'to', sqs: ['e5'], pc: 'p' }, ['Der Bauer steht auf e4.', 'Ein Feld vor ist e5.', 'Tippe den Bauern, dann e5.']),
        t('4k3/pp3ppp/8/8/3P4/8/PP3PPP/4K3 w - - 0 1', 'Schieb den Bauern auf die 5. Reihe.', { t: 'to', sqs: ['d5'], pc: 'p' }, ['Der Bauer steht auf d4.', 'Ein Feld vor ist d5.', 'Tippe den Bauern, dann d5.']),
      ] },
      { id: 'w15-l3', title: 'Schwache Felder', coach: 'cat', intro: 'Ein Loch ist ein Feld, das kein gegnerischer Bauer mehr angreifen kann. Bring dort eine Figur hin.', tasks: [
        t('4k3/pp2pppp/8/8/8/2N5/PPP2PPP/4K3 w - - 0 1', 'Besetze das Loch d5.', { t: 'to', sqs: ['d5'], pc: 'n' }, ['Schwarz hat keinen c- oder e-Bauern, der d5 deckt.', 'Der Springer c3 springt nach d5.', 'Tippe den Springer, dann d5.']),
        t('4k3/pp1p1ppp/8/8/8/5N2/PPP2PPP/4K3 w - - 0 1', 'Besetze das Loch e5.', { t: 'to', sqs: ['e5'], pc: 'n' }, ['Schwarz hat keinen e-Bauern mehr.', 'Der Springer f3 springt nach e5.', 'Tippe den Springer, dann e5.']),
        t('4k3/ppp3pp/8/8/8/4N3/PPP2PPP/4K3 w - - 0 1', 'Besetze das Loch f5.', { t: 'to', sqs: ['f5'], pc: 'n' }, ['Schwarz hat keinen d-, e- oder f-Bauern mehr.', 'Der Springer e3 springt nach f5.', 'Tippe den Springer, dann f5.']),
      ] },
      { id: 'w15-l4', title: 'Linien öffnen', coach: 'cat', intro: 'Mit Bauernschlägen öffnest du Linien für deine Türme und Läufer. Ein Schlag kann also mehr bewirken als nur Material.', tasks: [
        t('4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1', 'Schlag den Bauern und öffne die Linie.', { t: 'capto', sq: 'd5', pc: 'p' }, ['Der Bauer steht schräg vor e4.', 'Schräg vor e4 liegt d5.', 'Tippe den Bauern, dann d5.']),
        t('4k3/8/8/8/1p6/2P5/8/4K3 w - - 0 1', 'Schlag den Bauern und öffne die Linie.', { t: 'capto', sq: 'b4', pc: 'p' }, ['Der Bauer steht schräg vor c3.', 'Schräg vor c3 liegt b4.', 'Tippe den Bauern, dann b4.']),
        t('4k3/8/8/8/8/3p4/4P3/4K3 w - - 0 1', 'Schlag den Bauern und öffne die Linie.', { t: 'capto', sq: 'd3', pc: 'p' }, ['Der Bauer steht schräg vor e2.', 'Schräg vor e2 liegt d3.', 'Tippe den Bauern, dann d3.']),
      ] },
      { id: 'w15-l5', title: 'Der Irrgartenwächter', boss: true, card: { kind: 'rook', name: 'Der Irrgartenwächter' }, coach: 'cat', intro: 'Wer den Weg durch das Labyrinth kennt, steht in der Mitte. Zeig dem Wächter, dass du ihn findest.', tasks: [
        t('4k3/8/8/8/8/2N5/8/4K3 w - - 0 1', 'Stell den Springer ins Zentrum.', { t: 'to', sqs: ['e4', 'd5'], pc: 'n' }, ['Die Mitte sind die Felder d4, d5, e4 und e5.', 'Der Springer c3 erreicht zwei davon.', 'Tippe den Springer, dann e4 oder d5.']),
        t('4k3/pp2pppp/8/8/8/2N5/PPP2PPP/4K3 w - - 0 1', 'Besetze das Loch d5.', { t: 'to', sqs: ['d5'], pc: 'n' }, ['Schwarz hat keinen c- oder e-Bauern, der d5 deckt.', 'Der Springer c3 springt nach d5.', 'Tippe den Springer, dann d5.']),
        t('4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1', 'Schlag den Bauern und öffne die Linie.', { t: 'capto', sq: 'd5', pc: 'p' }, ['Der Bauer steht schräg vor e4.', 'Schräg vor e4 liegt d5.', 'Tippe den Bauern, dann d5.']),
      ] },
    ],
  },
  {
    id: 'w16', name: 'Humpty Dumptys Mauer', coach: 'wknight',
    lessons: [
      { id: 'w16-l1', title: 'Material gewinnen', coach: 'wknight', intro: 'Humpty Dumpty fiel von der Mauer. Wer Figuren einfach so stehen lässt, verliert sie. Prüf, was ungedeckt ist, und schlag zu.', tasks: [
        t('4k3/8/8/8/8/8/1r6/B3K3 w - - 0 1', 'Schlag den ungedeckten Turm.', { t: 'capto', sq: 'b2', pc: 'b' }, ['Der Turm steht auf b2.', 'Dein Läufer a1 greift ihn schräg an.', 'Tippe den Läufer, dann b2.']),
        t('4k3/8/8/8/8/2n5/8/B3K3 w - - 0 1', 'Schlag den ungedeckten Springer.', { t: 'capto', sq: 'c3', pc: 'b' }, ['Der Springer steht auf c3.', 'Die lange Diagonale führt von a1 hin.', 'Tippe den Läufer, dann c3.']),
        t('3q4/8/8/8/8/8/8/3RK2k w - - 0 1', 'Schlag die ungedeckte Dame.', { t: 'capto', sq: 'd8', pc: 'r' }, ['Die Dame steht auf d8.', 'Dein Turm d1 greift die Linie d hinauf an.', 'Tippe den Turm, dann d8.']),
      ] },
      { id: 'w16-l2', title: 'Gedeckt oder nicht?', coach: 'wknight', intro: 'Schlägst du eine gedeckte Figur, wird zurückgeschlagen. Nimm lieber die ungedeckte, oder schlag mit der billigeren Figur.', tasks: [
        t('3r4/8/8/6p1/3Q3r/8/8/4K3 w - - 0 1', 'Schlag den ungedeckten Turm.', { t: 'capto', sq: 'd8', pc: 'q' }, ['Der Turm h4 ist durch den Bauern g5 gedeckt.', 'Der Turm d8 steht allein.', 'Tippe die Dame, dann d8.']),
        t('4k3/8/8/3n4/4P3/8/8/3QK3 w - - 0 1', 'Schlag den Springer mit dem Bauern, nicht mit der Dame.', { t: 'capto', sq: 'd5', pc: 'p' }, ['Der Springer steht auf d5.', 'Dein Bauer e4 greift ihn an.', 'Tippe den Bauern, dann d5.']),
        t('4k3/8/8/4q3/8/8/1B6/4K3 w - - 0 1', 'Schlag die ungedeckte Dame.', { t: 'capto', sq: 'e5', pc: 'b' }, ['Die Dame steht auf e5.', 'Dein Läufer b2 greift sie auf der Diagonale an.', 'Tippe den Läufer, dann e5.']),
      ] },
      { id: 'w16-l3', title: 'Vorteil verwerten', coach: 'wknight', intro: 'Wer mehr Material hat, sollte die Partie beenden. Der kürzeste Weg ist oft ein Matt, bevor etwas schiefgeht.', tasks: [
        mate1('5k2/8/5K2/8/8/6Q1/8/8 w - - 0 1', 'die Dame', 'b8'),
        mate1('6k1/3Q4/5K2/8/8/8/8/8 w - - 0 1', 'die Dame', 'g7'),
        mate1('2k5/8/3K4/3Q4/8/8/8/8 w - - 0 1', 'die Dame', 'a8'),
      ] },
      { id: 'w16-l4', title: 'Matt mit Turm und Dame', coach: 'wknight', intro: 'Noch mehr Matts. Such erst die Fluchtfelder des Königs, dann das Feld, von dem aus du alle versperrst.', tasks: [
        mate1('8/7R/8/8/8/k1K5/8/8 w - - 0 1', 'den Turm', 'a7'),
        mate1('k7/8/K7/4R3/8/8/8/8 w - - 0 1', 'den Turm', 'e8'),
        mate1('8/4Q3/k7/8/8/8/1R1K4/8 w - - 0 1', 'die Dame', 'a3'),
      ] },
      { id: 'w16-l5', title: 'Humpty Dumpty', boss: true, card: { kind: 'pawn', name: 'Humpty Dumpty' }, coach: 'wknight', intro: 'Alle Pferde und alle Männer konnten ihn nicht wieder zusammensetzen. Du schon?', tasks: [
        t('4k3/8/8/3n4/4P3/8/8/3QK3 w - - 0 1', 'Schlag den Springer mit dem Bauern.', { t: 'capto', sq: 'd5', pc: 'p' }, ['Der Springer steht auf d5.', 'Dein Bauer e4 greift ihn an.', 'Tippe den Bauern, dann d5.']),
        t('4k3/8/8/8/8/8/1r6/B3K3 w - - 0 1', 'Schlag den ungedeckten Turm.', { t: 'capto', sq: 'b2', pc: 'b' }, ['Der Turm steht auf b2.', 'Dein Läufer a1 greift ihn schräg an.', 'Tippe den Läufer, dann b2.']),
        mate1('8/R5K1/8/6k1/2R5/8/8/8 w - - 0 1', 'den Turm', 'a5'),
      ] },
    ],
  },
  {
    id: 'w17', name: 'Die Höhle des Jabberwock', coach: 'knight',
    lessons: [
      { id: 'w17-l1', title: 'Der König kämpft mit', coach: 'knight', intro: 'Im Endspiel ist der König keine Last mehr, sondern eine Waffe. Mit wenigen Figuren auf dem Brett darf er vorgehen und selbst schlagen.', tasks: [
        t('8/8/8/8/3p4/4K3/8/7k w - - 0 1', 'Schlag den ungedeckten Bauern mit dem König.', { t: 'capto', sq: 'd4', pc: 'k' }, ['Der Bauer steht neben deinem König.', 'Er ist nicht gedeckt.', 'Tippe den König, dann d4.']),
        t('8/8/8/8/8/2p5/3K4/7k w - - 0 1', 'Schlag den ungedeckten Bauern mit dem König.', { t: 'capto', sq: 'c3', pc: 'k' }, ['Der Bauer steht schräg vor deinem König.', 'Er ist nicht gedeckt.', 'Tippe den König, dann c3.']),
        t('8/8/8/4p3/4K3/8/8/7k w - - 0 1', 'Schlag den ungedeckten Bauern mit dem König.', { t: 'capto', sq: 'e5', pc: 'k' }, ['Der Bauer steht direkt vor deinem König.', 'Er ist nicht gedeckt.', 'Tippe den König, dann e5.']),
      ] },
      { id: 'w17-l2', title: 'Turm hinter den Freibauern', coach: 'knight', intro: 'Ein Turm gehört hinter den Freibauern, ob dem eigenen oder dem gegnerischen. So schiebt er ihn an oder hält ihn auf, ohne selbst im Weg zu sein.', tasks: [
        t('4k3/8/8/8/3P4/8/8/R3K3 w - - 0 1', 'Stell den Turm hinter den Freibauern.', { t: 'to', sqs: ['d1'], pc: 'r' }, ['Der Bauer steht auf d4.', 'Hinter ihm bedeutet: auf derselben Linie weiter unten.', 'Tippe den Turm, dann d1.']),
        t('k7/8/8/8/8/8/P7/7R w - - 0 1', 'Stell den Turm hinter den Freibauern.', { t: 'to', sqs: ['a1'], pc: 'r' }, ['Der Bauer steht auf a2.', 'Hinter ihm liegt a1.', 'Tippe den Turm, dann a1.']),
        t('8/8/8/8/4P3/8/7R/k3K3 w - - 0 1', 'Stell den Turm hinter den Freibauern.', { t: 'to', sqs: ['e2'], pc: 'r' }, ['Der Bauer steht auf e4.', 'Hinter ihm liegt e2, ein Feld weiter unten.', 'Tippe den Turm, dann e2.']),
      ] },
      { id: 'w17-l3', title: 'Opposition', coach: 'knight', intro: 'Stehen die Könige auf einer Linie mit einem Feld dazwischen, heißt das Opposition. Wer am Zug ist, muss ausweichen. Wer sie hat, drängt den anderen zurück.', tasks: [
        t('8/8/4k3/8/8/3K4/8/8 w - - 0 1', 'Stell deinen König in Opposition: ein Feld dazwischen.', { t: 'to', sqs: ['e4'], pc: 'k' }, ['Der schwarze König steht auf e6.', 'Opposition: gleiche Linie, ein Feld dazwischen.', 'Tippe den König, dann e4.']),
        t('8/8/6k1/8/8/5K2/8/8 w - - 0 1', 'Stell deinen König in Opposition: ein Feld dazwischen.', { t: 'to', sqs: ['g4'], pc: 'k' }, ['Der schwarze König steht auf g6.', 'Opposition: gleiche Linie, ein Feld dazwischen.', 'Tippe den König, dann g4.']),
        t('8/8/8/3k4/8/8/2K5/8 w - - 0 1', 'Stell deinen König in Opposition: ein Feld dazwischen.', { t: 'to', sqs: ['d3'], pc: 'k' }, ['Der schwarze König steht auf d5.', 'Opposition: gleiche Linie, ein Feld dazwischen.', 'Tippe den König, dann d3.']),
      ] },
      { id: 'w17-l4', title: 'Matt im Endspiel', coach: 'knight', intro: 'Aus gewonnenen Endspielen wird nur dann ein Sieg, wenn du auch mattsetzen kannst. Dein König muss dem Gegner die letzten Felder nehmen.', tasks: [
        mate1('k7/3R4/K7/8/8/8/8/8 w - - 0 1', 'den Turm', 'd8'),
        mate1('8/6R1/8/7k/1K6/8/8/5R2 w - - 0 1', 'den Turm', 'h1'),
        mate1('8/3B4/8/k1K5/5Q2/8/8/8 w - - 0 1', 'die Dame', 'a4'),
      ] },
      { id: 'w17-l5', title: 'Der Jabberwock', boss: true, card: { kind: 'knight', name: 'Der Jabberwock' }, coach: 'knight', intro: 'Er kommt mit Augen wie Feuer! Aber mit Plan statt Zufall besiegst du ihn: König aktiv, Turm hinter den Bauern, Opposition.', tasks: [
        t('8/8/8/8/3p4/4K3/8/7k w - - 0 1', 'Schlag den ungedeckten Bauern mit dem König.', { t: 'capto', sq: 'd4', pc: 'k' }, ['Der Bauer steht neben deinem König.', 'Er ist nicht gedeckt.', 'Tippe den König, dann d4.']),
        t('k7/8/8/8/8/8/P7/7R w - - 0 1', 'Stell den Turm hinter den Freibauern.', { t: 'to', sqs: ['a1'], pc: 'r' }, ['Der Bauer steht auf a2.', 'Hinter ihm liegt a1.', 'Tippe den Turm, dann a1.']),
        t('8/8/4k3/8/8/3K4/8/8 w - - 0 1', 'Stell deinen König in Opposition.', { t: 'to', sqs: ['e4'], pc: 'k' }, ['Der schwarze König steht auf e6.', 'Opposition: gleiche Linie, ein Feld dazwischen.', 'Tippe den König, dann e4.']),
      ] },
    ],
  },
  {
    id: 'w18', name: 'Das Spiegelbild', coach: 'alice',
    lessons: [
      { id: 'w18-l1', title: 'Hängende Figuren', coach: 'alice', intro: 'Im Spiegel siehst du, was du übersehen hast. Nach jedem Zug des Gegners fragst du zuerst: Hängt etwas, und kann ich es einfach nehmen?', tasks: [
        t('4k3/8/8/3b4/8/8/8/3QK3 w - - 0 1', 'Schlag die ungedeckte Figur.', { t: 'capto', sq: 'd5', pc: 'q' }, ['Der Läufer steht auf d5.', 'Deine Dame greift die Linie d hinauf an.', 'Tippe die Dame, dann d5.']),
        t('4k3/8/8/8/2n5/8/8/2R1K3 w - - 0 1', 'Schlag die ungedeckte Figur.', { t: 'capto', sq: 'c4', pc: 'r' }, ['Der Springer steht auf c4.', 'Dein Turm c1 greift die Linie hinauf an.', 'Tippe den Turm, dann c4.']),
        t('4k3/8/8/8/8/8/3q4/4K3 w - - 0 1', 'Schlag die ungedeckte Dame.', { t: 'capto', sq: 'd2', pc: 'k' }, ['Die Dame steht neben deinem König.', 'Sie ist nicht gedeckt.', 'Tippe den König, dann d2.']),
      ] },
      { id: 'w18-l2', title: 'Was droht mir?', coach: 'alice', intro: 'Dreh das Brett im Kopf um und sieh es mit den Augen des Gegners. Welche seiner Figuren greift meine an?', tasks: [
        t('4k3/8/2n5/8/3Q4/8/8/4K3 w - - 0 1', 'Tippe die Figur, die deine Dame bedroht.', { t: 'tap', sqs: ['c6'] }, ['Deine Dame steht auf d4.', 'Die Figur springt im L.', 'Gesucht: c6.']),
        t('3k4/8/8/3p4/4R3/8/8/4K3 w - - 0 1', 'Tippe die Figur, die deinen Turm bedroht.', { t: 'tap', sqs: ['d5'] }, ['Dein Turm steht auf e4.', 'Bauern schlagen schräg.', 'Gesucht: d5.']),
        t('4k3/8/8/8/3Q4/8/8/4K1b1 w - - 0 1', 'Tippe die Figur, die deine Dame bedroht.', { t: 'tap', sqs: ['g1'] }, ['Deine Dame steht auf d4.', 'Die Figur greift schräg an.', 'Gesucht: g1.']),
      ] },
      { id: 'w18-l3', title: 'Einen Plan finden', coach: 'alice', intro: 'Ein Plan beginnt mit einer Schwäche. Ein isolierter Bauer, ein Loch oder eine offene Linie zeigt dir, wohin du deine Figuren stellst.', tasks: [
        t('4k3/8/8/8/3p4/8/8/3RK3 w - - 0 1', 'Greif den isolierten Bauern an.', { t: 'capto', sq: 'd4', pc: 'r' }, ['Der Bauer steht allein auf d4.', 'Dein Turm greift die Linie d an.', 'Tippe den Turm, dann d4.']),
        t('4k3/8/8/8/8/2p5/8/3NK3 w - - 0 1', 'Greif den isolierten Bauern an.', { t: 'capto', sq: 'c3', pc: 'n' }, ['Der Bauer steht allein auf c3.', 'Dein Springer d1 greift ihn im L an.', 'Tippe den Springer, dann c3.']),
        t('4k3/8/8/8/p7/8/8/3BK3 w - - 0 1', 'Greif den isolierten Bauern an.', { t: 'capto', sq: 'a4', pc: 'b' }, ['Der Bauer steht allein auf a4.', 'Dein Läufer d1 greift ihn schräg an.', 'Tippe den Läufer, dann a4.']),
      ] },
      { id: 'w18-l4', title: 'Matt oder Gewinn?', coach: 'alice', intro: 'Wenn du alles vor dem Zug geprüft hast, bleibt eine Frage: Gibt es ein Matt? Dann ist alles andere egal.', tasks: [
        mate1('5k2/R7/8/8/8/8/3K4/2Q5 w - - 0 1', 'die Dame', 'c8'),
        mate1('6k1/8/6NK/8/8/7B/8/8 w - - 0 1', 'den Läufer', 'e6'),
        mate1('k7/1R6/6K1/8/8/4Q3/8/8 w - - 0 1', 'die Dame', 'a7'),
      ] },
      { id: 'w18-l5', title: 'Das Spiegelbild', boss: true, card: { kind: 'alice', name: 'Alice hinter den Spiegeln' }, coach: 'alice', intro: 'Du siehst dein eigenes Spiegelbild: Wer bist du jetzt? Eine Schachspielerin! Zeig, was du über Spiel und Plan gelernt hast.', tasks: [
        t('4k3/8/2n5/8/3Q4/8/8/4K3 w - - 0 1', 'Tippe die Figur, die deine Dame bedroht.', { t: 'tap', sqs: ['c6'] }, ['Deine Dame steht auf d4.', 'Die Figur springt im L.', 'Gesucht: c6.']),
        t('4k3/8/8/8/2n5/8/8/2R1K3 w - - 0 1', 'Schlag die ungedeckte Figur.', { t: 'capto', sq: 'c4', pc: 'r' }, ['Der Springer steht auf c4.', 'Dein Turm c1 greift die Linie hinauf an.', 'Tippe den Turm, dann c4.']),
        mate1('5k2/R7/8/8/8/8/3K4/2Q5 w - - 0 1', 'die Dame', 'c8'),
      ] },
    ],
  },
];
