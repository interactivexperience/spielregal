# NetzKombyse – drei Website-Konzepte (Prototypen)

Statische Seiten ohne Build-Step für den Betrieb. Öffnen: `netzkombyse/index.html` über einen beliebigen statischen Server
(z. B. `python3 -m http.server` im Repo-Root → `/netzkombyse/`).

| Konzept | Idee | Menü | Übergang | Signature |
|---|---|---|---|---|
| `k1/` Hafenkarte | Seekarte, Route mit Stationen | Kompass-Vollbild (Kreis-Reveal) | Welle | Kompass, Möwen, Route füllt sich |
| `k2/` Brise | Küstentag von der Düne ins Meer | Panel mit Wellenkante, Wellen-Buchstaben | Wolken ziehen auf | Wind-Headline, Leuchtturm, Postkarten, wandernde Sonne in den Folien |
| `k3/` Möwenschwarm | laut, bunt, überraschend | Aufklapp-Sticker fallen herunter | Iris + Möwe | Physik-Buchstaben, Möwenjagd (5 Möwen), Begleit-Möwe, Sammelkarten |

Je Konzept: `index` (Start), `leistung`, `case` (Wein-Bauer.de), `praesentation` (6 Folien); Menü offen = `index.html#menu`.

## Bauen
`node netzkombyse/build.mjs` erzeugt die HTML-Seiten aus `src/k1|k2|k3.mjs` und den gemeinsamen Inhalten `content.mjs`.
CSS/JS der Konzepte (`kN/style.css`, `kN/app.js`) und `shared/core.js`, `shared/deck.js` sind handgeschrieben.
Screenshots + Konsolenfehler: `node netzkombyse/tools/shots.mjs k1 <ausgabeordner>` (Playwright).

## Bewegung
`html[data-motion=on|off]`; Schalter „Bewegung“ im Header, gespeichert in `localStorage` (`nk:motion`), Standard folgt
`prefers-reduced-motion`. Nur transform/opacity/clip-path, IntersectionObserver und rAF.

## Offen vor Livegang
Kennzahlen im Case und Kundenzitate sind Platzhalter; Impressum/Datenschutz verlinken ins Leere; Referenzen außer
Wein-Bauer.de sind nicht ausgebaut; Teamfotos fehlen (rollenbasiert).
