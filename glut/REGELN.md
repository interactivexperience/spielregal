# GLUT – Regelentwurf v0.2

Arbeitstitel, Thema offen (Murano-Glasbläser sind nur Platzhalter). Die Zahlen unten sind exakt die in
`sim.mjs` getesteten Standardwerte. Regeländerungen immer erst mit dem Owner abstimmen und danach die
Simulation neu laufen lassen.

**Kurzfassung:** Jeder Würfel zeigt seine *Hitze* (1–6). Wer ihn einsetzt, nutzt seinen Wert – und er
kühlt dabei um 1 ab. Kalte Würfel (0) werden beim *Rasten* (Passen) neu gewürfelt. Würfel sind deshalb kein Zufall pro Zug,
sondern ein Vorrat an „Einsätzen“, den man über mehrere Züge plant.

2–4 Spieler · ca. 60–75 Min. · Kenner

## Material
- Pro Spieler 4 Würfel (Hitze), Vorrat: Sand, Soda, Holz, Glasmasse, Dukaten, Glasstücke, Gildenzeichen (B/H/M), Ruhm.
- 7 Orte, 12 Gildenkarten (4 offen), 12 Aufträge (3 offen).

## Spielablauf
Spielerzahl bestimmt Runden und Plätze je Ort:

| Spieler | Runden | Plätze je Ort | Gilden-Wertung nach Runde |
|---|---|---|---|
| 2 | 8 | 1 | 4 und 8 |
| 3 | 6 | 2 | 3 und 6 |
| 4 | 8 | 2 | 4 und 8 |

*Begründung (Simulation):* Runden müssen durch die Spielerzahl teilbar sein, sonst entsteht ein Sitzvorteil;
zwei Plätze je Ort ab 3 Spielern geben jedem Spieler in allen Besetzungen rund 25 Arbeitszüge.

**Start:** Jeder würfelt seine Würfel. Vorrat: 2 Sand, 1 Soda, 1 Holz, 3 Dukaten (bei 3 Spielern erhält der dritte Sitz 1 Dukat extra).

**Runde:** Reihum genau eine Aktion pro Zug. Die Runde endet, wenn alle gepasst haben.
**Wer zuerst passt, beginnt die nächste Runde** (in Runde 1 beginnt Sitz 1). Orte werden frei.

### Aktionen im Zug
1. **Arbeiten** – 1 Würfel (oder 2 am Blasplatz) auf einen Ort mit freiem Platz legen (jeder Ort pro Spieler
   einmal je Runde), Wirkung ausführen, danach kühlt jeder eingesetzte Würfel um 1 ab (auf 0 = kalt).
   Kalte Würfel können nicht eingesetzt werden.
   - **Anfachen (vor dem Einsetzen):** 1 Holz zahlen = Hitze +1 für diesen Einsatz, maximal bis 6, höchstens +2.
2. **Rasten (Passen)** – du bist für die Runde fertig und **würfelst alle kalten Würfel neu**. Warme Würfel behalten ihren Wert.

*Es gibt kein Schüren mitten in der Runde.* (Simulation: Mit freiem Schüren kostete Neuwürfeln kein Tempo, die Würfelzahl und
die Abkühlung hatten keinen Einfluss auf das Ergebnis. Mit Rasten bringt jeder Würfel ca. ±1 Ruhm, und früh passen
tauscht Aktionen gegen den Rundenstart.)

## Die Orte (Hitze h = Wert des eingesetzten Würfels nach Anfachen)

| Ort | Bedingung | Wirkung |
|---|---|---|
| Sandbank | beliebig | Sand: h=1…6 → 1/2/3/3/4/5 |
| Aschehütte | h ≤ 3 | +2 Soda |
| Wald | beliebig | Holz = ⌈h/3⌉ (1–2) |
| Schmelzofen | h ≥ 4 | wandelt bis zu (h−3) Sätze **2 Sand + 1 Soda → 1 Glasmasse**; +1 Meister-Zeichen |
| Blasplatz | siehe unten | Glasstück herstellen; Bläser-Zeichen |
| Kontor | h ≥ 2 | **Verkaufen** (bis ⌈h/2⌉ Stücke, +1 Händler-Zeichen) **oder Auftrag liefern** (+2 Händler-Zeichen) |
| Gildehaus | h ≥ Stufe der Karte | Gildenkarte kaufen (Dukaten), +2 Zeichen ihrer Gilde |

**Blasplatz:**
- *Schlicht* (S): 1 Würfel, 1 Glasmasse → Güte = h. Bläser +1.
- *Pokal* (P): 2 Würfel mit **gleicher** Hitze, 2 Glasmasse + 1 Holz → Güte = Summe. Bläser +2.
- *Zierglas* (Z): 2 Würfel mit **aufeinanderfolgender** Hitze (z. B. 3 und 4), 2 Glasmasse + 1 Holz → Güte = Summe. Bläser +2.

**Verkaufspreise:** S 3, P 8, Z 8 Dukaten (Basis 2/5/5 × 1,5, gerundet).

## Aufträge
3 offen. Liefern am Kontor: Stücke der geforderten Art und Mindestgüte abgeben → Ruhm (und teils Dukaten),
neuer Auftrag wird aufgedeckt. Beispiele (Güte-Anforderungen sind im Test um 3 gesenkt):

