# Zwischenland – Simulationsergebnisse

`node sim.mjs [partien] [personen]` – Bots mit 4 Strategien (Kette, Schließer, Meister, Ausgewogen) plus Zufall als Kontrolle.
Die Bots spielen gierig mit einer Bewertungsfunktion (1 Zug Vorausschau). Ergebnisse zeigen **Tendenzen**, keine Wahrheit.

## Was die Simulation am Design verändert hat
| Problem in der Simulation | Designänderung |
|---|---|
| Niemand beendet das Spiel: Ketten laufen lassen bringt immer mehr als Reihen schließen (Partien über 200 Punkte) | **Ruhm nur in geschlossenen Reihen** – offene Reihen bringen nur Münzen |
| Karten als Effekt sind fast immer attraktiver als Bauen; das Land wächst kaum (6 von 20 Feldern) | **Eine Karte für die Tat, eine fürs Land** – jeder Zug baut oder veredelt zwangsläufig |
| Einschieben ist zu bequem, Bots schieben statt zu bauen | **Einschieben nur unter Plättchen in geschlossenen Reihen** |
| Ende mit allen 4 Reihen ist unerreichbar | Ende bei **3 geschlossenen Reihen**, Auslöser +4 (Erntedank) |
| Halbe Ketten bringen nichts, der Anfang ist zäh | **Rest am Kettenende: je 2 Waren 1 Münze** |
| Raster 4×8 zu groß für ~20 Züge | Raster **4×5** |

## Kniff-Test: Jahreszeiten (feste Richtung) vs. freie Richtungswahl – 300 Partien je Zeile
| | Siegquoten Kette/Schließer/Meister/Ausgewogen | Abstand 1./2. | Ø Runden | Aufholjagd* | Ende durch Auslöser |
|---|---|---|---|---|---|
| 3 Pers., frei | 28 / 50 / 44 / 44 % | 19,1 | 17,6 | 38 % | 69 % |
| 3 Pers., **Jahreszeit** | 31 / 39 / 52 / 44 % | **11,8** | 17,6 | 37 % | 67 % |
| 2 Pers., frei | 59 / 68 / 60 / 63 % | 33,2 | 20,2 | 20 % | 53 % |
| 2 Pers., **Jahreszeit** | 60 / 67 / 63 / 60 % | **23,8** | 20,5 | 22 % | 50 % |

\* Anteil der Partien, in denen die Führende nach Runde 8 am Ende nicht gewinnt. Zufall gewinnt in allen Varianten 0 % → Können zählt.

**Lesart:** Der Jahreszeiten-Kniff macht Partien deutlich knapper (Abstand −30 bis −40 %), ohne eine Strategie zu bevorzugen.
Kettenlänge Ø 3,6–3,8 Glieder, längste 5 (begrenzt durch 5 Felder je Reihe).

## Offene Baustellen
1. **Marktkarten zu schwach:** Siegerpläne bestehen zu ~60 % aus Startkarten. Marktkarten brauchen mehr Wirkung pro Feld.
2. **Grenzgänger (Kräuter) kaum gespielt** (3–6 %): Ketten über die Grenze lohnen sich noch nicht genug.
3. **Zu zweit zu lang:** in der Hälfte der Partien greift die Rundengrenze; Aufholjagd nur ~20 %.
4. **Lange Ketten unmöglich:** maximal 5 Glieder, weil eine Reihe 5 Felder hat (Idee: Reihen-Übergänge).
5. Bots sind einfach gestrickt – vor einem Feinschliff braucht es bessere Bots (z. B. Vorausschau über Runden).
