# Spielregal — Deploy-Workflow

Dieses Repo besteht im Kern aus einer einzigen `index.html` (React-App ohne Build-Step).
Deployment läuft über `.github/workflows/static.yml`: jeder Push auf `main` triggert
automatisch ein GitHub-Pages-Deployment. Die Webapp lädt die Datei bei "Pull to Refresh"
neu — es gibt keinen separaten Build/Release-Schritt.

## Standard-Workflow für Updates

Der Repo-Owner hat am 2026-09-08 explizit autorisiert, dass Claude künftig bei jedem
Update **direkt auf `main` committet und pusht** — kein Feature-Branch, kein Pull
Request, kein manueller Merge-Schritt nötig. Das ist bewusst so gewollt, damit der
Owner nach einer Änderung nur noch per Pull-to-Refresh in der Webapp das Update sieht,
ohne selbst etwas auf GitHub tun zu müssen.

Vorgehen bei einer neuen `index.html` (z.B. per Upload im Chat, oder nach eigenen
Code-Änderungen):
1. Neue Datei-Version über die bestehende `index.html` kopieren bzw. Änderungen direkt
   in `index.html` vornehmen.
2. **Immer erst testen, dann pushen** (Owner-Vorgabe vom 2026-09-08, siehe unten) —
   Smoke-Test ausführen und grün bekommen, bevor überhaupt committet wird.
3. `git add index.html`, committen mit einer aussagekräftigen, auf den tatsächlichen
   Diff bezogenen Commit-Message.
4. Direkt auf `main` pushen (`git push origin main`, bzw. `HEAD:main` falls lokal ein
   anderer Branch ausgecheckt ist).
5. Kurz bestätigen, dass der Push erfolgt ist — kein PR nötig.

Vor dem Commit lohnt sich zusätzlich ein kurzer Blick in den Diff, um die Commit-Message
korrekt zu formulieren und offensichtliche Fehler (kaputtes HTML, abgeschnittene Datei)
zu vermeiden.

Diese Regel gilt nur für dieses Repo und überschreibt für dieses Repo generische
Vorgaben, künftig immer auf einen separaten Feature-Branch zu entwickeln.

## Testen vor jedem Push

Der Owner hat am 2026-09-08 vorgegeben: **immer erst testen, dann pushen** — kein
Update geht ungetestet auf `main`. Da `index.html` keinen Build-Step hat (JSX wird per
Babel-Standalone im Browser transpiliert), ist ein Syntax- oder Laufzeitfehler sonst
erst live sichtbar.

Test ausführen (aus dem Repo-Root):
```
cd test
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install   # nur nötig, wenn node_modules fehlt
node smoke-test.mjs
```

Was der Test macht (`test/smoke-test.mjs`):
- Lädt `index.html` headless (Playwright/Chromium, im Sandbox-Environment
  vorinstalliert unter `/opt/pw-browsers`).
- CDN-Domains (cdnjs, cdn.tailwindcss.com, fonts.googleapis.com) sind in der
  Sandbox gesperrt — React/ReactDOM/Babel werden daher aus lokal per npm
  installierten Paketen (`test/node_modules`, exakt gleiche Version wie im
  CDN-`<script>`-Tag) ausgeliefert; Tailwind/Google Fonts werden als rein
  kosmetisch gestubbt.
- Fehlschläge gegen echte Backends (Firebase, die Cloudflare-Worker-APIs,
  boardgamegeek.com) sind ohne Zugangsdaten/Netzzugang erwartet und zählen
  nicht als Fehler (siehe `EXPECTED_OFFLINE_HOSTS` im Skript).
- Fail-Kriterien: jeder unerwartete `console.error`/`pageerror`, oder wenn
  `#root` nach dem Laden leer bleibt (App hat nicht gemountet).

Exit-Code 0 + "OK — keine JS-Fehler, App hat gemountet." = grünes Licht zum Pushen.
Jeder andere Exit-Code: Fehler beheben, Test wiederholen, erst dann committen/pushen.

Falls sich CDN-Versionen in `index.html` ändern (z.B. React-Update), die Versionen in
`test/package.json` entsprechend nachziehen, damit der Stub exakt der echten CDN-Datei
entspricht.

## Browser-Spiele: Stil-Referenzen pro Spiel

