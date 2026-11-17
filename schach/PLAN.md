# Schachdorf – Plan fürs spielbare Grundgerüst (v1: Regel-Engine + Welt 1–2)

Stand: Konzept `konzept.html` (v10) ist freigegeben. Dieser Plan beschreibt, wie daraus `schach/index.html` wird,
ein Browserspiel im Spielregal-Stil (eine Datei, Vanilla JS, kein Build).

## 1. Umfang v1

**Drin**
- Vollständige Schach-Regel-Engine (inkl. Rochade, en passant, Umwandlung, Matt/Patt, Remis-Regeln) mit Tests.
- Bot mit drei Stärkestufen für Mini-Duelle und Bosse.
- Lektionssystem (Daten + Player) mit Hinweisen, Fehlern, Sternen.
- **Welt 1 „Brettwiese“** (Brett, Felder, Koordinaten) und **Welt 2 „Bauernhof“** (Bauer: Zug, Doppelschritt, Schlagen, Umwandlung), je mit Boss.
- Weltkarte (aus dem Konzept übernommen), Fortschritt, Sterne, XP, Münzen, Serie, Mut-Herzen.
- Tal-Stufen 0 und 1 (karg → Frühling).
- Anbindung an Spielregal (Eintrag, Speichern, Beenden, Menü), Smoke-Tests.

**Nicht drin (später)**: Welten 3–10, Tal-Stufen 2–5, Wahrzeichen, Sammelkarten, Tagesquest, Liga, Mehrspieler, Eröffnungsbuch.

## 2. Architektur (eine Datei, drei Schichten)

```
schach/index.html
  <script> Engine      – reines JS, kein DOM: Brett, Züge, FEN, SAN, Bot
  <script> Content     – Lektionen/Welten als Daten (LESSONS, WORLDS)
  <script> App         – Zustand, Rendering, Animation, Sound, Speichern, Spielregal-Anbindung
```

Die Engine bleibt DOM-frei und läuft auch in Node. Dafür wird sie zusätzlich in `schach/engine.mjs` gepflegt
und per Test gegen die Kopie in `index.html` verglichen (wie bei Glut: Simulation und Spiel bleiben identisch).

### 2.1 Engine-API (Entwurf)
```js
parseFEN(str) -> pos          // pos: {board[64], turn, castling, ep, half, full}
toFEN(pos) -> str
legalMoves(pos, opts) -> [{from,to,promo?,flags}]   // opts.sandbox: auch ohne König spielbar
makeMove(pos, mv) -> pos'      // unveränderlich, damit Rückgängig trivial ist
inCheck(pos), isMate(pos), isStalemate(pos), isDraw(pos, history)
toSAN(pos, mv), fromSAN(pos, san)
attacks(pos, sq, color) -> bool
bestMove(pos, {depth, rng}) -> mv   // Alpha-Beta, Material + einfache Positionstabellen
```

**Wichtig für das Lernen:** Die Welten 1–6 üben einzelne Figuren ohne Könige. Die Zuggenerierung muss darum
„Sandbox-Stellungen“ erlauben: keine Königspflicht, kein Schach-Test, wenn kein König da ist. Ohne diese
Option könnte man die Lektionen nicht abbilden.

### 2.2 Engine-Tests (`test/schach-engine.mjs`)
- **Perft** (Zählen aller Züge bis Tiefe n) gegen bekannte Werte:
  Grundstellung 20 / 400 / 8 902 / 197 281, „Kiwipete“ 48 / 2 039 / 97 862, dazu Stellungen für
  en passant, Rochade durch Schach, Umwandlung. Das ist der Standardbeweis, dass der Zuggenerator stimmt.
- Matt-/Patt-/Remis-Erkennung auf ausgewählten FENs.
- SAN-Rundlauf (`toSAN` → `fromSAN`) über Perft-Stellungen.
- Bot: findet Matt in 1 und Matt in 2 aus einer Liste fester Stellungen; Stufe 1 patzt messbar mehr als Stufe 3.

## 3. Lektionssystem

### 3.1 Datenformat
```js
{ id:'w2-l3', welt:2, titel:'Der Bauer schlägt schräg', coach:'bruno',
  schritte:[
    { typ:'zeigen',  fen:'8/8/8/3p4/4P3/8/8/8 w - - 0 1', text:'…', markiere:['e4','d5'], animation:'schlagen' },
    { typ:'ausprobieren', fen:'…', erlaubt:'alle', bis:'3 Züge' },
    { typ:'aufgabe', fen:'…', ziel:{art:'schlagen', alle:true}, hinweise:['…','…','…'] },
    { typ:'aufgabe', fen:'…', ziel:{art:'feld', feld:'e8'} },
    { typ:'duell',   fen:'…', gegner:'bot1', sieg:'alle-gegnerischen-bauern-geschlagen' },
  ],
  sterne:{ drei:'0 Fehler, 0 Hinweise', zwei:'0 Hinweise', eins:'geschafft' } }
```
**Zieltypen:** `feld` (Feld erreichen), `schlagen` (bestimmte/alle Figuren), `matt-in-n`, `bester-zug`
(Menge erlaubter Züge), `sicher` (Feld ohne angegriffen zu werden), `blockieren`.

