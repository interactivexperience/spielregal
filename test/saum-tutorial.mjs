// Saum: Lernspiel komplett durchspielen (immer das markierte Element antippen) – auf iPhone-Größe.
// Prüft: Coach erscheint, jeder Schritt ist erreichbar, kein JS-Fehler, am Ende zurück auf der Startseite, nichts gespeichert.
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const url = "file://" + path.join(here, "..", "saum", "index.html");
const shots = process.env.SHOTS || "";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 393, height: 759 }, isMobile: true, hasTouch: true, deviceScaleFactor: shots ? 2 : 1 });
const errs = [];
page.on("pageerror", e => errs.push(e.message));
page.on("console", m => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) errs.push(m.text()); });
await page.route("**/fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
let ok = true; const check = (c, msg) => { if (!c) { ok = false; console.log("FEHLER: " + msg); } };
try {
  await page.goto(url);
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("spielregal:botFast", "1"); });
  await page.reload();
  check(await page.locator("[data-a=tutorial]").count() === 1, "Lernspiel-Knopf fehlt auf der Startseite");
  check(await page.locator("[data-a=rules]").count() === 1, "Spielregeln-Link fehlt auf der Startseite");
  await page.click("[data-a=rules]"); check(await page.locator(".intro.rules").count() === 1, "Spielregeln öffnen sich nicht");
  await page.click(".intro.rules .xbtn");
  await page.click("[data-a=tutorial]");
  let last = -1, guard = 0;
  while (guard++ < 200) {
    const st = await page.evaluate(() => TUT ? { i: TUT.i, n: TUT_STEPS.length, allow: !!TUT_STEPS[TUT.i].allow, done: !!TUT_STEPS[TUT.i].done, wait: !!TUT_STEPS[TUT.i].wait } : null);
    if (!st) break;
    if (st.i !== last) { last = st.i; if (shots) await page.screenshot({ path: `${shots}/t${String(st.i).padStart(2, "0")}.png` }); }
    check(await page.locator("#coach").count() === 1, "Coach fehlt in Schritt " + (st.i + 1));
    if (st.i === st.n - 1) { await page.click("[data-a=tutend]"); break; }
    if (st.wait) { await page.waitForTimeout(250); continue; }
    if (!st.done) { await page.click("[data-a=tutnext]"); continue; }
    const hl = page.locator(".tut-hl").first();
    if (!(await hl.count())) { check(false, "kein markiertes Element in Schritt " + (st.i + 1)); break; }
    const inFan = await hl.evaluate(el => !!el.closest(".fan"));
    await hl.click(inFan ? { position: { x: 22, y: 16 } } : {});
    await page.waitForTimeout(80);
  }
  check(guard < 200, "Lernspiel endet nicht");
  check(await page.evaluate(() => S === null && TUT === null), "nach dem Lernspiel nicht zurück auf der Startseite");
  check(await page.evaluate(() => localStorage.getItem("saum:save") === null), "Lernspiel wurde gespeichert");
  check(await page.evaluate(() => (JSON.parse(localStorage.getItem("spielregal:inbox:plays") || "[]")).length === 0), "Lernspiel wurde als Partie gemeldet");
} catch (e) { ok = false; console.log("FEHLER: " + e.message.split("\n")[0]); }
for (const e of errs) { ok = false; console.log("JS-FEHLER: " + e); }
await browser.close();
if (!ok) process.exit(1);
console.log("OK — Saum-Lernspiel: alle Schritte durchgespielt, Startseite mit Regeln, nichts gespeichert.");
