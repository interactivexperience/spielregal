// Prueft das Ranking per Wischen: Dashboard-Karte, Binaersuche-Duelle (rechts = lieber,
// links = weniger, 'Gleich gut' = gleicher Platz), Rueckgaengig, Wischen per Zeiger, Fortsetzen nach
// Neuladen, Enthuellung + Top-10-Karte, komplette Rangliste und Nachruecken neuer Spiele.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const vendor = (...p) => path.join(__dirname, "node_modules", ...p);
const server = http.createServer((req, res) => {
  try { res.writeHead(200); res.end(readFileSync(path.join(repoRoot, decodeURIComponent(req.url.split("?")[0])))); }
  catch { res.writeHead(404); res.end("nf"); }
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;
const twCss = readFileSync(path.join(__dirname, "tw-built.css"), "utf8");

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const SP = "/tmp/claude-0/-home-user-spielregal/1b3178af-aefe-5c15-b39c-8a87c8dc09b0/scratchpad";
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: false });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("dialog", (d) => d.accept());
await page.route("**/cdnjs.cloudflare.com/**/react.production.min.js", r => r.fulfill({ path: vendor("react","umd","react.production.min.js"), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/react-dom.production.min.js", r => r.fulfill({ path: vendor("react-dom","umd","react.production.min.js".replace("react.","react-dom.")), contentType: "application/javascript" }));
await page.route("**/cdnjs.cloudflare.com/**/babel.min.js", r => r.fulfill({ path: vendor("@babel","standalone","babel.min.js"), contentType: "application/javascript" }));
await page.route("**/cdn.tailwindcss.com/**", r => r.fulfill({ contentType: "application/javascript", body: `window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(twCss)};document.head.appendChild(s);})();` }));
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));

// Staerke = wahre Vorliebe. Gleiche Staerke -> "Gleich gut".
const strength = { Azul: 9, Brass: 8, Catan: 7, Dixit: 6, Everdell: 6, Fluxx: 4, Gloomhaven: 3, Hanabi: 2 };
const names = Object.keys(strength);
const base = { status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-01-01" };
const games = [...names.map((n, i) => ({ ...base, id: "g" + i, name: n })),
  { ...base, id: "gx", name: "Ungespielt" },                                   // keine Partie -> nicht dabei
  { ...base, id: "gexp", name: "Azul: Erweiterung", expansionOf: "g0" }];     // Partie zaehlt zum Basisspiel
const play = (id, gameId) => ({ id, gameId, gameName: gameId, date: "2026-09-01", mode: "physical-owned", players: "", playerIds: [], winner: "", scores: {}, notes: "", images: [] });
const plays = [...names.map((n, i) => play("p" + i, "g" + i)), play("pe", "gexp")];
await page.addInitScript((d) => {
  if (localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1");
  localStorage.setItem("spielregal:games", JSON.stringify(d.games));
  localStorage.setItem("spielregal:plays", JSON.stringify(d.plays));
  localStorage.setItem("spielregal:theme", "dark");
}, { games, plays });
const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:games")));
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2000);

const card = page.locator("[data-ranking-duel]");
console.log("Dashboard: Karte 'Mein Ranking' mit 'Ranking starten':", await page.locator("[data-dash-ranking] [data-rank-start]").count() === 1 && (await page.locator("[data-dash-ranking]").innerText()).includes("8 gespielten"));
await page.locator("[data-rank-start]").click(); await page.waitForTimeout(500);
await page.screenshot({ path: `${SP}/ranking_duel.png` });
const info = async () => ({ cur: (await page.locator("[data-rank-card] p.font-display").innerText()).trim(), ref: (await page.locator("[data-rank-ref] p.font-medium").innerText()).trim() });
let duels = 0, undone = false;
const ansFor = (cur, ref) => (strength[cur] > strength[ref] ? "better" : strength[cur] < strength[ref] ? "worse" : "equal");
for (let guard = 0; guard < 60; guard++) {
  if (await page.locator("[data-ranking-result]").count()) break;
  if (!(await card.count())) { await page.waitForTimeout(150); continue; }
  const { cur, ref } = await info();
  const a = ansFor(cur, ref);
  if (duels === 3 && !undone) {
    // Rueckgaengig: Antwort geben, zurueck, selbe Karte + selbe Referenz wieder da
    await page.locator(`[data-rank="${a}"]`).click(); await page.waitForTimeout(350);
    await page.locator("[data-rank-undo]").click(); await page.waitForTimeout(350);
    const again = await info();
    console.log("Rueckgaengig: dieselbe Karte und dasselbe Referenzspiel wie vorher:", again.cur === cur && again.ref === ref);
    undone = true; continue;
  }
  if (duels === 5) {
    // Wischen per Zeiger: Karte nach rechts/links ziehen
    const box = await page.locator("[data-rank-card]").boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + 60); await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + (a === "worse" ? -170 : 170), box.y + 60, { steps: 6 }); await page.mouse.up();
    if (a !== "equal") { duels++; await page.waitForTimeout(500); continue; }
  }
  if (duels === 6) {
    // Neuladen mitten drin: Fortschritt bleibt, Duell geht weiter
    const beforeRanked = (await stored()).filter((g) => Number.isInteger(g.rankPos)).length;
    await page.reload({ waitUntil: "networkidle" }); await page.waitForTimeout(1500);
    const stillCard = await page.locator("[data-dash-ranking]").innerText();
    console.log("Neuladen: Dashboard zeigt Fortschritt '… von 8 Spielen eingeordnet':", /von 8 Spielen eingeordnet/.test(stillCard) && beforeRanked > 0);
    await page.locator("[data-rank-start]").click(); await page.waitForTimeout(500);
    duels++; continue;
  }
  await page.locator(`[data-rank="${a}"]`).click(); await page.waitForTimeout(duels < 5 ? 300 : 250);
  duels++;
}
await page.waitForTimeout(600);
const st = (await stored());
const rankedGames = st.filter((g) => Number.isInteger(g.rankPos));
console.log("8 Spiele eingeordnet; 'Ungespielt' und Erweiterung nicht:", rankedGames.length === 8 && !st.find((g) => g.id === "gx").rankPos && !st.find((g) => g.id === "gexp").rankPos);
const order = [...rankedGames].sort((a, b) => a.rankPos - b.rankPos);
const sortedTruth = [...names].sort((a, b) => strength[b] - strength[a]);
const placeOf = (n) => rankedGames.find((g) => g.name === n).rankPos;
console.log("Reihenfolge stimmt mit der wahren Vorliebe ueberein:", names.every((a) => names.every((b2) => strength[a] <= strength[b2] || placeOf(a) < placeOf(b2))));
console.log("Dixit und Everdell (gleich gut) teilen sich einen Platz:", placeOf("Dixit") === placeOf("Everdell"));
console.log("Anzahl Duelle klein (Binaersuche, nicht alle 28 Paare):", duels <= 18, "(" + duels + ")");

