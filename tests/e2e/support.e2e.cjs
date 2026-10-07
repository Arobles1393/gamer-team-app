// "Apoyar el proyecto" (Ko-fi). Con E2E_SUPPORT=1 espera que el servidor
// se haya iniciado con REACT_APP_SUPPORT_URL=https://ko-fi.com/... válida;
// sin él, que el botón no exista en ningún lado. Ko-fi se simula (no se
// abre el sitio real).
const fs = require("fs");
const { chromium } = require("playwright-core");

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const EXPECT = process.env.E2E_SUPPORT === "1";
const QA = JSON.parse(fs.readFileSync(`${__dirname}/.qa-users.json`, "utf8"));
const SHOTS = `${__dirname}/screenshots`;
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};

(async () => {
  const browser = await chromium.launch({ channel: process.env.E2E_BROWSER || "msedge", headless: true });
  const context = await browser.newContext({ locale: "es-MX", viewport: { width: 1366, height: 900 } });
  const kofi = [];
  await context.route("https://ko-fi.com/**", (route) => {
    kofi.push({ url: route.request().url(), referer: route.request().headers().referer || "" });
    route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>Ko-fi (simulado)</title><p>Ko-fi</p>" });
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  try {
    await page.goto(`${BASE}/login`);
    await page.locator("#email").fill(QA.ana.email);
    await page.locator("#password").fill(QA.ana.password);
    await page.locator("button[type=submit]").click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });

    console.log(`\n=== ${EXPECT ? "con" : "sin"} REACT_APP_SUPPORT_URL válida`);
    // Menú del avatar
    await page.locator(".app-rail__avatar-btn").click();
    const menu = page.locator(".p-menu, .p-tieredmenu").last();
    await menu.waitFor({ timeout: 8000 });
    const menuItem = menu.getByText("Apoyar el proyecto", { exact: true });
    check(`menú del avatar: entrada ${EXPECT ? "visible" : "ausente"}`, (await menuItem.count()) === (EXPECT ? 1 : 0));
    if (EXPECT) {
      const order = await menu.locator(".p-menuitem-text").allInnerTexts();
      check("antes de Privacidad", order.indexOf("Apoyar el proyecto") === order.indexOf("Privacidad") - 1, order.join(" | "));
      await menu.screenshot({ path: `${SHOTS}/support-menu.png` });
      const [popup] = await Promise.all([context.waitForEvent("page"), menuItem.click()]);
      await popup.waitForLoadState();
      check("abre Ko-fi en una pestaña nueva", popup.url().startsWith("https://ko-fi.com/"), popup.url());
      check("la pestaña no puede acceder a esta ventana (opener null)", await popup.evaluate(() => window.opener === null));
      check("sin Referer", kofi.length > 0 && kofi[kofi.length - 1].referer === "" && (await popup.evaluate(() => document.referrer)) === "");
      await popup.close();
    } else {
      await page.keyboard.press("Escape");
    }

    // Mi perfil
    await page.goto(`${BASE}/profile`);
    await page.locator(".profile-hero").waitFor({ timeout: 15000 });
    await page.locator(".danger-zone").waitFor({ timeout: 15000 });
    const card = page.locator(".profile-support");
    check(`Mi perfil: tarjeta ${EXPECT ? "visible" : "ausente"}`, (await card.count()) === (EXPECT ? 1 : 0));
    check(`ningún enlace a ko-fi.com en el perfil${EXPECT ? " salvo el de la tarjeta" : ""}`,
      (await page.locator('a[href*="ko-fi.com"]').count()) === (EXPECT ? 1 : 0));
    if (EXPECT) {
      const text = await card.innerText();
      check("texto: voluntario y no desbloquea nada", /proyecto independiente/.test(text) && /No desbloquea nada/.test(text));
      check("aviso: el pago se realiza en Ko-fi", /GamerMatch no recibe ni guarda tus datos de pago/.test(text));
      check("no dice donación", !/donaci/i.test(text));
      const link = card.locator("a.support-btn");
      check("enlace con target _blank y rel noopener noreferrer",
        (await link.getAttribute("target")) === "_blank" && (await link.getAttribute("rel")) === "noopener noreferrer");
      check("con aviso de pestaña nueva para lectores de pantalla", /pestaña nueva/.test(await link.innerText()));
      const position = await page.evaluate(() => {
        const support = document.querySelector(".profile-support");
        const next = support?.nextElementSibling;
        return { next: next?.className || "" };
      });
      check("justo antes de la zona de peligro", /danger/.test(position.next), position.next);
      await card.screenshot({ path: `${SHOTS}/support-card.png` });
      const [popup] = await Promise.all([context.waitForEvent("page"), link.click()]);
      await popup.waitForLoadState();
      check("la tarjeta abre Ko-fi sin acceso a esta ventana", popup.url().startsWith("https://ko-fi.com/") && await popup.evaluate(() => window.opener === null));
      await popup.close();
    }

    // No en el rail ni en el feed
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(2500);
    check("ni en el rail ni en el feed", (await page.locator('a[href*="ko-fi.com"]').count()) === 0
      && (await page.getByText("Apoyar el proyecto").count()) === 0);
    check("sin errores de JS", errors.length === 0, errors.join(" | ").slice(0, 200));
  } finally {
    await browser.close();
  }

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
