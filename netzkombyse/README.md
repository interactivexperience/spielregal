# NetzKombyse – drei Website-Konzepte (Prototypen)

Statische Seiten ohne Build-Step für den Betrieb. Öffnen: `netzkombyse/index.html` über einen beliebigen statischen Server
(z. B. `python3 -m http.server` im Repo-Root → `/netzkombyse/`).

| Konzept | Idee | Menü | Übergang | Signature |
|---|---|---|---|---|
| `k1/` Hafenkarte | Seekarte, Route mit Stationen | Kompass-Vollbild (Kreis-Reveal) | Welle | Kompass, Möwen, Route füllt sich |
| `k2/` Brise | Küstentag von der Düne ins Meer | Panel mit Wellenkante, Wellen-Buchstaben | Wolken ziehen auf | Wind-Headline, Leuchtturm, Postkarten, wandernde Sonne in den Folien |
| `k3/` Möwenschwarm | laut, bunt, überraschend | Aufklapp-Sticker fallen herunter | Iris + Möwe | Physik-Buchstaben, Möwenjagd (5 Möwen), Begleit-Möwe, Sammelkarten |
| `k4/` Gezeiten | Wattenmeer, Scroll = Tide | nur Kopfzeile | – | Wasserstand steigt/fällt mit dem Scroll, Pegelanzeige, Ebbe-Reveal (clip-path) |
| `k5/` Leuchtfeuer | Nordsee bei Nacht | nur Kopfzeile | – | Lichtkegel folgt dem Zeiger (clip-path), kreisender Leuchtturmstrahl, Autopilot ohne Maus |
| `k6/` Fischmarkt | Marktplakat | nur Kopfzeile | – | Ticker, riesige Schrift, Wortzeilen laufen mit dem Scroll, Preisschilder |
| `k7/` Seemannsgarn | mobile-first, Stories | Dock unten | – | Vollbild-Karten, Antippen/Halten/Wischen, Fortschrittsbalken |
| `k8/` Flaschenpost | mobile-first, Karten wischen | Dock unten | – | scroll-snap-Karten neigen sich mit dem Scroll, Flasche treibt mit |
| `k9/` Funkspruch | mobile-first, Chat | Chips unten | – | Gespräch mit Möwe Mia aus einem JSON-Skript, Chips als Antworten |
| `k12/` Logbuch | nach Owner-Vorlage (dunkel, Orange, Weiß), Möwe statt Fotos | Schiene links + Kapitelleiste | – | ultra-schmale Anton-Versalien (`fonts/anton.woff2`, OFL), angeschnittene Riesenschrift, Kapitel rasten ein, Zeilen per clip-path, Parallaxe |
| `k11/` Beton | dunkler Brutalismus, Akzent Säuregrün `#C8FF00` | Kopfzeile als Tabelle | – | Rasterlinien, Monospace, Warnband, Dateiliste, Text-Decoder, Glitch-Headline |
| `k10/` Signal | bold in Schwarz-Weiß, Akzent Rettungsorange `#FF5B00` | nur Kopfzeile | – | riesige Schrift, Text füllt sich beim Scrollen, gestapelte Karten, Cursor-Blase (Maus) |

k4–k9 sind nur als Startseite ausgearbeitet (`src/k4…k9.mjs`; k4–k6 teilen Bausteine in `src/lib2.mjs`). k7–k9 sind mobile-first: Handy-Spalte, am Desktop mittig als Rahmen.
Touch-Ersatz in k1–k3: k1 Kompassnadel reagiert auf Antippen, k2 Wind weht von selbst und legt beim Scrollen zu, k3 Möwe landet an der Tippstelle und Knöpfe füllen sich beim Antippen; Tippflächen im Menü/Footer mind. 44 px (`pointer:coarse`).

Je Konzept k1–k3: `index` (Start), `leistung`, `case` (Wein-Bauer.de), `praesentation` (6 Folien); Menü offen = `index.html#menu`.

## Bauen
`node netzkombyse/build.mjs` erzeugt die HTML-Seiten aus `src/k1|k2|k3.mjs` und den gemeinsamen Inhalten `content.mjs`.
CSS/JS der Konzepte (`kN/style.css`, `kN/app.js`) und `shared/core.js`, `shared/deck.js` sind handgeschrieben.
Screenshots + Konsolenfehler: `node netzkombyse/tools/shots.mjs k1 <ausgabeordner>` (Playwright).

## Bewegung
`html[data-motion=on|off]`; Schalter „Bewegung“ im Header, gespeichert in `localStorage` (`nk:motion`), Standard folgt
`prefers-reduced-motion`. Nur transform/opacity/clip-path, IntersectionObserver und rAF.

## Awwwards-Anregungen (Stand 23.11.2026)
Gelesen: awwwards.com/awwwards/collections (Seite 1), die Collections „CSS & JS Animations“, „Hovers, Cursors and Cute Interactions“,
„Horizontal Scrolling“, „UI Animation and Microinteractions“, „Illustration in Web Design“ (jeweils nur Seite 1) und drei Einzelseiten.
Die Seiten nennen nur Titel, Kategorien und Tags, keine Technikbeschreibungen; übernommen wurde, was die Titel hergeben:
- k1: Referenzen („Ladung“) laufen beim vertikalen Scrollen seitlich durch (Desktop ab 900 px, Bewegung an; sonst nativ wischen) – Anregung „Horizontal scroll navigation“ (OddCommon).
- k2: Tageszeit-Schleier, der beim Scrollen wärmer wird (nur opacity) – Anregung „Scroll backgrounds“ (V-A Studio).
- k3: Knopf-Farbfläche wächst per clip-path aus der Zeigerposition, Knöpfe leicht magnetisch – Anregung „Texture hover reveal“ / „Hover Buttons“.

## Offen vor Livegang
Kennzahlen im Case und Kundenzitate sind Platzhalter; Impressum/Datenschutz verlinken ins Leere; Referenzen außer
Wein-Bauer.de sind nicht ausgebaut; Teamfotos fehlen (rollenbasiert).