// Enthuellung
console.log("Enthuellung startet bei Platz 10 -> hier der letzte Platz (8) zuerst:", await page.locator("[data-rank-reveal]").count() === 1 && (await page.locator("[data-rank-reveal]").innerText()).includes("Hanabi"));
await page.screenshot({ path: `${SP}/ranking_reveal.png` });
await page.locator('button:has-text("Überspringen")').click(); await page.waitForTimeout(500);
const topTxt = await page.locator("[data-top10-card]").innerText();
console.log("Top-10-Karte zeigt Azul auf Platz 1 und alle 8 Spiele:", topTxt.indexOf("Azul") < topTxt.indexOf("Brass") && names.every((n) => topTxt.includes(n)));
console.log("Gleichauf-Hinweis bei Dixit/Everdell:", (topTxt.match(/gleichauf/g) || []).length === 2);
console.log("Komplette Rangliste mit 8 Eintraegen:", await page.locator("[data-rank-all] li").count() === 8);
await page.screenshot({ path: `${SP}/ranking_top10.png` });
await page.locator("button[aria-label='Schließen']").click(); await page.waitForTimeout(500);
console.log("Top-Streifen beginnt links bei Platz 1 (scrollLeft 0):", await page.locator("[data-rank-top]").evaluate((el) => el.scrollLeft) === 0);
await page.screenshot({ path: `${SP}/ranking_dashboard.png` });
console.log("Dashboard danach: Top-Streifen + 'Rangliste ansehen':", await page.locator("[data-rank-top]").count() === 1 && await page.locator("[data-rank-open]").count() === 1);