Die Spiele unter `grand-austria-hotel/`, `rebel-princess/`, `three-sisters/` und `countryside/` haben
jeweils **eigene Bildreferenzen** des Owners. Stile nicht zwischen den Spielen
übertragen oder vereinheitlichen. Jede Datei ist eigenständig: gemeinsamer Code (z.B. die
Figuren-Funktion) wurde kopiert, nicht verlinkt, sodass eine Stiländerung in einem Spiel
die anderen nicht berührt. Bei neuen Illustrationen oder UI-Änderungen immer den Stil
des jeweiligen Spiels treffen:

| Spiel (Ordner) | Referenzen des Owners | Stilregeln |
|---|---|---|
| Grand Hotel Wien (`grand-austria-hotel/`) | Schwarz-weiße „Café People“-Strichfiguren (gilt laut Owner weiterhin auch hier, nur anders umgesetzt); bunte Sticker-Figuren mit Mustern; kreidig gemalte Figur mit Kobaltblau/Pink/Gelb | **Mix:** schwarze Tuschekonturen mit leichtem Zittern (`#wob`), gefüllt mit Kreidefarben (Rot, Kobaltblau, Senfgelb, Pink, Grün), Muster auf Kleidung, Körnung; harte Kanten mit Versatzschatten; Schriften Caveat Brush + Space Mono |
| Prinzessinnenball (`rebel-princess/`) | (1) Gemalte Kreideskizze: Profil mit spitzer Nase, geschlossene Augen, schwarze Haarfläche; (2) „Café People“-Strichfiguren (vom Owner ausdrücklich kombiniert gewünscht) | **Kombination, schwarz-weiß:** Figuren wie Café People (ganze Körper, kleiner Profilkopf, breite schwarze Pullover/Röcke, Fausthände, Posen wie umarmen/tragen/knien/lümmeln, übergroße Gegenstände: Riesenapfel, Riesenfrosch, Riesenring …), gezeichnet im Kreidestrich mit Papiersprenkeln (`#crayon`); handgezogene Kartenrahmen (`#rough`), Prinzen als weiße Kreide auf Schwarz, warmer Papierton (jetzt `#F8EEDC`); Figuren schwarz-weiß, aber **Kartenfarben farbcodiert** (Owner-Wunsch für lesbare Stiche): Feen blau `#DCE7F7`/`#2F5BB0`, Haustiere grün `#DCEDD2`/`#3B8546`, Königinnen rot `#F8DCD3`/`#C4452E`, Prinzen schwarz mit Rosa `#F4A6B8`. **Zweiter Owner-Stil, ausdrücklich ergänzend („weiterer Style“):** Plakat-Illustrationen mit kräftigen Farbblöcken auf Cremepapier `#F8EEDC` und schwarzem Strich, Farbfläche leicht versetzt gedruckt (Banane/Taube). Umsetzung: Karten sind Creme mit Farbblock je Farbe (Feen `#4A8FE0`, Haustiere `#2BA35A`, Königinnen `#F0643C`, Prinzen schwarz); Figurenflächen in einer Pop-Farbe mit versetzter Silhouette (`popify`, Feen Creme, Haustiere Gelb, Königinnen Rosa, Prinzen Pink). Prinzessinnen auf wechselnden Farbblöcken (`POP_PAIRS`). Titel und Überschriften in der ursprünglichen Handschrift Caveat Brush in normaler Groß-/Kleinschreibung (Owner: „Prinzessin Schrift wie vorher“ – weder Anton noch Versalien), Rundenkarte als roter Stempel `#D2452B`, Versatzschatten in Pink/Blau statt Grau; Tisch als Pfirsich-Block `#F6B48F` |
| Drei Schwestern (`three-sisters/`) | Frau mit Blumenstrauß statt Kopf und gestreifter Hose; „Garden Party“-Pack mit flachen Pflanzen und Tieren; Risograph-Gartenlandschaft | **Flach ohne Konturen:** keine schwarzen Umrisse, Details im dunkleren Ton derselben Farbe, Risograph-Körnung mit weichen Kanten (`#riso`), Pfirsich-Creme-Grund `#F8ECE1`, frische Garten-Palette; Figuren mit Pflanzenstrauß statt Kopf; Illustrationen weiter mit Fredoka-Anmutung. **App-Oberfläche** nach Owner-Referenzen „App Style für Three Sisters“ (minimalistische Homescreens): gedeckte Farbbänder (Staubblau `#7FA3C6`…`#B9C3CD`, Pfirsich `#DCC6BB`, Schiefer `#5E6E9A`, Mauve `#A496AB`, Erde `#8A7867`), – gilt **nur für Typografie und Oberfläche** (Owner: „Es geht um die App-Typo, Minimalismus“); Startbild, Cover und alle Illustrationen bleiben im Riso-Gartenstil – lichtgrauer Grund `#E9E6E8`, Karten `#F7F5F6` ohne 3D-Schatten, Marineblau `#2B3245` für Schrift, Knöpfe und „du bist dran“ (Staubblau), gedämpfte Zonen-/Rondellflächen; große klare Titel mit Punkt („Drei Schwestern.“), Schrift DM Sans |
| Landgut (`countryside/`, Original „Countryside“) | Owner-Referenzen „Stil für Landgut“ (ersetzt den früheren Aquarell-/Ghibli-Stil): flache Gouache-Wildblumenwiese (Mohn, Tulpen, Margeriten, Lavendel) vor blassblauen Hügeln; Figuren zwischen übergroßen Blumen mit Ringelkleidung; zwei Umarmende mit Strauß vor dichtem Blumenmuster auf Petrol; drei Freunde in körnigem Kreidestil | **Flache Gouache mit Kreidekorn:** flache Farbflächen mit leicht trockenem Pinselrand (`#gouache`), Kreidesprenkel über dem Bild (`#tooth`), keine schwarzen Konturen; Cremegrund `#F4EAD5`, blassblaue Hügel `#C9DAE3`/`#AAC3D3`, Salbeiwiese `#A9B98C`; Blumen mit gepunkteter Mitte; Figuren als schlanke Erwachsene im Profil (Owner-Feedback: „zu kindlich“ vermeiden): kleiner Kopf mit Nase, geschlossenes Auge, rote Wange, Ohrring; Ringel-, Karo- oder Blümchenmuster, schmale Hosen/A-Röcke, kleine Schuhe, Gegenstand in der vorgestreckten Hand; übergroße Blumen vor den Beinen; Körnung bewusst fein und dezent (Owner: „zu stark“), Szenen dicht (ferne Bäumchen, Grashalme, Blumenvordergrund); Personenkarten auf dichtem Blumenmuster in Petrol `#2E5652`; gedeckte Palette (Mohnrot, Senf, Oliv, Lavendel, Hellblau); **App-Oberfläche** nach den Owner-Referenzen „App Style für Landgut“ (moderne Wellness-/Journal-Apps, Editorial-Layouts): warmer Greige-Grund `#ECE7E2`, weiße Karten mit großen Radien (24–32 px) ohne schwere Schatten, Gebiete als Pastellflächen (Wiese `#DFE8CF`, Haus `#F6D6D1`, Stall `#D6E4F2`, Acker `#FCE7B0`, Garten `#E3DCFB`, kräftige Typfarben `#7C9A4A`/`#D9735F`/`#5B86B5`/`#E2A21E`/`#8C74D6`), gelbe Pill-Knöpfe `#FDBA2C` mit dunkler Schrift `#1F1A17`, tiefes Lila `#4B3A6E` für „du bist dran“ und Hervorhebungen, große Titel. **Schrift** nach Owner-Referenz „Landgut Schrift“: Titel und große Zahlen in der kräftigen Serife Fraunces, Akzente (Untertitel „dein Traum vom Bauernhof.“ mit Schwung-Unterstrich, Lernspiel-Kapitel, „Warum?“) in oranger Handschrift Caveat, Fließtext/Bedienung in Outfit. Abgrenzung zu Drei Schwestern: dort Riso ohne Körnung-Sprenkel, Blumenstrauß statt Kopf, Pfirsichgrund, Fredoka – hier echte Gesichter und Kreidekorn |

