// Smoke-Test für glut/index.html („Glut“, eigenes Spielkonzept).
// 1. Lädt Startseite und Spiel im iPhone-Format und prüft auf JS-Fehler.
// 2. Spielt per Klick komplette Partien gegen Bots (2 und 4 Spieler): Würfel wählen, Ort wählen, Auswahlfenster, Rasten.
//    Prüft laufend Invarianten (keine negativen Vorräte, Hitze 0–6, belegte Plätze).
// 3. Prüft Speichern/Fortsetzen (?resume=1), Zug rückgängig, Info-Blase, Menü, Spielregeln,
//    Spielstand-Kennung fürs Dashboard (glut:save) und Eintrag im Spielregal-Eingangskorb.
// Aufruf (aus test/): node glut-smoke.mjs
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
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
const url = `http://127.0.0.1:${server.address().port}/glut/`;
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { try { localStorage.setItem("spielregal:botFast", "1"); } catch (_) {} });
const page = await ctx.newPage();
const errors = [];
await page.route("**/fonts.googleapis.com/**", (r) => r.fulfill({ body: "", contentType: "text/css" }));
await page.route("**/fonts.gstatic.com/**", (r) => r.abort());
page.on("response", (r) => { if (r.status() === 404) errors.push("404: " + r.url()); });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`); });
let fehler = 0;
const check = (ok, msg) => { if (!ok) { console.log("FEHLER: " + msg); fehler++; } };
const cnt = async (s) => await page.locator(s).count();
const st = () => page.evaluate(() => ({ over: S.over, cur: S.cur, passed: S.players[0].passed, sheet: !!U.sheet, sel: U.sel.slice(), round: S.round, logn: S.log.length, undo: U.undo.length }));
const invariants = async () => {
  const bad = await page.evaluate(() => {
    const m = [];
    for (const p of S.players) {
      for (const k in p.res) if (p.res[k] < 0 || !Number.isFinite(p.res[k])) m.push(`${p.name} ${k}=${p.res[k]}`);
      for (const h of p.dice) if (!(h >= 0 && h <= 6)) m.push(`${p.name} Hitze ${h}`);
      if (p.dice.length < 4) m.push("zu wenige Würfel");
    }
    S.places.forEach((o, i) => { if (o.length > capFor(S.np)) m.push(`Ort ${i} überbelegt`); if (new Set(o).size !== o.length) m.push(`Ort ${i} doppelt besetzt`); });
    return m;
  });
  return bad;
};

async function playGame(bots, label) {
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate(() => { try { localStorage.removeItem("glut:save"); localStorage.removeItem("spielregal:inbox:plays"); } catch (_) {} });
  await page.goto(url, { waitUntil: "load" });
  if (label === "erste") check(await cnt('a.leave[href="../"]') === 1, "Beenden-Link ‹ Spielregal fehlt auf dem Startbildschirm");
  await page.click("[data-a=setup]");
  await page.click(`.sheet [data-a=bots][data-n='${bots}']`);
  await page.click(".sheet .btn[data-a=setup-x]");
  await page.click("[data-a=start]");
  let it = 0, works = 0, passes = 0, sheets = 0, pairs = 0, undone = 0, savedGame = false, resumed = false, bubble = false, menuOk = false;
  const tried = new Set();
  let lastKey = "";
  while (it++ < 4000) {
    const s = await st();
    if (s.over) break;
    const bad = await invariants(); if (bad.length) { check(false, `Invariante: ${bad.join("; ")}`); break; }
    if (s.sheet) { const n = await cnt(".opt"); await page.locator(".opt").nth(it % n).click(); sheets++; continue; }
    if (s.cur !== 0 || s.passed) { await page.waitForTimeout(60); continue; }
    const key = `${s.round}:${s.logn}`;
    if (key !== lastKey) { tried.clear(); lastKey = key; }
    // einmalig: Menü, Info-Blase, Speichern/Fortsetzen testen
    if (!menuOk && it > 3) {
      await page.click("[data-a=menu]");
      check(await cnt("[data-a=rules]") === 1 && await cnt("a[href='../']") >= 1 && await cnt("[data-a=fast]") === 1 && await cnt("[data-a=reload]") === 1, "Menü unvollständig");
      await page.click("[data-a=rules]"); check(await cnt(".rules") === 1, "Spielregeln öffnen sich nicht"); await page.click(".rules .xbtn");
      menuOk = true; continue;
    }
    if (!bubble) {
      await page.evaluate(() => document.querySelector(".dicerow .die").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 10, clientY: 10 })));
      await page.waitForTimeout(550); check(await cnt(".bubble") === 1, "Info-Blase erscheint nicht bei langem Drücken");
      await page.evaluate(() => document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }))); bubble = true; await page.waitForTimeout(2800); continue;
    }
    if (!savedGame && works >= 3) {
      const sv = await page.evaluate(() => JSON.parse(localStorage.getItem("glut:save") || "{}"));
      check(sv.screen === "game", "Spielstand glut:save hat nicht screen=game"); savedGame = true;
      const roundBefore = s.round, logBefore = s.logn;
      await page.goto(url + "?resume=1", { waitUntil: "load" });
      const s2 = await st(); check(s2.round === roundBefore && s2.logn === logBefore, "Fortsetzen (?resume=1) stellt Partie nicht wieder her"); resumed = true; continue;
    }
    // Zug rückgängig (einmal ausprobieren, wenn möglich)
    if (works >= 5 && undone === 0 && s.undo > 0 && await cnt("[data-a=undo]")) {
      await page.click(".foot [data-a=undo]"); const s2 = await st(); check(s2.logn < s.logn, "Zug rückgängig nimmt keinen Eintrag zurück"); undone++; continue;
    }
    const picks = await cnt(".plc.pick");
    if (picks) {
      // der angetippte Würfel muss abkühlen (nicht ein anderer mit gleicher Hitze)
      const pre = await page.evaluate(() => ({ sel: U.sel.slice(), boost: U.boost, h: U.sel.map((i) => S.players[0].dice[i]), nocool: S.players[0].cards.includes("waechter") }));
      await page.locator(".plc.pick").nth(it % picks).click(); works++;
      if (!(await page.evaluate(() => !!U.sheet)) && pre.sel.length === 1 && !pre.nocool && pre.boost === 0 && !(await page.evaluate(() => S.over))) {
        const after = await page.evaluate((i) => S.players[0].dice[i], pre.sel[0]);
        check(after === Math.max(0, pre.h[0] - 1), `Der angetippte Würfel ${pre.sel[0]} (Hitze ${pre.h[0]}) ist nicht abgekühlt (jetzt ${after})`);
      }
      continue;
    }
    // Würfel durchprobieren
    const dice = page.locator(".dicerow .die:not(.h0)"), n = await dice.count();
    let done = false;
    for (let k = 0; k < n; k++) {
      const idx = await dice.nth(k).evaluate((e) => +e.dataset.i);
      if (tried.has(idx)) continue;
      tried.add(idx);
      if (s.sel.length) await page.click("[data-a=die][data-i='" + s.sel[0] + "']"); // Auswahl lösen
      await dice.nth(k).click();
      // alle zwei Mal Paar versuchen
      if (it % 5 === 0 && n > 1) { const o = await dice.nth((k + 1) % n).evaluate((e) => +e.dataset.i); if (o !== idx) { await page.click(`[data-a=die][data-i='${o}']`); pairs++; } }
      done = true; break;
    }
    if (!done) { await page.click("[data-a=pass]"); passes++; }
  }
  const s = await st();
  check(s.over, `${label}: Partie wurde nicht beendet (Runde ${s.round}, Iterationen ${it})`);
  console.log(`${label}: ${bots + 1} Spieler, Runden ${s.round}, Arbeiten ${works}, Rasten ${passes}, Fenster ${sheets}, Paar-Versuche ${pairs}, zurück ${undone}`);
  if (label === "erste") { check(savedGame && resumed && menuOk && bubble, "Zusatzprüfungen nicht durchlaufen"); check(works >= 10, "zu wenige Arbeitszüge"); }
  const fx = await page.evaluate(() => FXC);
  check(fx.fx > 20 && fx.float > 5 && fx.puff > 3, `${label}: Animationen kaum ausgelöst: ${JSON.stringify(fx)}`);
  check(fx.banner >= 4, `${label}: Rundenbanner kaum gezeigt: ${JSON.stringify(fx)}`);
  const inbox = await page.evaluate(() => JSON.parse(localStorage.getItem("spielregal:inbox:plays") || "[]"));
  check(inbox.length === 1 && inbox[0].source === "glut" && inbox[0].gameName === "Glut" && inbox[0].results.length === bots + 1, `${label}: Eintrag im Eingangskorb fehlt oder falsch`);
  check(await cnt(".overlay [data-a=again]") === 1, `${label}: Endbildschirm fehlt`);
  const sv = await page.evaluate(() => JSON.parse(localStorage.getItem("glut:save") || "{}"));
  check(sv.screen === "start", `${label}: Spielstand nach Ende nicht auf start`);
}

try {
  await page.goto(url, { waitUntil: "load" });
  check(await page.title() === "Glut", "Titel");
  check(await page.evaluate(() => document.querySelectorAll(".start .ember").length === 5 && getComputedStyle(document.querySelector(".kglow")).animationName === "flick"), "Cover: Glut und Funken fehlen oder laufen nicht");
  // Startbild darf nicht von der Knopfleiste überdeckt werden (kleines und großes Handy)
  for (const [w, h] of [[390, 844], [390, 664], [360, 640], [430, 932]]) {
    await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(150);
    const m = await page.evaluate(() => {
      const im = document.querySelector(".start .cov").getBoundingClientRect(), pn = document.querySelector(".start .panel").getBoundingClientRect(), st = document.querySelector(".start .stage").getBoundingClientRect();
      const visible = Math.min(im.bottom, st.bottom) - Math.max(im.top, st.top);
      return { frac: visible / im.height, panelTop: pn.top, stageBottom: st.bottom, imW: im.width, vw: innerWidth, panelH: pn.height, vh: innerHeight };
    });
    check(m.frac >= 0.75, `Startbild bei ${w}×${h} nur zu ${(m.frac * 100).toFixed(0)} % sichtbar (mind. 75 %)`);
    check(m.stageBottom <= m.panelTop + 1, `Startbild reicht bei ${w}×${h} unter die Knopfleiste`);
    check(m.panelH < m.vh * 0.28, `Knopfleiste bei ${w}×${h} zu hoch (${m.panelH.toFixed(0)} px)`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  // Gildenkarte direkt auf der Kartenseite kaufen
  await page.evaluate(() => { try { localStorage.removeItem("glut:save"); } catch (_) {} });
  await page.goto(url, { waitUntil: "load" });
  await page.click("[data-a=start]");
  await page.evaluate(() => { S.market[0] = "lehrbrief"; S.market[1] = "waechter"; S.players[0].dice = [4, 3, 2, 1]; S.players[0].res.duk = 3; U.page = 2; render(); });
  check(await cnt(".card[data-a=card]") === 4, "Auslagekarten sind nicht antippbar");
  check(await page.evaluate(() => document.querySelector('.card[data-mi="0"]').classList.contains("can") && !document.querySelector('.card[data-mi="1"]').classList.contains("can")), "Kaufbar-Markierung falsch (Lehrbrief ja, Glutwächter nein)");
  await page.click('.card[data-mi="1"]');
  check(await page.evaluate(() => /Zu wenig Dukaten/.test((document.querySelector(".toast") || {}).textContent || "")), "Antippen einer zu teuren Karte nennt den Grund nicht");
  await page.click('.card[data-mi="0"]');
  check(await cnt(".sheet .opt") === 1 && /Lehrbrief/.test(await page.locator(".sheet .opt").innerText()), "Antippen einer kaufbaren Karte öffnet keine Bestätigung");
  const dieBefore = await page.evaluate(() => S.players[0].dice.slice());
  await page.click(".sheet .opt");
  const after = await page.evaluate(() => ({ cards: S.players[0].cards.slice(), duk: S.players[0].res.duk, dice: S.players[0].dice.slice(), ruhmT: S.players[0].signs.T }));
  check(after.cards.includes("lehrbrief") && after.duk === 1 && after.ruhmT === 2, "Kauf über die Karte hat Karte/Dukaten/Zeichen nicht richtig verbucht " + JSON.stringify(after));
  check(after.dice.join() === [4, 3, 2, 0].join() || after.dice.join() === [4, 3, 1, 1].join() || after.dice.filter((h, i) => h !== dieBefore[i]).length === 1, "Es wurde kein einzelner (passendster) Würfel abgekühlt " + JSON.stringify(after.dice));
  await playGame(1, "erste");
  await playGame(3, "vier");
  await playGame(2, "drei");
  // Bewegung reduzieren: keine Animationen, keine schwebenden Zeichen
  const rctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  await rctx.addInitScript(() => { try { localStorage.setItem("spielregal:botFast", "1"); } catch (_) {} });
  const rp = await rctx.newPage();
  await rp.route("**/fonts.googleapis.com/**", (r) => r.fulfill({ body: "", contentType: "text/css" }));
  await rp.route("**/fonts.gstatic.com/**", (r) => r.abort());
  rp.on("pageerror", (e) => errors.push(`pageerror (reduce): ${e.message}`));
  await rp.goto(url, { waitUntil: "load" });
  check(await rp.evaluate(() => getComputedStyle(document.querySelector(".kglow")).animationName === "none"), "Bewegung reduzieren: Cover-Glut läuft trotzdem");
  await rp.click("[data-a=start]");
  for (let k = 0; k < 8; k++) {
    const st2 = await rp.evaluate(() => ({ cur: S.cur, over: S.over }));
    if (st2.over) break;
    if (st2.cur !== 0) { await rp.waitForTimeout(150); continue; }
    const d = rp.locator(".dicerow .die:not(.h0)");
    if (await d.count()) await d.first().click();
    const pk = rp.locator(".plc.pick");
    if (await pk.count()) await pk.first().click();
    await rp.waitForTimeout(120);
  }
  const fr = await rp.evaluate(() => FXC);
  check(fr.fx === 0 && fr.float === 0 && fr.puff === 0 && fr.stamp === 0 && fr.banner === 0, "Bewegung reduzieren: Effekte wurden trotzdem ausgelöst " + JSON.stringify(fr));
} catch (e) { console.log("Test-Abbruch:", e.message); fehler++; }
for (const e of errors) { console.log("FEHLER: " + e); fehler++; }
await browser.close(); server.close();
if (fehler) { console.log(`\n${fehler} Fehler.`); process.exit(1); }
console.log("OK – Glut: keine JS-Fehler, Partien durchgespielt.");