### 3.2 Player
Ein Schritt = eine Stellung + ein Ziel. Zugeingabe per Tippen-Tippen (optional Ziehen).
Ablauf bei falschem Zug: Figur wackelt, Coach gibt Hinweis, Mut-Herz −1 (nie Abbruch), nach Hinweis 3 zeigt der Coach den Zug.
Bei richtigem Zug: Puls, Ton, Fortschrittsbalken.

### 3.3 Inhaltsprüfung (`test/schach-lessons.mjs`)
- Jede Stellung ist gültig (FEN, Sandbox-Regeln).
- Jede Aufgabe ist **lösbar** (die Engine findet eine Lösung) und die Lösungsmenge ist nicht leer.
- Jede Aufgabe hat 3 Hinweise und einen Coach-Text.
- Kein Schritt führt zu einer Sackgasse (Spieler hat immer mindestens einen Zug).

## 4. Inhalte Welt 1 und 2

### Welt 1 „Brettwiese“ (6 Lektionen + Boss)
1. Das Brett: 64 Felder, hell/dunkel, Reihen und Linien.
2. Koordinaten: a–h, 1–8 („Tippe e4“), Felder-Fangen.
3. Aufstellung: wo steht welche Figur, wer zieht zuerst.
4. Zugrichtungen: gerade, schräg, L (nur Überblick, noch keine Figuren-Regeln).
5. Schlagen: wegnehmen statt vorbeiziehen.
6. Wer gewinnt? Matt in einem Satz erklärt (nur Konzept).
- **Boss „Felder-Fangen“:** zehn Felder-Ansagen in 45 Sekunden. Weich: Zeit wird nur gemessen, nicht bestraft.

### Welt 2 „Bauernhof“ (7 Lektionen + Boss)
1. Ein Schritt vor.
2. Der Doppelschritt aus der Grundreihe.
3. Schlagen schräg (und nicht geradeaus).
4. Blockiert: der Bauer kommt nicht vorbei.
5. Umwandlung: am Ende wird er zur Dame.
6. En passant (optionale Bonus-Lektion).
7. Bauern-Duell: 4 gegen 4 Bauern gegen den Bot.
- **Boss „Rübenräuber“:** Bauernrennen: wer zuerst die letzte Reihe erreicht, gewinnt.

## 5. Fortschritt und Gamification (v1)

| Element | Regel |
|---|---|
| Sterne | 1 = geschafft, 2 = ohne Hinweis, 3 = ohne Fehler und Hinweis |
| XP | 10 je Aufgabe, Bonus je Stern; Titel-Stufen später |
| Münzen | 2 je Aufgabe, 10 je Lektion, 25 je Boss (für spätere Dorf-Ausbauten) |
| Serie | Tage in Folge mit ≥ 1 Lektion; „Frostschutz“ später |
| Mut-Herzen | 3 je Lektion, nie Abbruch |
| Tal-Stufe | 0 am Start, **1 nach Welt 1** (Bäume, Büsche, Blumen, Wolken) |

**Speicher:** `schach:save` (laufende Lektion/Duell, `screen:'game'` wie bei Saum) und `schach:progress`
(Sterne je Lektion, XP, Münzen, Serie, Tal-Stufe).

## 6. UI und Technik

- **Layout** nach den Spielregal-Konventionen: `html,body` fest, `#app` als innerer Scroller (`SC`), Kopf deckend,
  Beenden-Link „‹ Spielregal“, Menü ☰ (Töne, Mitspieler-Tempo, Neueste Version laden mit `?resume=1`,
  Speichern & zum Spielregal, Fortschritt zurücksetzen), `HERO_TOP` auf dem Startbildschirm.
- **Info-Blasen:** langes Drücken auf Elemente mit `data-info`. Keine Textauswahl außerhalb von Eingaben.
- **Animationen** (alle mit `prefers-reduced-motion` abschaltbar): Figur hebt sich, gleitet im Bogen, landet mit Squash;
  Schlagen mit Staubwolke; falscher Zug wackelt; Sterne springen ein; Tal-Update blendet neue Bäume gestaffelt ein.
- **Töne:** WebAudio synthetisch wie bei Glut (`SND`), Schalter im Menü.
- **Weltkarte:** Der Generator aus dem Konzept wird übernommen. **Risiko iOS/Performance:** Die Karte hat mehrere tausend
  Pfadelemente und animierte Ebenen. Maßnahmen: bewusst keine SVG-Filter, Textur-Glyphen auf rund die Hälfte reduzieren,
  Lebens-Ebenen erst ab ihrer Stufe rendern, auf einem echten iPhone testen.
