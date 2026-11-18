// Smoke-Test für schach/index.html („Spiegelschach“, Partie gegen den Bot).
// 1. Lädt die Seite im iPhone-Format und prüft auf JS-Fehler, 404 und den Beenden-Link.
// 2. Spielt per Tippen Züge (Weiß), prüft Bot-Antwort, Zugliste, Zug zurück, Speichern/Fortsetzen.
// 3. Spielt als Schwarz (gedrehtes Brett), prüft Aufgeben, Spielstand-Kennung und den Spielregal-Eingangskorb.
// 4. Prüft, dass die Datei zum Quelltext passt (node schach/tools/build-index.mjs --check).
// Aufruf (aus dem Repo-Root oder test/): node test/schach-smoke.mjs      (SHOT_DIR=… speichert Bildschirmfotos)
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import path from "node:path";
import http from "node:http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  let body; try { body = readFileSync(path.join(repoRoot, p)); } catch { res.writeHead(404); res.end("nf"); return; }
  res.writeHead(200, p.endsWith(".html") ? { "content-type": "text/html; charset=utf-8" } : {}); res.end(body);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/schach/`;
const shot = process.env.SHOT_DIR; if (shot) mkdirSync(shot, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on("response", (r) => { if (r.status() === 404) errors.push("404: " + r.url()); });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`); });
let fehler = 0;
const check = (ok, msg) => { if (!ok) { console.log("FEHLER: " + msg); fehler++; } };
const snap = async (name) => { if (shot) await page.screenshot({ path: path.join(shot, name + ".png") }); };
const sq = (n) => `#board [data-sq="${(8 - Number(n[1])) * 8 + "abcdefgh".indexOf(n[0])}"]`;
const state = () => page.evaluate(() => ({ moves: window.__schach.S.moves.slice(), over: window.__schach.S.over, turn: window.__schach.G.pos.turn, busy: window.__schach.U.busy }));
const waitBot = async () => { await page.waitForFunction(() => { const s = window.__schach.S; return !window.__schach.U.busy && (s.over || window.__schach.G.pos.turn === s.human); }, null, { timeout: 8000 }); };
const play = async (from, to) => { await page.click(sq(from)); await page.click(sq(to)); };

