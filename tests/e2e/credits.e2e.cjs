// Créditos: pie global con la atribución de RAWG, etiquetas contextuales y
// la página /creditos.
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
const newPage = async ({ mobile = false, locale = "es-MX" } = {}) => {
  const context = await browser.newContext({
    locale,
    viewport: mobile ? { width: 390, height: 844 } : { width: 1366, height: 900 },
    isMobile: mobile,
    hasTouch: mobile
  });
  const page = await context.newPage();
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  return page;
};
const login = async (page, acc = QA.ana) => {
  await page.goto(`${BASE}/login`);
  await page.locator("#email").fill(acc.email);
  await page.locator("#password").fill(acc.password);
  await page.locator("button[type=submit]").click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
};

// El pie de la página: enlace activo a RAWG con rel exactamente "noopener"
const footerCheck = async (page, name, path, ready) => {
  await page.goto(`${BASE}${path}`);
  if (ready) await page.locator(ready).first().waitFor({ timeout: 15000 });
  const rawg = page.locator(".app-footer a", { hasText: "RAWG" });
  const found = await rawg.waitFor({ timeout: 10000 }).then(() => true, () => false);
  const rel = found ? await rawg.getAttribute("rel") : null;
  const href = found ? await rawg.getAttribute("href") : null;
  check(`${name}: pie con "Datos de juegos: RAWG"`, found && /Datos de juegos:/.test(await page.locator(".app-footer").innerText()));
  check(`${name}: enlace a rawg.io, rel="noopener" sin nofollow/noreferrer/sponsored`, href === "https://rawg.io" && rel === "noopener", `${href} rel=${rel}`);
  check(`${name}: Créditos, Privacidad, Términos y año`, await page.locator('.app-footer a[href="/creditos"]').count() === 1
    && await page.locator('.app-footer a[href="/privacidad"]').count() === 1
    && new RegExp(`© ${new Date().getFullYear()} GamerMatch`).test(await page.locator(".app-footer").innerText()));
};

(async () => {
  browser = await chromium.launch({ channel: process.env.E2E_BROWSER || "msedge", headless: true });
  try {
    // ---------- Pie sin sesión ----------
    console.log("\n=== pie sin sesión");
    let page = await newPage();
    await footerCheck(page, "feed (sin sesión)", "/", ".post-card, .feed, main");
    await footerCheck(page, "/explorar (sin sesión)", "/explorar", "main");
    await footerCheck(page, "detalle de partida (sin sesión)", "/post/qa_post_ana", ".post-info");
    await footerCheck(page, "guías (sin sesión)", "/guias", "main");
    await footerCheck(page, "noticias (sin sesión)", "/news", "main");
    await footerCheck(page, "login", "/login", ".auth__form");
    await page.getByRole("button", { name: /Regístrate|Crear cuenta/i }).first().click().catch(() => {});
    await page.locator("#username, #nickname, input[autocomplete=nickname]").first().waitFor({ timeout: 8000 }).catch(() => {});
    check("registro: pie con RAWG", await page.locator(".app-footer a", { hasText: "RAWG" }).count() === 1
      && await page.locator("input[autocomplete=nickname]").count() === 1);
    check("sin errores de JS (sin sesión)", page.errors.length === 0, page.errors.join(" | ").slice(0, 200));
    await page.context().close();

    // ---------- Pie con sesión ----------
    console.log("\n=== pie con sesión");
    page = await newPage();
    await login(page);
    await footerCheck(page, "feed", "/", "main");
    await footerCheck(page, "/explorar", "/explorar", "main");
    await footerCheck(page, "detalle de partida", "/post/qa_post_ana", ".post-info");
    await footerCheck(page, "perfil", "/profile", ".profile-hero");
    await footerCheck(page, "buscar jugadores", "/findPlayers", "main");
    await footerCheck(page, "comunidad", "/comunidad", "main");
    await footerCheck(page, "amigos", "/friends", "main");
    await page.goto(`${BASE}/chat`);
    await page.locator(".chat-page, .chat-layout, .chat-list").first().waitFor({ timeout: 15000 });
    await page.waitForTimeout(1000);
    check("chat (altura completa): sin pie", await page.locator(".app-footer").count() === 0);
    // Menú del avatar -> Créditos
    await page.locator(".app-rail__avatar-btn").click();
    const menu = page.locator(".p-menu, .p-tieredmenu").last();
    await menu.waitFor();
    const order = await menu.locator(".p-menuitem-text").allInnerTexts();
    check("menú del avatar: Créditos después de Términos", order.indexOf("Créditos") === order.indexOf("Términos") + 1, order.join(" | "));
    await menu.getByText("Créditos", { exact: true }).click();
    await page.waitForURL(/\/creditos$/);
    check("Créditos lleva a /creditos", true);
    check("sin errores de JS (con sesión)", page.errors.length === 0, page.errors.join(" | ").slice(0, 200));
    await page.context().close();

    // ---------- Celular: la barra inferior no tapa el pie ----------
    console.log("\n=== celular");
    page = await newPage({ mobile: true });
    await login(page);
    for (const path of ["/", "/profile", "/post/qa_post_ana"]) {
      await page.goto(`${BASE}${path}`);
      const footer = page.locator(".app-footer");
      await footer.waitFor({ timeout: 15000 });
      await page.waitForTimeout(1500);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(700);
      const f = await footer.boundingBox();
      const bar = await page.locator(".app-rail").boundingBox();
      check(`${path}: el pie queda por encima de la barra inferior`, f && bar && f.y + f.height <= bar.y + 1, `pie hasta ${Math.round(f.y + f.height)}, barra desde ${Math.round(bar.y)}`);
      if (path === "/profile") await page.screenshot({ path: `${SHOTS}/credits-footer-mobile.png` });
    }
    await page.context().close();
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