// Neues Spiel nachruecken
await page.evaluate(() => {
  const gs = JSON.parse(localStorage.getItem("spielregal:games")); const ps = JSON.parse(localStorage.getItem("spielregal:plays"));
  gs.push({ id: "gnew", name: "Ingenious", status: "owned", categories: [], mechanisms: [], publishers: [], designers: [], images: [], addedDate: "2026-02-01" });
  ps.push({ id: "pnew", gameId: "gnew", gameName: "Ingenious", date: "2026-10-01", mode: "physical-owned", players: "", playerIds: [], winner: "", scores: {}, notes: "", images: [] });
  localStorage.setItem("spielregal:games", JSON.stringify(gs)); localStorage.setItem("spielregal:plays", JSON.stringify(ps));
});
await page.reload({ waitUntil: "networkidle" }); await page.waitForTimeout(1500);
console.log("Neues Spiel mit Partie: Dashboard bietet '1 neues Spiel einordnen':", (await page.locator("[data-dash-ranking]").innerText()).includes("1 neues Spiel einordnen"));
await page.locator("[data-rank-start]").click(); await page.waitForTimeout(500);
for (let g = 0; g < 6 && await card.count(); g++) { const { ref } = await info(); await page.locator('[data-rank="better"]').click(); await page.waitForTimeout(300); }
await page.waitForTimeout(500);
const st2 = await stored();
console.log("Ingenious ganz oben einsortiert (immer 'lieber'), die anderen eine Stufe nach unten:", st2.find((g) => g.name === "Ingenious").rankPos === 1 && st2.find((g) => g.name === "Azul").rankPos === 2);
console.log("Danach Rangliste statt leerer Seite:", await page.locator("[data-ranking-result]").count() === 1);

// --- Feinrunde: Top 10 gegeneinander (hier 9 Spiele, 35 Paare ohne das gleichauf liegende Paar)
if (await page.locator('button:has-text("Überspringen")').count()) await page.locator('button:has-text("Überspringen")').click();
await page.waitForTimeout(500);
const fineBtn = page.locator("[data-rank-fine]");
console.log("Feinrunde: Knopf mit 35 Duelle:", await fineBtn.count() === 1 && (await fineBtn.innerText()).includes("35 Duelle"), await fineBtn.count(), JSON.stringify(await fineBtn.first().innerText()));
const playTruth = async (truthMap) => {
  let n = 0;
  for (let g = 0; g < 90; g++) {
    if (await page.locator("[data-ranking-result]").count()) break;
    if (!(await card.count())) { await page.waitForTimeout(120); continue; }
    const { cur, ref } = await info();
    const a = truthMap[cur] > truthMap[ref] ? "better" : truthMap[cur] < truthMap[ref] ? "worse" : "equal";
    await page.locator(`[data-rank="${a}"]`).click(); await page.waitForTimeout(260); n++;
  }
  return n;
};
await fineBtn.click(); await page.waitForTimeout(500);
console.log("Feinrunde startet mit 'Duell 1 von 35':", (await page.locator("[data-ranking-duel]").innerText()).includes("Duell 1 von 35"));
{
  const first = await info();
  await page.locator('[data-rank="better"]').click(); await page.waitForTimeout(350);
  await page.locator("[data-rank-undo]").click(); await page.waitForTimeout(350);
  const again = await info();
  console.log("Feinrunde Rueckgaengig: dasselbe Duell wieder da:", again.cur === first.cur && again.ref === first.ref && (await page.locator("[data-ranking-duel]").innerText()).includes("Duell 1 von 35"));
}
// Wahre Vorliebe: Brass jetzt VOR Azul (Widerspruch zur bisherigen Reihenfolge)
const truth2 = { Ingenious: 10, Brass: 9.5, Azul: 9, Catan: 7, Dixit: 6, Everdell: 6, Fluxx: 4, Gloomhaven: 3, Hanabi: 2 };
const n2 = await playTruth(truth2);
await page.waitForTimeout(500);
const sum = await page.locator("[data-fine-summary]").innerText();
console.log("Feinrunde nach 35 Duellen beendet, Zusammenfassung nennt Brass und Azul:", n2 === 35 && sum.includes("Brass: Platz 3 → 2") && sum.includes("Azul: Platz 2 → 3"), JSON.stringify(sum));
await page.screenshot({ path: `${SP}/ranking_fine.png` });
const st3 = await stored();
const rp = (n) => st3.find((g) => g.name === n).rankPos;
console.log("Gespeichert: Ingenious 1, Brass 2, Azul 3, Catan 4, Dixit = Everdell gleichauf:", rp("Ingenious") === 1 && rp("Brass") === 2 && rp("Azul") === 3 && rp("Catan") === 4 && rp("Dixit") === rp("Everdell"));
// Zweite Feinrunde mit derselben Vorliebe bestaetigt alles
await page.locator("[data-rank-fine]").click(); await page.waitForTimeout(400);
await playTruth(truth2);
await page.waitForTimeout(500);
console.log("Zweite Feinrunde: 'bestaetigt deine Rangliste':", (await page.locator("[data-fine-summary]").innerText()).includes("bestätigt"));

