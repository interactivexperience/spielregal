// Dark-Mode-Sichtprüfung: lädt ein Spiel mit spielregal:theme=dark (oder light), startet eine Partie, macht Screenshots.
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const [game, theme = "dark", out = "/tmp/claude-0/-home-user-spielregal/51fcba44-07f7-528a-90ed-8c50ca3e40a4/scratchpad"] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 393, height: 759 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, colorScheme: "light" });
const page = await ctx.newPage();
const errs = []; page.on("pageerror", e => errs.push(e.message));
await page.route(/fonts\.g|cdnjs|tailwind/, r => r.fulfill({ body: "", contentType: "text/css" }));
await page.goto("file://" + path.join(here, "..", game, "index.html"));
await page.evaluate(t => { localStorage.clear(); localStorage.setItem("spielregal:theme", t); localStorage.setItem("spielregal:botFast", "1"); }, theme);
await page.reload(); await page.waitForTimeout(600);
const dt = await page.evaluate(() => document.documentElement.dataset.theme);
console.log("data-theme:", dt);
await page.screenshot({ path: `${out}/${game}-${theme}-1start.png` });
const st = page.locator("[data-a=start]").first();
if (await st.count()) {
  const s = page.locator("[data-a=setup]"); if (await s.count()) { await s.click(); await page.waitForTimeout(300); await page.screenshot({ path: `${out}/${game}-${theme}-2setup.png` }); const x = page.locator("button[data-a=setup-x].btn, button[data-a=setup-x]"); if (await x.count()) await x.last().click(); await page.waitForTimeout(200); }
  await st.click(); await page.waitForTimeout(1500);
  if (game === "grand-austria-hotel") {
    for (let i = 0; i < 6 && (await page.locator(".sheet [data-a=dpick]").count()); i++) { await page.locator(".sheet [data-a=dpick]").first().click(); await page.waitForTimeout(80); }
    if (await page.locator("[data-a=rpok]").count()) { for (const i of [0, 1, 2]) await page.locator(`.sheet [data-a=rpsel][data-i="${i}"]`).click({ force: true }); await page.click("[data-a=rpok]"); }
    await page.waitForTimeout(800);
  }
  if (game === "rebel-princess") { await page.locator("[data-a=pick]").first().click(); await page.click("[data-a=pickok]"); await page.waitForTimeout(1500); }
  if (game === "countryside") {
    for (const i of [0,1,2]) { const o = page.locator(".sheet .terr"); if (await o.count() > i) { await o.nth(i).click({ force: true }); await page.waitForTimeout(150); } }
    const ok = page.locator(".sheet [data-a=askok]"); if (await ok.count()) await ok.click({ force: true });
    await page.waitForTimeout(800);
    for (let r = 0; r < 4; r++) { const h = page.locator(".sheet [data-a=hsel]"); if (await h.count()) { await h.first().click({ force: true }); const k = page.locator(".sheet [data-a=askok]"); if (await k.count()) await k.click({ force: true }); await page.waitForTimeout(600); } }
    const cl = page.locator("[data-a=close]"); if (await cl.count()) await cl.first().click().catch(()=>{});
    await page.waitForTimeout(600);
  }
  if (game === "three-sisters" || game === "countryside" || game === "glut") await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${game}-${theme}-3game.png` });
  const dots = page.locator(".pdots .pd, .pdots i"); const n = await dots.count();
  for (let i = 1; i < Math.min(n, 3); i++) { await dots.nth(i).click().catch(()=>{}); await page.waitForTimeout(600); await page.screenshot({ path: `${out}/${game}-${theme}-4page${i}.png` }); }
}
if (!process.env.NOTALL) await page.setViewportSize({ width: 393, height: 2200 }); else { await browser.close(); process.exit(0); } await page.waitForTimeout(500);
{ const dots = page.locator(".pdots .pd, .pdots i"); const n = await dots.count();
  for (let i = 0; i < Math.min(n, 3); i++) { await dots.nth(i).click().catch(()=>{}); await page.waitForTimeout(700); await page.screenshot({ path: `${out}/${game}-${theme}-5tall${i}.png` }); } }
console.log("errors:", errs.slice(0, 3));
await browser.close();
