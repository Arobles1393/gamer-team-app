// Portada sin sesión ("/"): pantalla de elegir personaje con el mando 3D.
// Sin escribir datos: 3D cargado (o imagen fija), pestañas con teclado,
// avance automático pausable, "Crear cuenta" abre el registro, "Ver
// partidas" va a /explorar, móvil, reducir movimiento y que con sesión "/"
// siga siendo el feed.
const fs = require("fs");
const { chromium } = require("playwright-core");

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const QA = JSON.parse(fs.readFileSync(`${__dirname}/.qa-users.json`, "utf8"));
const SHOTS = `${__dirname}/screenshots`;
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};

let browser;
const open = async ({ viewport = { width: 1440, height: 900 }, mobile = false, reduced = false } = {}) => {
  const context = await browser.newContext({ locale: "es-MX", viewport, isMobile: mobile, hasTouch: mobile, reducedMotion: reduced ? "reduce" : "no-preference" });
  const page = await context.newPage();
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  await page.goto(`${BASE}/`);
  await page.locator(".landing").waitFor({ timeout: 20000 });
  await page.waitForTimeout(3000);
  return page;
};
const selectedName = (page) => page.locator('[role="tab"][aria-selected="true"] .landing-reason__name').textContent();
const ctaInView = (page) => page.evaluate(() => document.querySelector(".landing__cta").getBoundingClientRect().bottom <= window.innerHeight);
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

(async () => {
  browser = await chromium.launch({ channel: process.env.E2E_BROWSER || "msedge", headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  try {
    console.log("\n=== escritorio");
    let page = await open();
    check("titular y lema", /Encuentra tu squad/i.test(await page.locator("h1").innerText()));
    const state = await page.locator(".landing__controller").getAttribute("class");
    check("mando 3D cargado (o imagen fija si no hay WebGL)", /--ready|--failed/.test(state), state);
    check("cuatro razones como pestañas, la primera elegida", await page.locator('[role="tab"]').count() === 4 && await selectedName(page) === "Partidas claras");
    check("\"Crear cuenta\" se ve sin bajar", await ctaInView(page));
    check("sin desplazamiento horizontal", await noOverflow(page));
    await page.screenshot({ path: `${SHOTS}/portada.png` });
    // El avance automático pudo moverse: la flecha va a la siguiente de la activa
    const ORDER = ["Partidas claras", "Compatibles contigo", "Steam", "Comunidad"];
    await page.locator('[role="tab"][aria-selected="true"]').focus();
    const beforeArrow = await selectedName(page);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(500);
    const expected = ORDER[(ORDER.indexOf(beforeArrow) + 1) % ORDER.length];
    check("flecha a la derecha: siguiente pestaña y su ficha", await selectedName(page) === expected
      && await page.locator('[role="tabpanel"]').getAttribute("aria-labelledby") === await page.locator('[role="tab"][aria-selected="true"]').getAttribute("id"),
      `${beforeArrow} -> ${await selectedName(page)}`);
    await page.keyboard.press("End");
    await page.waitForTimeout(500);
    check("Fin: última pestaña", await selectedName(page) === "Comunidad");
    check("la ficha marca el ejemplo como ejemplo", /Ejemplo/i.test(await page.locator(".landing-demo__label").innerText()));
    await page.locator(".landing__cta").click();
    await page.waitForURL(/\/login/, { timeout: 10000 });
    check("\"Crear cuenta\" abre el registro", await page.locator("#username").waitFor({ timeout: 8000 }).then(() => true, () => false));
    check("sin errores de JS (escritorio)", page.errors.length === 0, page.errors.join(" | ").slice(0, 200));
    await page.context().close();

    console.log("\n=== avance automático");
    page = await open();
    await page.mouse.move(5, 5);
    const first = await selectedName(page);
    await page.waitForTimeout(6800);
    check("sin interacción avanza solo", await selectedName(page) !== first);
    await page.getByRole("button", { name: "Pausar" }).click();
    await page.mouse.move(5, 5);
    const paused = await selectedName(page);
    await page.waitForTimeout(6800);
    check("\"Pausar\" lo detiene", await selectedName(page) === paused);
    await page.locator(".landing__secondary").click();
    await page.waitForURL(/\/explorar/, { timeout: 10000 });
    check("\"Ver partidas\" lleva a /explorar", true);
    await page.context().close();

    console.log("\n=== móvil y reducir movimiento");
    page = await open({ viewport: { width: 390, height: 844 }, mobile: true });
    check("móvil: \"Crear cuenta\" bajo el titular, sin bajar", await ctaInView(page));
    check("móvil: sin desplazamiento horizontal", await noOverflow(page));
    await page.screenshot({ path: `${SHOTS}/portada-movil.png`, fullPage: true });
    check("sin errores de JS (móvil)", page.errors.length === 0, page.errors.join(" | ").slice(0, 200));
    await page.context().close();
    page = await open({ reduced: true });
    const before = await selectedName(page);
    await page.waitForTimeout(6800);
    check("reducir movimiento: sin avance automático ni botón de pausa", await selectedName(page) === before
      && await page.locator(".landing__autoplay").count() === 0);
    await page.context().close();

    console.log("\n=== con sesión");
    const context = await browser.newContext({ locale: "es-MX", viewport: { width: 1440, height: 900 } });
    page = await context.newPage();
    await page.goto(`${BASE}/login`);
    await page.locator("#email").fill(QA.ana.email);
    await page.locator("#password").fill(QA.ana.password);
    await page.locator("button[type=submit]").click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
    await page.goto(`${BASE}/`);
    await page.locator(".post-card").first().waitFor({ timeout: 20000 });
    check("con sesión, \"/\" sigue siendo el feed", await page.locator(".landing").count() === 0);
    await context.close();
  } finally {
    await browser.close();
  }

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
})().catch(async (error) => {
  console.error(error);
  if (browser) await browser.close();
  process.exit(1);
});
