# GLUT – Stil und Typografie v0.1

Grundlage: sechs Owner-Referenzen (Schrift-Poster mit Pillen und Story-Rahmen; Berg-Linolschnitt mit Weg und Haus;
kobaltblaue Figur mit Landschaft im Körper; kobaltblaue Vögel und Tulpen; Riso-Landschaft mit Tasse, Blatt, Pilz;
Gouache-Sonnenlandschaft mit Fluss). Die Bilder selbst liegen nicht im Repo (fremde Illustrationen).
Ansehen: `stil-vorschau.html` (drei Handy-Bildschirme).

## Abgrenzung zu den anderen Spielen (wichtig)
Jedes Spiel hat seinen eigenen Stil. Glut ist **gesättigt und plakativ**, die Nachbarn sind es nicht:
Drei Schwestern = gedämpfte Oberfläche, DM Sans, Pfirsichgrund · Landgut = Greige, Petrol, Fraunces/Caveat ·
Saum = Papier und Aubergine, Lora. Glut übernimmt **nichts davon**: kein Petrol, kein Greige, keine Serife.
Gemeinsam mit Drei Schwestern ist nur der Pfirsichton als Illustrationsgrund – bei Glut ist er Hintergrund für
**Kobalt und Sonnen-Koralle**, nicht für Pflanzen.

## Leitmotiv
**Die Sonne ist die Hitze.** Sie taucht in fast allen Referenzen auf (roter Kreis, Strahlen). Das passt zur Mechanik:
Hitze 1–6 der Würfel = Sonnenstand. Dazu die wiederkehrenden Motive: der **geschwungene Weg**, das **kleine Haus auf der Kuppe**,
Hügel, Fluss, Blumen. Figuren (falls gebraucht) als Kobalt-Silhouette mit Landschaft im Körper.

## Farben (Tokens in `:root`)
| Token | Hex | Verwendung |
|---|---|---|
| `--ground` Pfirsich | `#F2C8B6` | Spielfeld-Grund, Illustrationen |
| `--paper` Creme | `#F7EBDD` | Karten, Startbildschirm, Pillen |
| `--ink` Weinbraun | `#3B1220` | Schrift, Rahmen, Schatten (nie reines Schwarz) |
| `--cobalt` Kobalt | `#2A2BC8` | Hügel, Flächen, Linolschnitt-Figuren |
| `--peri` Hellkobalt | `#6F7BE8` | zweite Ebene, Wasser |
| `--sun` Koralle | `#F2502E` | Sonne, Hitze, Hauptknopf, Stempel |
| `--pink` | `#F6A8BE` | Pillen, Flächen, Prinzip „Papier + Pink" |
| `--lilac` | `#9C90D6` | Pillen, kalte Würfel |
| `--lime` | `#B4E35E` | „Du bist dran", Hervorhebung auf Dunkelgrün |
| `--pine` | `#124D39` | Gegenfarbe für Seiten (Schrift in Lime) |
| `--amber` | `#FFA844` | Präsentationsgrund, Cover |

**Hitzeleiter der Würfel** (Pflicht, auch ohne Zahl lesbar): `0 kalt #D6CEEA` (gestrichelter Rand, matt) ·
`1 #F6A8BE` · `2 #F58FA0` · `3 #F7794F` · `4 #F2502E` · `5 #E0371F` · `6 #B81E1A`.
Ab 4 weiße Zahl, darunter Weinbraun. Kalt = lila-grau, gestrichelt, kein Schatten.
Farbe allein trägt keine Information: immer Zahl dazu (Farbschwäche).

## Typografie
**Ein Schriftfamilie für alles: Bricolage Grotesque** (Google Fonts, variabel; Achsen Breite 75–100, Gewicht 200–800,
optische Größe). Sie trifft die Referenz am nächsten: schmale, hohe Grotesk mit Tintenfallen und leichten Eigenheiten.
Die Referenzschrift selbst (Visorefont) ist kommerziell und wird **nicht** eingebunden.

| Rolle | Einstellung |
|---|---|
| Wortmarke / Seitentitel („Glut.", „Aufträge.") | Breite 75, Gewicht 600, Zeilenhöhe .86, **immer mit Punkt**, groß (54–96 px) |
| Kartentitel, Ortsnamen | Breite 75, Gewicht 600–700, 30 px |
| Zahlen (Würfel, Vorräte, Ruhm) | Breite 75, Gewicht 800 |
| Pillen, Labels | Breite 90, Gewicht 600–700, 13–17 px |
| Fließtext (Regeln, Hinweise) | Breite 100, Gewicht 500, 13 px, Zeilenhöhe 1,35 |

Keine zweite Schrift, keine Handschrift, keine Serife. Großschreibung normal (kein Versalsatz).

