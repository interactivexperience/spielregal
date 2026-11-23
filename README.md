# Kinder-Journal

Privates Journal für Baby, Kleinkind und Kind als installierbare Web-App (PWA) für iOS.
Kostenlos, ohne Konto, ohne Server. **Dieses Repo enthält nur Programmcode – nie Einträge.**

## Funktionen
Kinderprofile mit Alter · Einträge mit Text, Tags, ★ Meilenstein · Fotos und Videos · Messwerte mit
Wachstumsdiagramm · Suche, Kalender, „An diesem Tag“ · verschlüsseltes Backup (ZIP) → Dateien-App → pCloud.

## Sicherheitsmodell
- **Verschlüsselung:** AES-256-GCM für alle Inhalte (Text, Medien, Namen, Geburtsdaten). Zufälliger Datenschlüssel,
  geschützt durch Passwort (PBKDF2-SHA256, 600.000 Runden). Datensätze sind an ihre ID gebunden (AAD), Medien
  blockweise mit authentifizierter Reihenfolge – Manipulation, Vertauschen und Abschneiden werden erkannt.
- **Schlüssel** liegt nur im Arbeitsspeicher (nicht exportierbar) und wird beim Sperren verworfen.
- **Kein Netz:** Content-Security-Policy `default-src 'none'; connect-src 'none'` – kein eval, kein Inline-Code, keine Fremdressourcen.
- **Backup** besteht nur aus Chiffretext (+ Tresor-Header). Header werden beim Einlesen geprüft (KDF-Mindest-/Höchstwerte).
- **Einbettung** in fremde Frames wird verhindert.

## Grenzen (ehrlich)
- Kein System ist „hackersicher“. Schutz = Passwortstärke + Gerätesperre. Passwort vergessen = Daten weg.
- Wer die Hosting-Seite kontrolliert, könnte beim nächsten Laden manipulierten Code ausliefern. Deshalb: **privates Repo,
  2-Faktor-Anmeldung, Zugriff auf Hosting klein halten.** (HTTP-Header wie `frame-ancestors` setzt GitHub Pages nicht.)
- Der Hosting-Anbieter sieht beim Laden die IP-Adresse, nie die Daten.
- Rein private Nutzung fällt unter die Haushaltsausnahme der DSGVO (Art. 2 Abs. 2 c); das ist keine Rechtsberatung.

## Installieren (iPhone)
1. Dateien per HTTPS bereitstellen (z. B. GitHub Pages eines **privaten** Repos).
2. In Safari öffnen → Teilen → „Zum Home-Bildschirm“ (nur so schützt iOS die Daten vor automatischem Löschen).
3. Passwort festlegen, Kind anlegen. Regelmäßig: Einstellungen → Backup → in Dateien/pCloud sichern.

## Tests
`NODE_PATH=<pfad zu playwright> node tests/function-test.cjs` und `node tests/security-test.cjs`
(Playwright/Chromium; prüfen u. a. XSS, CSP, Manipulation, bösartige Backups, Brute-Force-Sperre, Restore).