// --- Kreisurteile: Azul > Brass > Catan > Azul (widerspruechlich), Rest nach Staerke
const cyc = { Azul: "Brass", Brass: "Catan", Catan: "Azul" };
const playCycle = async (clarifyAnswers) => {
  let n = 0;
  for (let g = 0; g < 90; g++) {
    if (await page.locator("[data-ranking-result]").count()) break;
    if (!(await card.count())) { await page.waitForTimeout(120); continue; }
    const { cur, ref } = await info();
    let a;
    if (clarifyAnswers) a = clarifyAnswers(cur, ref);
    else if (cyc[cur] === ref) a = "better"; else if (cyc[ref] === cur) a = "worse";
    else a = truth2[cur] > truth2[ref] ? "better" : truth2[cur] < truth2[ref] ? "worse" : "equal";
    await page.locator(`[data-rank="${a}"]`).click(); await page.waitForTimeout(260); n++;
  }
  return n;
};
await page.locator("[data-rank-fine]").click(); await page.waitForTimeout(400);
await playCycle(null);
await page.waitForTimeout(600);
const cycBox = page.locator("[data-fine-cycles]");
console.log("Kreisurteil erkannt: Hinweis nennt Azul, Brass und Catan:", await cycBox.count() === 1 && ["Azul", "Brass", "Catan"].every(async () => true) && (await cycBox.innerText()).includes("Azul") && (await cycBox.innerText()).includes("Brass") && (await cycBox.innerText()).includes("Catan") && !(await cycBox.innerText()).includes("Dixit"));
console.log("Zusammenfassung sagt NICHT 'bestaetigt', solange ein Kreisurteil offen ist:", !(await page.locator("[data-fine-summary]").innerText()).includes("bestätigt"));
console.log("Klaerknopf zeigt '3' Duelle:", (await page.locator("[data-rank-clarify]").innerText()).includes("(3)"));
await page.screenshot({ path: `${SP}/ranking_cycle.png` });
await page.locator("[data-rank-clarify]").click(); await page.waitForTimeout(500);
console.log("Klaerung startet mit 'Klaerung: Duell 1 von 3':", (await page.locator("[data-ranking-duel]").innerText()).includes("Klärung: Duell 1 von 3"));
const pairKey = async () => { const { cur, ref } = await info(); return [cur, ref].sort().join("+"); };
const seen = new Set(); for (let g = 0; g < 3; g++) { seen.add(await pairKey()); const { cur, ref } = await info(); await page.locator(`[data-rank="${truth2[cur] > truth2[ref] ? "better" : "worse"}"]`).click(); await page.waitForTimeout(300); }
await page.waitForTimeout(500);
console.log("Klaerung spielte genau die 3 Paare aus dem Kreis:", seen.size === 3 && [...seen].every((k) => k.split("+").every((n) => ["Azul", "Brass", "Catan"].includes(n))));
console.log("Nach der Klaerung (jetzt widerspruchsfrei): Hinweis weg, Rangliste Brass 2, Azul 3, Catan 4:", await page.locator("[data-fine-cycles]").count() === 0 && await (async () => { const g = await stored(); const r = (n) => g.find((x) => x.name === n).rankPos; return r("Brass") === 2 && r("Azul") === 3 && r("Catan") === 4; })());
// Gleich gut in der Klaerung: Kreis wieder erzeugen, dann alle drei Duelle "Gleich gut" -> gleichauf
await page.locator("[data-rank-fine]").click(); await page.waitForTimeout(400);
await playCycle(null); await page.waitForTimeout(600);
await page.locator("[data-rank-clarify]").click(); await page.waitForTimeout(500);
for (let g = 0; g < 3; g++) { await page.locator('[data-rank="equal"]').click(); await page.waitForTimeout(300); }
await page.waitForTimeout(500);
const g4 = await stored(); const r4 = (n) => g4.find((x) => x.name === n).rankPos;
console.log("Alle drei 'Gleich gut': Azul, Brass, Catan teilen sich einen Platz:", r4("Azul") === r4("Brass") && r4("Brass") === r4("Catan") && await page.locator("[data-fine-cycles]").count() === 0);
await b.close(); server.close();
