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

Die Spiele unter `grand-austria-hotel/`, `rebel-princess/` und `three-sisters/` haben
jeweils **eigene Bildreferenzen** des Owners. Stile nicht zwischen den Spielen
übertragen oder vereinheitlichen. Jede Datei ist eigenständig: gemeinsamer Code (z.B. die
Figuren-Funktion) wurde kopiert, nicht verlinkt, sodass eine Stiländerung in einem Spiel
die anderen nicht berührt. Bei neuen Illustrationen oder UI-Änderungen immer den Stil
des jeweiligen Spiels treffen:

| Spiel (Ordner) | Referenzen des Owners | Stilregeln |
|---|---|---|
| Grand Hotel Wien (`grand-austria-hotel/`) | Schwarz-weiße „Café People“-Strichfiguren (gilt laut Owner weiterhin auch hier, nur anders umgesetzt); bunte Sticker-Figuren mit Mustern; kreidig gemalte Figur mit Kobaltblau/Pink/Gelb | **Mix:** schwarze Tuschekonturen mit leichtem Zittern (`#wob`), gefüllt mit Kreidefarben (Rot, Kobaltblau, Senfgelb, Pink, Grün), Muster auf Kleidung, Körnung; harte Kanten mit Versatzschatten; Schriften Caveat Brush + Space Mono |
| Prinzessinnenball (`rebel-princess/`) | (1) Gemalte Kreideskizze: Profil mit spitzer Nase, geschlossene Augen, schwarze Haarfläche; (2) „Café People“-Strichfiguren (vom Owner ausdrücklich kombiniert gewünscht) | **Kombination, schwarz-weiß:** Figuren wie Café People (ganze Körper, kleiner Profilkopf, breite schwarze Pullover/Röcke, Fausthände, Posen wie umarmen/tragen/knien/lümmeln, übergroße Gegenstände: Riesenapfel, Riesenfrosch, Riesenring …), gezeichnet im Kreidestrich mit Papiersprenkeln (`#crayon`); handgezogene Kartenrahmen (`#rough`), Prinzen als weiße Kreide auf Schwarz, warmer Papierton `#F4F0E9`; keine Farben außer Tusche/Papier |
| Drei Schwestern (`three-sisters/`) | Frau mit Blumenstrauß statt Kopf und gestreifter Hose; „Garden Party“-Pack mit flachen Pflanzen und Tieren; Risograph-Gartenlandschaft | **Flach ohne Konturen:** keine schwarzen Umrisse, Details im dunkleren Ton derselben Farbe, Risograph-Körnung mit weichen Kanten (`#riso`), Pfirsich-Creme-Grund `#F8ECE1`, frische Garten-Palette; Figuren mit Pflanzenstrauß statt Kopf; runde, rahmenlose UI; Schrift Fredoka |

Die Referenzbilder selbst liegen bewusst nicht im Repo (fremde Illustrationen, das Repo
wird komplett auf GitHub Pages veröffentlicht).

Jedes Spiel hat einen eigenen Smoke-Test in `test/` (`gah-smoke.mjs`,
`rebel-princess-smoke.mjs`, `three-sisters-smoke.mjs`); nach Änderungen an einem Spiel
dessen Test laufen lassen, dazu `tutorials.mjs` (spielt die Lernspiele aller drei Spiele durch), nach Änderungen an `index.html` zusätzlich
`digital-play-link.mjs` und `digital-play-tracking.mjs`.