Die Referenzbilder selbst liegen bewusst nicht im Repo (fremde Illustrationen, das Repo
wird komplett auf GitHub Pages veröffentlicht).

In jedem Spiel stehen die eigenen Vorräte immer sichtbar in einer Leiste unter der Kopfzeile
(Owner: „Müssen immer sichtbar sein“): Grand Hotel Wien Kronen/SP/Kaiser/Küche/Hand/freie Zimmer,
Drei Schwestern Kompost/Waren/Punkte, Landgut Münzen/Waren/Körbe/Arbeitskräfte/Hand x/12;
im Prinzessinnenball sind Hand und Anträge ohnehin immer sichtbar. Der Lernspiel-Coach muss sich
deutlich von den Spielelementen abheben (je Spiel im eigenen Stil).
Mitspieler-Chips stehen in einer eigenen Zeile unter der Überschrift; Verlassen/Beenden liegt während
der Partie im Menü (☰), nicht in der Kopfzeile. **Langes Drücken** (≈0,45 s) auf ein Element mit
`data-info` (oder `title`) zeigt eine Info-Blase (Owner-Wunsch „länger auf Elemente klicken, um mehr
Infos zu bekommen“); neue Spielelemente bekommen einen erklärenden `data-info`-Text. Textauswahl ist in den Spielen abgeschaltet (iOS-Lupe/Menü
beim langen Drücken), außer in Eingabefeldern. Die Ansage („Du bist dran …“) steht kompakt in der
Kopfzeile und bleibt beim Scrollen sichtbar (Prinzessinnenball: Ansage in der festen Handleiste).
Ansage und Nachricht im Footer sind antippbar (`data-a="go"`, `goTarget`/`goTo`): Scrollen zur passenden Stelle mit
kurzem Aufblitzen bzw. Öffnen der offenen Auswahl; im Lernspiel springt es zum markierten Element.
In allen Auswahlfenstern bleibt der Schließen-Knopf beim Scrollen oben sichtbar (sticky), und die letzte
Knopfzeile (`.btnrow`, z. B. „Nehmen“, „Bestätigen“) steht unten fest, sobald das Fenster scrollt (`stickBtns`). Grand Hotel Wien „Personal wählen“:
zentriertes 3er-Raster, gewählte Karten angehoben mit grünem Rand und Band „✓ behalten“, Zählerknopf unten fest.
Beim Scrollen (ab ~90 px, `.top.scr`) entfällt das Menü und eine überflüssige Titelzeile: Drei Schwestern blendet
„Drei Schwestern.“ samt Menü aus, Grand Hotel die Rundenzeile (Runde rückt als Pille „R x/7“ in die Vorratsleiste),
Landgut und Prinzessinnenball nur das Menü (Nacht/Stich/Regel bleiben). Oben angekommen erscheint alles wieder.
Menü aller Spiele: „Neueste Version laden“ (lädt die Spielseite am Cache vorbei neu und setzt die gespeicherte Partie
automatisch fort, `?resume=1`). Landgut: Auswahlfenster am Griff nach unten ziehen oder Pfeil = einklappen (weiche
Animation), eingeklappt als Mini-Vorschau unten rechts; Siegpunktleiste als Wiesenpfad mit Köpfen; Ablagestapel
per Antippen einsehbar; Auftragsplättchen zeigen statt Sternen/Seite „Je Feld mehr nötig“ (A) bzw. „Gleiche Bedingung“ (B).
Landgut-Kartenhand (Owner-Vorbild: digitales „Root“): enger, gewölbter Fächer als eigene Ebene direkt hinter dem Footer
(ragt über dessen Rand, keine eigene „Tasche“);
antippen = Karte groß (ohne Hintergrund/Dialog, schwebt über dem Spielfeld), gedrückt halten und am Fächer entlangfahren =
jeweils die Karte unter dem Finger groß, nach oben wischen (Karte folgt dem Finger) = einsetzen über das günstigste
Sonnenfeld; das gewählte Feld steht während der Geste unter der großen Karte. Keine Knöpfe (Owner: „unschön“); ein
anderes Feld wählt man über den Arbeitsplan. Auf Handkarten keine Info-Blase. Im Lernspiel ist der Fächer ausgeblendet.
Landgut-Arbeitsplan: jedes Aktionsfeld trägt eine kleine Illustration (`FIELD_ART`/`MARKET_ART`); der Markt ist als eigener
Marktstand abgesetzt (Cremefläche mit gestreifter Markise, gestrichelte Felder, „nur beim Tag beenden“). Arbeitskräfte sind
kleine Bäuerinnen mit Strohhut und Ringelshirt in der Spielerfarbe (`workerSvg`); eingesetzt liegen sie oben rechts
auf dem Feld und ragen darüber hinaus (wie Edith in Drei Schwestern), ohne Text zu verdecken, mit kurzer Fall-Animation.
Der Handfächer schaut deutlich über den Footer-Rand (Owner: „höher rausschauen“). Ist keine Arbeitskraft mehr frei oder passt
kein Feld, sagen Ansage und Fußleiste „Jetzt den Tag beenden“ statt Optionen anzubieten. **Zug rückgängig** (↶ in der
Fußleiste und im Menü): Schnappschüsse vor Feld/Karte/Antwort/Tag beenden; der Stapel verfällt, sobald verdeckte Infos
aufgedeckt werden (Nachziehstapel oder Gebietsstapel schrumpft) oder ein Bot dran ist; im Lernspiel aus.
Drei Schwestern soll **immersiv** sein (Owner: Listenauswahl „lieblos und gleichförmig“): Leisten-Auswahl
(Stauden, Bienenstock, Hof, Schuppen) direkt auf dem Bogen – das nächste Kästchen leuchtet, ✎-Zeile nennt die Belohnung –
statt Liste; Effekte nach jedem Neuzeichnen per Zustandsvergleich (`fxSnap`/`fxAfter`): Stempel für neue Kästchen,
Pflanz-Plopp, Ernte-Glöckchen mit fliegenden Waren/Punkten, Würfel rollen herein, genommene Würfel fliegen zur
Person, Edith hüpft; synthetische Töne (WebAudio, `SND`) mit Schalter im Menü; `prefers-reduced-motion` respektiert.
Drei-Schwestern-Kopf: Titel „Drei Schwestern.“, Runde als dunkle Pille in der Vorratsleiste; Mitspieler-Pillen zeigen die
Würfelwahlen der Runde als Punkte (gefüllt = gewählt) statt einer Reihenfolge-Zeile. Das Aktionsrondell ist ein umlaufendes
Rechteck (7 Felder im Uhrzeigersinn um die Mitte, verbunden durch ein weiches Laufband `.trk`, keine Pfeile – Owner:
„Pfeile passen nicht zum Stil“; goldene Nadel oben links), das Ereignis der Runde steht in der Mitte, darunter die
Ereignisleiste 1–8; der gemeinsam genutzte niedrigste Würfel trägt die Marke „alle“. Erklärungen stehen nicht als grauer
Text daneben, sondern hinter einem i-Knopf (`data-a="info"`, Antippen = Info-Blase) bzw. langem Drücken. Legenden sind
Symbol-Chips mit einem Wort (`lgChip`), Details per langem Drücken statt verkürzter Fließtexte. Jeder Bogen-Abschnitt (Garten, Stauden,
Bienenstock, Hof, Schuppen) beginnt mit einem großflächigen Riso-Bildstreifen (`scene`/`sceneHead`, Titel + SP darauf)
wie die Illustrationen des echten Bogens; Gartenzonen zeigen Erdreihen (`.zbg`), zarte Riso-Pflanzen hinter jeder Kästchenspalte (`PLANT_BG`: Mais-Halm,
Bohne an der Stange, Kürbisranke) und kleine Gartendetails in leeren Ecken (`.zdeco`). Legenden ohne Pillen; Warenleiste
mit Zwischenschritten je Ware und „Noch X bis zum nächsten ★“. Owner: weniger „technisch“, Lesbarkeit
und Bedienung haben aber Vorrang – Kästchen und Knöpfe bleiben unverändert.
**Drei Wischseiten auch in Drei Schwestern** (Rondell · Garten · Bogen mit Chronik) **und Grand Hotel Wien** (Brett:
Extras, Warteschlange, Aktionsbrett · Hotel: Tische, Küche, Hotel · Wien: Personal, Kaiser, Politik, Chronik) – gleiche
Technik wie Landgut (`.pages`, `.pdots` im Footer, Punkt in Spielfarbe markiert die Seite mit offener Aktion `ACT_SEL`).
Automatischer Seitenwechsel bei neuem Zugschritt (`autoPage`, nicht im Lernspiel): Grand Hotel Zugbeginn → Brett, nach
der Würfelwahl → Hotel; Drei Schwestern Würfel nehmen → Rondell, eigene Gartenaktionen → Garten.
In Drei Schwestern und Grand Hotel wird die Ansage beim Scrollen ebenfalls zur Sprechblase mit Kopf (`.top.scr`, Antippen
klappt sie kurz auf). Die Vorräte unter den Personenpillen stehen in allen Spielen ohne Pillen (Platz sparen). Grand Hotel:
Das Dach des Hotelplans zeigt wie im Original die Auslastungsboni je Farbe (Gruppengröße als Kästchen → Kronen/SP/Kaiser).
Landgut ist auf **drei Wischseiten** verteilt (`.pages`, Scroll-Snap): Auslage & Aufträge · Mein Hof (Siegpunktpfad,
Gebiete, Chronik) · Arbeitsplan; Seitenwahl nur als drei kleine Punkte oben im Footer (`.pdots`, Owner: „nur als 3 kleine Indikatoren“; lila Punkt
am Arbeitsplan, wenn du dran bist), Kopf kompakt (Spieler-Pillen + Menü in einer Zeile), Ziel 30 SP bzw. Solo-Stapel als
dunkle Pille in der Vorratsleiste. Die Ansage schwebt kompakt unter dem Kopf und wird beim Scrollen zur Sprechblase mit
nur dem Kopf der Person (`.top.bub`; Antippen klappt sie kurz auf). Bildsprache im Arbeitsplan/Markt: Sonne = Karte
ausspielen, grünes + = bekommen, rotes − = abgeben, → = wird zu (`IG`/`ARR`); Abwerfen darf nie wie Ziehen aussehen. Arbeitsplan-Seite ohne eigenen Rahmen; nur der Markt
ist ein Kasten mit überstehender gestreifter Markise und Schild „Markt“, darunter klein die Marktkräfte (2/3/4 Figuren →
Aktionen). Gesperrte Felder (Arbeitsplan, Markt, „Freischalten“ am Ende) sind gestrichelt mit Schloss, die Marker liegen
als Spielsteine in Spielerfarbe darauf; ein einziger Satz unter „Freischalten“ erklärt das Wegnehmen pro erfülltem
Auftrag (keine doppelten Infos – Owner: „nur wenn wirklich wichtig oder nötig für den Spielfluss“). Gemeinsame Aufträge
sind angeheftete Zettel mit Preis-Rosetten je Stufe (Bonus-Karte als grünes +, nächste freie Stufe hinterlegt, belegte
Stufe mit Spielstein); von dir erfüllte Aufträge und eigene Gebietsaufträge sind grün mit Stempel „✓ erfüllt“.
Ablagestapel-Link mit Stapel-Bild. Karten einer Reihe sind gleich hoch (`eqCards`), Kartenradien schmal (11/8 px).
Hinweis unter der großen Handkarte in neutralem Dunkel (nie Knopffarben), Text je Geste: wischen → „Weiter nach oben
ziehen …“ → „Loslassen = einsetzen“ (Petrol). Menü: „Neueste Version laden“ als Textlink ganz unten mit Abstand. `goTo` und der Lernspiel-Coach wechseln automatisch auf die
Seite des Ziels; während des Wischens wird nicht neu gezeichnet (`render` wartet). Kopfzeilen (`.thead`) sind in allen
Spielen deckend in der Seitenfarbe, ohne milchigen Blur (Owner: „kein milchiger Hintergrund“).