try {
  // ---- Lernpfad: Karte, Lektion spielen, Fortschritt ----
  const lessonFlow = async () => {
    await page.emulateMedia({ reducedMotion: "reduce" });   // pulsierende Marker sind sonst nicht „stabil“ genug zum Klicken
    await page.click("[data-a=map]");
    check(await page.locator(".mapwrap .node").count() === 10, "Karte zeigt zehn Ortsmarker");
    check(await page.locator(".mapwrap .node.cur").count() === 1 && await page.locator(".mapwrap .ova").count() === 1, "aktuelle Welt und Alice auf der Karte");
    await page.click('.node[data-node="2"]');
    check(await page.locator(".sheet .lrow").count() === 0, "gesperrte Welt zeigt keine Lektionen");
    await page.click(".scrim", { position: { x: 20, y: 20 } });
    await page.click('.node[data-node="0"]');
    check(await page.locator(".sheet .lrow").count() === 4 && await page.locator(".sheet .lrow:not([disabled])").count() === 1, "Welt 1: vier Lektionen, nur die erste offen");
    await page.click('.sheet .lrow[data-l="0"]');
    await page.click("[data-a=lstart]");
    for (let n = 0; n < 12; n++) {
      if (await page.locator(".sheet .end").count()) break;
      const st = await page.evaluate(() => { const w = window.__schach, E = w.E, L = w.LSN, { LESSONS } = { LESSONS: null };
        const t = window.SchachLessons.WORLDS[L.w].lessons[L.li].tasks[L.ti], g = t.goal; let moves = null;
        if (g.t === "tap") return { tap: g.sqs[0] };
        const mv = E.legalMoves(w.G.pos).find(m => g.t === "to" ? g.sqs.includes(E.sqName(m.to)) : g.t === "cap" ? !!m.cap : (m.cap && E.sqName(m.to) === g.sq));
        return { from: E.sqName(mv.from), to: E.sqName(mv.to), promo: !!mv.promo }; });
      if (st.tap) await page.click(sq(st.tap)); else { await page.click(sq(st.from)); await page.click(sq(st.to)); if (st.promo) await page.click(".promo [data-n=q]"); }
      await page.waitForTimeout(900);
    }
    check(await page.locator(".sheet .end .stars3").count() === 1, "Lektion endet mit Sternen");
    const pr = await page.evaluate(() => JSON.parse(localStorage.getItem("schach:progress")));
    check(pr && pr.l["w1-l1"] === 3 && pr.xp > 0, "Fortschritt gespeichert (3 Sterne, XP)");
    await snap("10-lektion-ende");
    await page.click("[data-a=lnext]");
    // falscher Zug kostet ein Herz, Hinweis zeigt Text
    await page.click("[data-a=lstart]");
    await page.click(sq("a1"));
    check((await page.evaluate(() => window.__schach.LSN.hearts)) === 2, "Fehler kostet ein Herz");
    await page.waitForTimeout(800);
    await page.click("[data-a=lhint]");
    check((await page.evaluate(() => window.__schach.LSN.hints)) === 1, "Hinweis wird gezählt");
    await snap("11-lektion");
    await page.click("[data-a=lback]");
    await page.click('.node[data-node="0"]');
    check(await page.locator(".sheet .lrow:not([disabled])").count() === 2, "nach Lektion 1 ist Lektion 2 offen");
    await snap("12-karte");
    await page.click(".scrim", { position: { x: 20, y: 20 } });
    await page.click("[data-a=home]");
    await page.evaluate(() => localStorage.removeItem("schach:progress"));
    await page.reload({ waitUntil: "load" });
    await page.emulateMedia({ reducedMotion: "no-preference" });
  };
  await page.addInitScript(() => { try { localStorage.setItem("schach:sound", "0"); localStorage.setItem("spielregal:botFast", "1"); } catch (e) {} });
  await page.goto(url, { waitUntil: "load" });
  await lessonFlow();

  // ---- Quelltext und Datei stimmen überein ----
  try { execFileSync("node", [path.join(repoRoot, "schach/tools/build-index.mjs"), "--check"], { stdio: "pipe" }); }
  catch (e) { check(false, "schach/index.html ist nicht aktuell (build-index.mjs --check): " + String(e.stderr || e.message).trim()); }

  await page.addInitScript(() => { try { localStorage.setItem("schach:sound", "0"); localStorage.setItem("spielregal:botFast", "1"); } catch (e) {} });
  await page.goto(url, { waitUntil: "load" });
  check(await page.locator('a.leave[href="../"]').count() === 1, "Beenden-Link ‹ Spielregal fehlt auf dem Startbildschirm");
  check(await page.locator(".cast .chr").count() === 6, "sechs Figuren auf dem Startbildschirm erwartet");
  check(await page.locator("[data-a=lvl]").count() === 3, "drei Bot-Stufen erwartet");
  await snap("1-start");

  // ---- Partie als Weiß gegen Stufe 1 ----
  await page.click("[data-a=lvl][data-n='1']");
  await page.click("[data-a=col][data-n='w']");
  await page.click("[data-a=new]");
  check(await page.locator("#board .q").count() === 64, "Brett mit 64 Feldern erwartet");
  check(await page.locator("#board .pc").count() === 32, "32 Figuren in der Grundstellung erwartet");
  check((await page.locator("#board .q").first().getAttribute("data-sq")) === "0", "Weiß sieht a8 oben links");
  await page.click(sq("e2"));
  check(await page.locator("#board .q.sel").count() === 1, "Feld e2 ist ausgewählt");
  check(await page.locator("#board .q.dot").count() === 2, "Bauer e2 hat zwei Zielfelder");
  await page.click(sq("e5")); // ungültiges Ziel: Auswahl wird aufgehoben
  check(await page.locator("#board .q.sel").count() === 0, "Tippen auf ein ungültiges Feld hebt die Auswahl auf");
  await snap("2-auswahl");
  await play("e2", "e4");
  await waitBot();
  let st = await state();
  check(st.moves.length === 2 && st.moves[0] === "e2e4", `Zug e2e4 und Bot-Antwort erwartet, war ${JSON.stringify(st.moves)}`);
  check(await page.locator("#moves span").count() === 2, "Zugliste zeigt zwei Züge");
  await snap("3-nach-zug");
  // Zug zurück nimmt beide Züge zurück
  await page.click(".acts [data-a=undo]");
  st = await state();
  check(st.moves.length === 0, "Zug zurück nimmt Zug und Antwort zurück");
  await play("d2", "d4"); await waitBot();
  await play("g1", "f3"); await waitBot();
  st = await state();
  check(st.moves.length === 4, "vier Halbzüge nach zwei Zügen");

  // ---- Speichern und Fortsetzen ----
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("schach:save")));
  check(saved && saved.screen === "game" && saved.S.moves.length === 4, "Spielstand schach:save mit screen 'game' erwartet");
  await page.reload({ waitUntil: "load" });
  check(await page.locator("[data-a=resume]").count() === 1, "Partie fortsetzen erscheint nach dem Neuladen");
  await snap("4-fortsetzen");
  await page.click("[data-a=resume]");
  st = await state();
  check(st.moves.length === 4, "Fortsetzen stellt vier Halbzüge wieder her");

  // ---- Menü ----
  await page.click("[data-a=menu]");
  check(await page.locator(".sheet [data-a=reload]").count() === 1, "Menü enthält „Neueste Version laden“");
  check(await page.locator('.sheet a[href="../"]').count() === 1, "Menü enthält Speichern und zu Spielregal");
  await snap("5-menue");
  await page.click(".scrim");

  // ---- Aufgeben: Eingangskorb ----
  page.once("dialog", (d) => d.accept());
  await page.click(".acts [data-a=resign]");
  st = await state();
  check(st.over && st.over.res === "loss", "Aufgeben beendet die Partie als verloren");
  check(await page.locator(".sheet .end").count() === 1, "Ergebnisblatt erscheint");
  await snap("6-ende");
  const inbox = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:inbox:plays") || "[]"));
  check(inbox.length === 1 && inbox[0].source === "schach" && inbox[0].gameName === "Spiegelschach", "Eingangskorb enthält genau eine Schach-Partie");
  check(inbox[0] && inbox[0].winners.length === 1 && inbox[0].winners[0] !== inbox[0].human, "Sieger ist der Bot");
  const afterEnd = await page.evaluate(() => JSON.parse(localStorage.getItem("schach:save")));
  check(afterEnd.screen === "start", "nach dem Ende steht schach:save auf 'start'");

  // ---- Partie als Schwarz (Brett gedreht, Bot beginnt) ----
  await page.click("[data-a=again]");
  await page.click("[data-a=home]");
  await page.click("[data-a=lvl][data-n='3']");
  await page.click("[data-a=col][data-n='b']");
  await page.click("[data-a=new]");
  await waitBot();
  check((await page.locator("#board .q").first().getAttribute("data-sq")) === "63", "Schwarz sieht h1 oben links (gedreht)");
  st = await state();
  check(st.moves.length === 1, "Bot hat als Weiß den ersten Zug gemacht");
  // Antwort auf den ersten Zug: zufälliger legaler Zug über die Engine, getippt wie ein Mensch
  const mv = await page.evaluate(() => { const { E, G } = window.__schach; const m = E.legalMoves(G.pos)[0]; return { from: E.sqName(m.from), to: E.sqName(m.to) }; });
  await play(mv.from, mv.to); await waitBot();
  st = await state();
  check(st.moves.length === 3, `Schwarz zieht, Bot antwortet (3 Halbzüge), war ${st.moves.length}`);
  await snap("7-schwarz");
  // Rückkehr zum Start sichert die Partie
  await page.click("[data-a=home]");
  const afterHome = await page.evaluate(() => JSON.parse(localStorage.getItem("schach:save")));
  check(afterHome.screen === "game", "Start verlassen speichert die laufende Partie");
  check(await page.locator("[data-a=resume]").count() === 1, "Fortsetzen steht wieder auf dem Startbildschirm");

  // ---- Hilfsfunktion: Stellung direkt setzen (für Sonderregeln, die ein Bot nicht zuverlässig herbeiführt) ----
  const setPos = (fen, human = "w") => page.evaluate(([fen, human]) => {
    const w = window.__schach, E = w.E;
    w.S.human = human; w.S.level = 1; w.S.over = null; w.S.moves = [];
    w.G.pos = E.parseFEN(fen); w.G.keys = [E.positionKey(w.G.pos)]; w.G.sans = []; w.G.posList = [w.G.pos];
    w.U.view = "game"; w.U.sheet = null; w.U.sel = null; w.U.legal = []; w.U.busy = false; w.render();
  }, [fen, human]);
  // ---- Rochade per Tippen: König auf g1 ziehen ----
  await setPos("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
  await page.click(sq("e1"));
  check(await page.locator("#board .q.dot, #board .q.cap").count() >= 7, "König zeigt Zielfelder inkl. Rochade-Feld");
  await page.click(sq("g1"));
  const rochade = await page.evaluate(() => ({ g1: window.__schach.G.pos.board[62], f1: window.__schach.G.pos.board[61] }));
  check(rochade.g1 === "K" && rochade.f1 === "R", `Rochade stellt König auf g1 und Turm auf f1 (${JSON.stringify(rochade)})`);
  await page.waitForTimeout(300);
  // ---- Umwandlung: Auswahlblatt mit vier Figuren ----
  await setPos("8/P7/8/8/8/8/8/k6K w - - 0 1");
  await play("a7", "a8");
  check(await page.locator(".sheet .promo button").count() === 4, "Umwandlung zeigt vier Figuren zur Auswahl");
  await snap("9-umwandlung");
  await page.click(".promo [data-n=q]");
  st = await state();
  check(st.moves[0] === "a7a8q", `Umwandlung in die Dame (${JSON.stringify(st.moves)})`);
  await page.waitForTimeout(500);
  // ---- en passant: Bauer schlägt im Vorbeigehen ----
  await setPos("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1");
  await play("e5", "d6");
  const ep = await page.evaluate(() => ({ d5: window.__schach.G.pos.board[27], d6: window.__schach.G.pos.board[19] }));
  check(ep.d5 === "." && ep.d6 === "P", `en passant entfernt den Bauern auf d5 (${JSON.stringify(ep)})`);
  await page.waitForTimeout(400);

  // ---- Matt auf dem Brett: Narrenmatt als Weiß (Bot Stufe 1 patzt nicht zwingend, daher direkte Stellung) ----
  await page.evaluate(() => {
    const w = window.__schach, E = w.E;
    // Stellung mit Matt in 1: Weiß am Zug, Dh5#-ähnlich einfach: Turm a1, Schwarzer König g8 hinter Bauern
    w.S.human = "w"; w.S.level = 1; w.S.over = null; w.S.moves = [];
    w.G.pos = E.parseFEN("6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1"); w.G.keys = [E.positionKey(w.G.pos)]; w.G.sans = []; w.G.posList = [w.G.pos];
    w.U.view = "game"; w.U.sheet = null; w.render();
  });
  await play("a1", "a8");
  st = await state();
  check(st.over && st.over.res === "win" && st.over.why === "Schachmatt", `Matt wird erkannt (${JSON.stringify(st.over)})`);
  await page.waitForSelector(".sheet .end", { timeout: 4000 });
  await snap("8-sieg");

  // ---- Pfad 2: Sieg gegen Stufe 1 schaltet nichts frei, Sieg gegen Stufe 3 schon ----
  check(!(await page.evaluate(() => !!window.__schach.P.p2)), "Sieg gegen Stufe 1 schaltet Pfad 2 nicht frei");
  await page.evaluate(() => {
    const w = window.__schach, E = w.E;
    w.S.human = "w"; w.S.level = 3; w.S.over = null; w.S.moves = []; w.S.unlocked = false;
    w.G.pos = E.parseFEN("6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1"); w.G.keys = [E.positionKey(w.G.pos)]; w.G.sans = []; w.G.posList = [w.G.pos];
    w.U.view = "game"; w.U.sheet = null; w.render();
  });
  await play("a1", "a8");
  await page.waitForSelector('.sheet .end [data-a="p2"]', { timeout: 4000 });
  check(await page.evaluate(() => !!window.__schach.P.p2), "Sieg gegen Stufe 3 schaltet Pfad 2 frei");
  await page.click('.sheet .end [data-a="p2"]');
  await page.waitForSelector(".p2w", { timeout: 3000 });
  const open = await page.evaluate(() => [...document.querySelectorAll(".p2w")].map(e => !e.classList.contains("lock")));
  check(open.length === 8 && open[0] && !open[1], `Pfad 2: erste Welt offen, zweite gesperrt (${JSON.stringify(open)})`);
} catch (e) {
  console.log("FEHLER: Ausnahme im Test: " + e.message); fehler++;
}
if (errors.length) { fehler += errors.length; for (const e of errors) console.log("FEHLER: " + e); }
await browser.close(); server.close();
if (fehler) { console.log(`${fehler} Fehler.`); process.exit(1); }
console.log("OK – Spiegelschach: Start, Partie, Speichern, Aufgeben, Matt und Eingangskorb funktionieren.");
