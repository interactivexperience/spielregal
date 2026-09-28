# Wohnungsalarm Münster

Prüft alle 30 Minuten (ca. 6–23 Uhr) Wohnungsquellen in Münster und schickt passende
Angebote als Push über [ntfy](https://ntfy.sh) aufs Handy.

## Kriterien

| | Miete | Kauf |
|---|---|---|
| **Hart** (sonst keine Meldung) | ≥ 3 Zimmer, ≤ 1.000 € **warm** | ≥ 3 Zimmer, ≤ 300.000 €, ab 1. OG |
| **Toleranz** | bis 1.100 € → 🟡 „knapp drüber“ | bis 330.000 € → 🟡 „knapp drüber“ |
| **Sterne** (★ je erfüllt) | renoviert/neu, Parkplatz, Balkon, Aufzug | + provisionsfrei |

Aussortiert werden außerdem: Tausch- und Gesuchsanzeigen, WG-Zimmer, Zwischen- und Untermiete,
Versteigerungen, PLZ außerhalb Münsters (481xx) sowie offensichtlicher Unsinn (z. B. 7 Zimmer auf 17 m²).

Ist nur die Kaltmiete angegeben, werden die Nebenkosten mit **3 €/m²** geschätzt. Die Meldung sagt dann „NK geschätzt“.
Alle Grenzwerte stehen oben in `wohnungsalarm/criteria.py`.

## Quellen

| Quelle | Art | Anmerkung |
|---|---|---|
| Kleinanzeigen | Miete + Kauf | inkl. Detailseite (Ausstattungs-Tags, Etage, Provision) |
| Immowelt (inkl. ehem. Immonet) | Miete + Kauf | nur Suchkarten, Exposés blockt Immowelt |
| WG-Gesucht (Wohnungen) | Miete | Listenpreis = Gesamtmiete |
| ohne-makler.net | Kauf (+ Miete) | immer provisionsfrei |
| Wohn + Stadtbau | Seitenwächter | meldet, sobald eine Wohnung auftaucht |
| Wohnungsverein Münster | Seitenwächter | meldet jede Änderung (aktuell: „keine freien Wohnungen“) |
| Bauverein Ketteler | Seitenwächter | meldet neue Wohnungs-Beiträge |

**Nicht abgedeckt: ImmoScout24.** ImmoScout blockt automatische Abrufe mit einem Captcha. Dafür bitte einen
Suchauftrag in der ImmoScout-App anlegen (siehe unten).

## Zuverlässigkeit

- **Ausfallwarnung:** Liefert eine Quelle ca. 2 Stunden lang keine Daten (Blockade, Seitenumbau), kommt ein
  ⚠️-Push. Alle 24 h wird erinnert, bis die Quelle wieder läuft. So fällt ein Ausfall nicht unbemerkt aus.
- **Wochenbericht:** montags ein 📊-Push („läuft, X Anzeigen geprüft“).
- **Keine Duplikate:** gesehene Anzeigen stehen in `state.json` (wird automatisch committet).
- **Preissenkung:** fällt eine vorher zu teure Anzeige in den Rahmen, kommt sie erneut.
- **Erster Lauf pro Quelle:** statt Push-Flut kommt eine Zusammenfassung der aktuell passenden Angebote.

## Einrichtung (einmalig)

1. **ntfy-App** installieren (iOS/Android) → „+“ → Topic = Wert aus dem Secret `NTFY_TOPIC` abonnieren.
2. **GitHub-Secret** setzen: Repo → Settings → Secrets and variables → Actions → *New repository secret*
   → Name `NTFY_TOPIC`, Wert = der geheime Topic-Name. Wer den Namen kennt, kann mitlesen,
   deshalb nicht weitergeben.
3. **Testlauf:** Actions → *wohnungsalarm* → *Run workflow*. Danach kommen die „🚀 Start“-Zusammenfassungen.

## ImmoScout24-Suchaufträge (manuell, einmalig ca. 5 Min.)

ImmoScout24 lässt sich nicht automatisch abfragen. Die App-Suchaufträge pushen aber in Echtzeit:

**Miete:** Wohnung mieten · Münster · Zimmer ab 3 · Preis bis 1.100 € (Umschalter **Warmmiete**, falls
angeboten; sonst Kaltmiete bis 850 €) · Suchauftrag speichern · Benachrichtigung „sofort“ + Push.

**Kauf:** Wohnung kaufen · Münster · Zimmer ab 3 · Kaufpreis bis 330.000 € · unter „Weitere Filter“
Etage: *kein Erdgeschoss*, falls verfügbar · „Provisionsfrei“ **nicht** als Filter (sonst fallen gute
Angebote weg; die Provision ist nur ein Wunsch) · Suchauftrag speichern · „sofort“ + Push.

Balkon, Aufzug und Stellplatz ebenfalls **nicht** als Filter setzen. Sie sind nur Wünsche, und viele Anzeigen
pflegen diese Felder nicht.

## Lokal testen

```bash
pip install -r requirements.txt
python -m unittest discover -s tests -t .
python -m wohnungsalarm.run --dry-run --state /tmp/state.json          # alles, nichts senden
python -m wohnungsalarm.run --dry-run --state /tmp/state.json --only immowelt
```

## Kosten

Privates Repo: ca. 1.100 Actions-Minuten pro Monat. Kostenlos sind 2.000. ntfy.sh ist kostenlos.