Jedes Spiel hat einen eigenen Smoke-Test in `test/` (`gah-smoke.mjs`,
`rebel-princess-smoke.mjs`, `three-sisters-smoke.mjs`, `countryside-smoke.mjs`); nach Änderungen an einem Spiel
dessen Test laufen lassen, dazu `tutorials.mjs` (spielt die Lernspiele aller vier Spiele durch) und
`save-leave.mjs` (Speichern & verlassen, Fortsetzen, Rückfrage vor dem Überschreiben), nach Änderungen an `index.html` zusätzlich
`digital-play-link.mjs`, `digital-play-tracking.mjs` und `dashboard-browser-games.mjs`
(Dashboard-Abschnitt „Im Browser spielen“; Three Sisters wird über den Titel erkannt,
weil der Owner die **Harvest Edition** besitzt).

## Regelgrundlage der Browser-Spiele

Die Spiele folgen den Regelheften, die der Owner hochgeladen hat (nicht im Repo):
Grand Austria Hotel (Grundspiel + „Alles Walzer“ inkl. Solo-Automa Leopold), Three Sisters
Harvest Edition (inkl. Solo gegen Farmerin Edith), Rebel Princess Deluxe Edition +
„Doppelt Rebellisch“ + Wonderbow-FAQ, Countryside/Landgut. Grand Hotel Wien nutzt die Inhalte aus dem Anhang des Regelhefts (Effekte aller
Personal- und Gästekarten, 12 Politikkarten, 12 Kaiserplättchen) und vom Spielplan
(Kaiserleiste, Hotelplan, Auslastungsboni, Gästereihe 3/2/1/0/0); Drei Schwestern nutzt die
Bogen-Abbildung auf S. 2 des Regelhefts. Was die Regelhefte nicht
abdrucken (Karteninhalte, Aufdruck der Bögen/Leisten), ist jeweils im Abschnitt
„Unterschiede zum Original“ der Spielregeln im Spiel offen benannt; bei Änderungen dort
mitpflegen.