## Formen und Oberfläche
- **Pillen überall:** Knöpfe, Chips, Bedingungen („Hitze ≥ 4"), Zustände. Radius voll.
- **Karten:** Creme, Rahmen 3 px Weinbraun, Radius 26 px; Hervorhebung durch Lime-Fläche, Gegenfarbe Dunkelgrün mit Lime-Titel.
- **Rahmen und Versatzschatten:** Weinbraun, harter 3-px-Versatz (`3px 3px 0`), kein weicher Schatten.
- **Würfel:** abgerundetes Quadrat (16 px), 3-px-Rahmen, Zahl groß, Farbe nach Hitzeleiter.
- **Stempel-Rosetten** für Ruhm (Koralle, leicht gedreht) – wie bei Aufträgen und Gilden-Wertung.
- Vorratsleiste immer sichtbar unter der Kopfzeile (Spielregal-Konvention); je Ware ein eigenes **Symbol** (flach mit Weinbraun-Kontur, `RIC`) + Zahl: Ton = Lehmklumpen (Ocker), Asche = Aschehaufen mit Flocken (Lila), Holz = Holzscheibe mit Jahresringen, Rohling = Vase (Hellkobalt), Dukaten = Münze (Lime), Ruhm = Stern im Koralle-Stempel. **Stücke** ebenso (`TIC`): Fliese = Kachel mit Blüte, Krug = Kobaltkrug mit Henkel, Zierplatte = Teller mit Ring. Symbole stehen auch in Rezeptzeilen, Kosten und Erträgen der Auswahlfenster, Chronik und Aufträgen (`icoTxt` verwandelt „+3 Ton“, „Krug“ … automatisch); Erklär-Blasen bleiben Text.
- Alle übrigen Spielregal-Konventionen gelten unverändert (Info-Blase per langem Drücken, Menü ☰, Kopfzeile deckend,
  Zug rückgängig, Lernspiel, Wischseiten, `HERO_TOP` auf dem Startbildschirm).

## Illustration
- **Linolschnitt/Riso-Druck:** flache Farbflächen ohne schwarze Konturen, Konturen nur als Weißaussparung oder Rosa-Linie.
- **Körnung:** feine, seltene weiße Sprenkel über Flächen (SVG-Filter `#grain`), leichtes Wackeln der Kanten (`#lino`).
  Dezent halten – Referenz ist Druck, kein Rauschen (zu dichte Körnung wurde in der Vorschau bereits korrigiert).
- **Dichte Muster in Flächen:** Streifen, Punkte und Blätter wie im Berg-Poster, nur in 2–3 Tönen derselben Farbe.
- **Palette je Bild begrenzt:** Pfirsich + Kobalt + Koralle (+ Pink/Olive), nicht alles zugleich.

## Cover (v0.4 – der Brennofen ist der Mittelpunkt)
Datei `cover.png` (800×1200, 2:3), erzeugt aus `tools/cover.py` (SVG) und `tools/render-cover.mjs` (PNG mit Bricolage).
Verlauf: Die erste Fassung (Landschaft mit Haus) wirkte kindlich und hatte nichts mit dem Spiel zu tun; die zweite erzählte das Thema,
aber der Ofen stand am Rand. Jetzt trägt das Cover das Spiel in einem Bild:
- **Der Brennofen steht groß in der Mitte:** Terrakotta-Kuppel mit Backsteinfugen, hoher Schornstein mit Rauchfaden zur Sonne,
  Sockel mit Kachelband, glühende Öffnung in Schichten (Dunkelrot → Koralle → Orange → Gelb).
- **Im Feuer glüht ein Würfel mit 6 Augen** – die Hitze, um die sich das Spiel dreht.
- **Aus der Öffnung führt der Weg:** darauf Würfel, die von 5 (heiß) bis kalt (Lila, gestrichelt) abkühlen.
- **Die Sonne oben rechts ist ebenfalls ein 6er-Würfel.** Hitze zieht sich als Motiv durch das ganze Bild.
- **Warm gegen kühl:** der warme Ofen vor Kobalt- und Hellkobalt-Hügeln mit dichter Konturtextur (gestrichelt entlang des Weges, Punktgruppen),
  Vordergrund-Blätter in Dunkelkobalt – der Ofen hebt sich so von selbst ab.
- **Wortmarke** „Glut." in Bricolage Breite 75, Weinbraun, mit Zeile „Würfel, die abbrennen."
- Körnung nur als feine, seltene Sprenkel über allem (Papier), kein Rauschen.
Für Handys (9:19,5) wird das Cover unten verankert und oben mit Pfirsich aufgefüllt; ein Hochformat-Zuschnitt lässt sich aus dem Skript erzeugen.

## Bewegung
Bewegung erzählt die Mechanik: **Hitze sinkt sichtbar** (Würfel zischt und kühlt ab, kalte Würfel zittern, Rasten würfelt sie neu herein), Vorräte federn mit „+2/−1“,
der **Brennofen glüht auf**, wenn er benutzt wird, Ruhm schlägt als **Stempel** ein, Runden werden als **Banner** angesagt, der Sieg bekommt Konfetti. Das Cover lebt (Glut im Ofen, Funken).
Federnde, kurze Bewegungen (0,3–0,9 s, Überschwinger), nie Dauerbewegung im Spielfeld; Dauerbewegung nur auf dem Cover. `prefers-reduced-motion` schaltet alles ab.

## Offene Entscheidungen
1. ~~Thema~~ **entschieden: Fayence-Manufaktur** (Kobalt = Glasurpigment, Brennofen = Hitze). Begriffe siehe `REGELN.md`.
2. **Tintenfallen-Optik der Referenzschrift:** Bricolage ist ein guter, freier Ersatz; ein Kauf der echten Schrift wäre möglich.
3. **Hell/Dunkel:** Vorschlag nur hell (wie die anderen Spiele); Dunkelgrün-Seiten sind Akzent, kein Dunkelmodus.
