// Prueft die Komplexitaetsskala (BGG-Weight 1-5 -> Einstufung). Reine Funktion, wird aus index.html gezogen.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const html = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "index.html"), "utf8");
const a = html.indexOf("function complexityLabel(game)");
const b = html.indexOf("\n}\n", a) + 3;
const complexityLabel = new Function(html.slice(a, b) + "\nreturn complexityLabel;")();
let ok = true; const check = (l, c) => { console.log(l + ":", !!c); if (!c) ok = false; };
const L = (w, categories = []) => complexityLabel({ complexity: w, categories });
check("Ark Nova (BGG ~3.79) ist ein Expertenspiel", L(3.79) === "Expertenspiel");
check("Bitoku (BGG ~3.76) ist ein Expertenspiel", L(3.76) === "Expertenspiel");
check("Grenze: 3.64 noch Kenner+, 3.65 Experte", L(3.64) === "Anspruchsvolles Kennerspiel" && L(3.65) === "Expertenspiel");
check("Terraforming Mars (~3.2) bleibt Kennerspiel, Scythe (~3.4) ist Kenner+", L(3.2) === "Kennerspiel" && L(3.4) === "Anspruchsvolles Kennerspiel");
check("Untere Stufen unveraendert (1.2 Einsteiger, 1.8 Familie, 2.2 Familie+, 2.7 Kenner-)", L(1.2) === "Einsteigerspiel" && L(1.8) === "Familienspiel" && L(2.2) === "Gehobenes Familienspiel" && L(2.7) === "Leichtes Kennerspiel");
check("Partyspiel weiter nach Kategorie, kein Wert -> null", L(3.9, ["Party Game"]) === "Partyspiel" && complexityLabel({}) === null);
console.log(ok ? "Skala-Test bestanden" : "FEHLER"); process.exit(ok ? 0 : 1);