- **Schriften:** Kalam, Patrick Hand und Permanent Marker sind eingebettet (rund 150 KB). Option: auf die genutzten
  Zeichen reduzieren (Subset), das spart etwa die Hälfte.
- **Dateigröße:** Konzept 340 KB, Spiel mit Engine und Inhalten wohl 450–600 KB. Das ist für eine Einzeldatei vertretbar,
  soll aber beobachtet werden.

## 7. Einbindung in Spielregal

1. Neuer Ordner `schach/` mit `index.html`, `cover.jpg` (3:4 fürs Dashboard), `engine.mjs`, `STIL.md`.
2. Eintrag in der Spieleliste der `index.html` (neben Saum/Glut/Siedlerhain), nach dem Muster:
   `{ bggId:"", titel:/^schachdorf\b/i, href:"schach/", name:"Schachdorf", original:"Schachdorf", art:"Schach lernen",
   source:"schach", saveKey:"schach:save", rounds:0, unit:"", icon:"…", color:"…" }`
3. **Partie-Meldung** (`spielregal:inbox:plays`, `source:'schach'`): Vorschlag, nur **Duelle und Bosse** zu melden
   (mit Sieger), nicht jede Lektion. Offene Frage 3.
4. Zeile in `CLAUDE.md` (Stil-Tabelle): Oath-Stil, Palette, Schriften, Linienregeln, mit Hinweis, dass die Referenzbilder nicht im Repo liegen.
5. Tests: `test/schach-engine.mjs`, `test/schach-lessons.mjs`, `test/schach-smoke.mjs` (Start, Lektion durchspielen,
   Speichern/Fortsetzen, reduzierte Bewegung). Danach laufen die globalen Tests aus der CLAUDE.md:
   `digital-play-link.mjs`, `digital-play-tracking.mjs`, `dashboard-browser-games.mjs`.

## 8. Meilensteine (jeder einzeln testbar und abnehmbar)

| # | Inhalt | Abnahme |
|---|---|---|
| M1 | Engine + Perft-Tests + Bot-Stufen | `schach-engine.mjs` grün |
| M2 | Brett-UI: Tippen-Tippen, Animationen, Töne, Sandbox-Stellungen | im Browser spielbar |
| M3 | Lektionsplayer + Daten Welt 1 + Belohnung | `schach-lessons.mjs` + Smoke grün |
| M4 | Welt 2 + Bauern-Duell + Bosse | Smoke grün |
| M5 | Weltkarte, Fortschritt, Stufe 1, Speichern | Fortsetzen getestet |
| M6 | Spielregal-Anbindung, Cover, Menü, alle globalen Tests | Owner-Test auf dem iPhone |

## 9. Risiken

- **Sandbox-Regeln** (Figuren ohne König): Hier entstehen leicht Fehler, die der Perft-Test nicht abdeckt. Eigene Tests dafür.
- **Lernwirkung:** Gute Aufgaben sind Handarbeit. Die Inhalte brauchen deine Durchsicht, bevor Welt 3+ entsteht.
- **Karte auf dem iPhone:** Performance ist noch ungeprüft (siehe oben).
- **Bot-Stärke:** Stufe 1 muss absichtlich schwach sein, ohne albern zu wirken. Das braucht Feinabstimmung am echten Spiel.

## 10. Offene Entscheidungen

1. **Sprache:** Nur Deutsch (Annahme) oder von Anfang an mehrsprachig?
2. **Zielgruppe:** Erwachsene und Jugendliche (Annahme). Bei Kindern müssten Texte kürzer und vorlesbar werden.
3. **Partie-Meldung:** Nur Duelle und Bosse melden (Vorschlag) oder auch Lektionen?
4. **Mut-Herzen:** weich (Hinweise statt Game Over, Vorschlag) oder echte Begrenzung?
5. **Schriften:** komplett einbetten (einfach, 150 KB) oder reduzieren (aufwendiger, etwa die Hälfte)?
6. **Branch:** Soll ich für `schach/` direkt auf `main` pushen (wie in der CLAUDE.md für Updates festgelegt) oder weiter auf dem Branch bleiben, bis das erste Spiel steht?

## 11. Fertig, wenn

- Alle Engine-, Lektions- und Smoke-Tests grün, globale Tests aus der CLAUDE.md unverändert.
- Welt 1 und 2 komplett spielbar, inklusive Boss, Speichern und Fortsetzen.
- Tal-Stufe 1 erscheint nach Welt 1 mit Animation.
- Owner hat auf dem iPhone getestet (Scrollen, Tippen, Animationen, Karte).