| Anforderung | Ruhm (×1,3 gerundet) |
|---|---|
| 1 Pokal | 5–7 |
| 1 Zierglas | 6–8 |
| 2 Schlicht + Dukaten | 4 (+2 Dukaten) |
| Pokal + Zierglas | 11 |
| 2 Pokale / 2 Zierglas | 9 |

## Gilden
Zeichen B (Bläser), H (Händler), M (Meister) sammeln sich durch die Aktionen oben und durch Gildenkarten.
Nach den Wertungsrunden: **1. Platz 4 Ruhm, 2. Platz 2 Ruhm** (zu zweit nur der 1. Platz); Gleichstand teilt (abgerundet).

## Gildenkarten (Stufe, Preis, Ruhm am Ende, Wirkung)
| Karte | Gilde | Stufe | Preis | Ruhm | Wirkung |
|---|---|---|---|---|---|
| Wächter | M | 3 | 7 | 2 | Dein erster Einsatz je Runde kühlt nicht ab |
| Lehrling | M | 3 | 6 | 1 | +1 Würfel (kalt) |
| Ofenmeister | M | 2 | 5 | 2 | Schmelzofen ab Hitze 3 |
| Händler | H | 2 | 5 | 2 | +1 Dukat je verkauftem Stück |
| Zunft | H | 2 | 5 | 3 | – |
| Kontorist | H | 3 | 7 | 3 | Kontor: +1 verkauftes Stück |
| Sandkarre | B | 1 | 3 | 1 | Sandbank +1 |
| Holzrecht | B | 1 | 3 | 1 | Wald +1 |
| Glasmeister | B | 2 | 5 | 2 | Glasstücke +1 Güte |
| Lehrbrief | B | 1 | 2 | 2 | – |
| Sparglut | M | 3 | 6 | 2 | Erstes Anfachen je Runde gratis |
| Aschebrenner | M | 1 | 3 | 1 | Aschehütte +1 Soda |

## Spielende und Wertung
Nach der letzten Runde (zweite Gilden-Wertung zuerst) zählen: Ruhm aus Aufträgen und Gilden, Ruhm der Gildenkarten,
**1 Ruhm je unverkauftem Glasstück**, **1 Ruhm je 4 Dukaten**. Meiste Ruhm gewinnt, Gleichstand: mehr Dukaten.

---

## Ergebnisse der Simulation v0.2 (Greedy-Bots 1000 Partien, Planer-Bots 400 Partien)

| Test | Ergebnis |
|---|---|
| Sitzbalance Greedy 2p / 3p / 4p | 50/50 % · 34/33/33 % · 27/24/28/22 % |
| Sitzbalance Planer 2p / 3p / 4p | 52/48 % · 36/31/33 % (mit +1 Dukat für Sitz 3, vorher 40/29/31 %) · 28/26/22/24 % |
| Strategien 4p Greedy (Bläser/Händler/Meister/ausgewogen) | 20 / 25 / 30 / 25 % Siege |
| Strategien 4p Planer | 27 / 21 / 28 / 26 % – keine dominante Strategie |
| Wie viel zählt Können? | Planer schlägt Greedy zu 77 %; Greedy schlägt Zufall zu 78 % und den kurzsichtigen Bot zu 66 % |
| Ruhm-Quellen 4p (Mittel 18) | Gilden 9, Karten 4, Aufträge 4, Reste 1 (Planer: Aufträge ≈ 7) |
| Würfelzahl 3 / 4 / 5 (Rasten, 2p) | 21,5 / 22,7 / 23,8 Ruhm – jeder Würfel zählt etwa +1 |
| Ohne Rasten (freies Schüren) | Würfelzahl 3/4/5 und `cool` 1/2 ohne Wirkung → Hitze-Mechanik wirkungslos |
| Abkühlen `cool=0` | Nie Kälte, Neuwürfeln entfällt → Mechanik tot |

## Offene Punkte / bekannte Schwächen (ehrlich)
1. **Planer-Bots erfüllen Aufträge deutlich öfter (≈1 vs. 0,7 je Partie, Ruhm 7 vs. 4)** – Aufträge sind also für starke
   Spieler wertvoll und nicht tot; Greedy-Bots unterschätzen sie.
2. **Gilden liefern etwa 50 % des Ruhms:** noch dominant. Kandidaten: Mindestzahl Zeichen, oder Aufträge weiter aufwerten.
3. **Händler:** je nach Botstärke schwankt er zwischen 21 und 25 %, Bläser zwischen 20 und 27 % – Streuung innerhalb von ±2σ
   bei 400–1000 Partien, daher noch keine Änderung.
4. **Rasten-Taktik (früh passen):** die Bots bewerten den Vorteil „beginnt die nächste Runde“ nicht, nur das Neuwürfeln.
   Menschen werden die Regel anders nutzen; im Spieltest prüfen, ob Passen zu früh/zu spät lohnt.
5. **Gleichstand-Regel und Endwertung** (1 Ruhm je Stück / je 4 Dukaten) sind ungeprüft in Randfällen.
6. Bots sind weiter **nur eine Annäherung**: Der Planer sucht 3 eigene Züge voraus und ignoriert Gegenzüge.
   Nächster Schritt wäre ein Monte-Carlo-Bot, der Gegenzüge mitsimuliert.
