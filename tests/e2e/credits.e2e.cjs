// Créditos: pie global con la atribución de RAWG, etiquetas contextuales y
// la página /creditos. Para "Datos de Steam" crea una cuenta temporal
// qa_cr_* con un enlace de Steam (se borra al final) y simula
// getSteamStats; la búsqueda de juegos sí consulta RAWG.
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");
const r = require("module").createRequire(path.join(__dirname, "../../functions/index.js"));
const admin = r("firebase-admin");

admin.initializeApp({ projectId: "gamerteam-4ed20" });
const db = admin.firestore();

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const QA = JSON.parse(fs.readFileSync(`${__dirname}/.qa-users.json`, "utf8"));
const SHOTS = `${__dirname}/screenshots`;
fs.mkdirSync(SHOTS, { recursive: true });
const STAMP = Date.now().toString(36);
const STEAM_ACC = { email: `qa.cr.${STAMP}@example.com`, username: `qa_cr_${STAMP}`, password: `Qa-${STAMP}c7` };
const STEAM_STATS = {
  totalHours: 1234,
  totalGames: 2,
  games: [
    { appid: 730, name: "Counter-Strike 2", playtime_forever: 60000 },
    { appid: 570, name: "Dota 2", playtime_forever: 14000 }
  ]
};

const cleanupSteamAccount = async () => {
  if (!STEAM_ACC.uid) return;
  await db.recursiveDelete(db.doc(`users/${STEAM_ACC.uid}`));
  await db.doc(`publicProfiles/${STEAM_ACC.uid}`).delete();
  await admin.auth().deleteUser(STEAM_ACC.uid).catch(() => {});
};

// "Con tecnología de RAWG" en el panel de sugerencias de un buscador
const searchPanelCheck = async (page, name, input, query = "Valorant") => {
  await input.click();
  await input.pressSequentially(query, { delay: 40 });
  const label = page.locator(".gm-panel .data-source--panel");
  const shown = await label.waitFor({ timeout: 15000 }).then(() => true, () => false);
  const link = label.locator("a");
  check(`${name}: "Con tecnología de RAWG" en el panel de sugerencias`, shown && /Con tecnología de RAWG/.test(await label.innerText()));
  check(`${name}: enlace a rawg.io con rel="noopener"`, shown && (await link.getAttribute("href")) === "https://rawg.io" && (await link.getAttribute("rel")) === "noopener");
  return { label, link, shown };
};

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

    // ---------- Etiquetas contextuales ----------
    console.log("\n=== etiquetas");
    page = await newPage();
    await page.context().route("https://rawg.io/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<title>RAWG (simulado)</title>" }));
    await page.context().route("https://rawg.io", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<title>RAWG (simulado)</title>" }));
    await login(page);
    await page.getByRole("button", { name: /Publicar/ }).first().click();
    await page.locator(".p-dialog", { hasText: "Publicar partida" }).waitFor({ timeout: 10000 });
    const createSearch = await searchPanelCheck(page, "crear partida", page.locator("#create-game"));
    await page.screenshot({ path: `${SHOTS}/credits-search.png` });
    if (createSearch.shown) {
      const [popup] = await Promise.all([page.context().waitForEvent("page"), createSearch.link.click()]);
      await popup.waitForLoadState();
      check("el enlace del panel abre RAWG en otra pestaña", popup.url().startsWith("https://rawg.io"), popup.url());
      await popup.close();
    }
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");

    await page.goto(`${BASE}/profile`);
    await page.locator(".profile-hero").waitFor({ timeout: 15000 });
    await page.getByRole("button", { name: "Editar perfil" }).click();
    await searchPanelCheck(page, "juegos favoritos (Mi perfil)", page.locator(".fav-games__search input"), "Fortnite");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Cancelar" }).last().click().catch(() => {});

    await page.goto(`${BASE}/comunidad`);
    await searchPanelCheck(page, "filtro por juego (Comunidad)", page.locator("#community-game"), "Minecraft");
    check("sin errores de JS (etiquetas)", page.errors.length === 0, page.errors.join(" | ").slice(0, 200));
    await page.context().close();

    // Datos de Steam
    const user = await admin.auth().createUser({ email: STEAM_ACC.email, password: STEAM_ACC.password, emailVerified: true });
    STEAM_ACC.uid = user.uid;
    const profile = {
      username: STEAM_ACC.username, usernameLower: STEAM_ACC.username, avatar: null, region: "México", description: "", games: [],
      links: ["https://steamcommunity.com/profiles/76561197960287930"], createdAt: new Date()
    };
    await db.doc(`users/${STEAM_ACC.uid}`).set(profile);
    await db.doc(`publicProfiles/${STEAM_ACC.uid}`).set(profile);
    await db.doc(`users/${STEAM_ACC.uid}/private/preferences`).set({ onboarding: { completed: true, showAgain: false, completedVersion: 1 } });
    page = await newPage();
    await page.route("**/getSteamStats", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: STEAM_STATS }) }));
    await page.route("**/getGamePortada", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: null }) }));
    await page.route("**/getGameLogo", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: null }) }));
    await login(page, STEAM_ACC);
    await page.goto(`${BASE}/profile`);
    const steamSource = page.locator(".steam-section .data-source");
    check("tarjeta de Steam: \"Datos de Steam\"", await steamSource.waitFor({ timeout: 15000 }).then(() => true, () => false)
      && (await steamSource.innerText()).trim() === "Datos de Steam");
    check("sin logos de terceros en la etiqueta", await steamSource.locator("img, svg").count() === 0);
    await page.locator(".steam-section").screenshot({ path: `${SHOTS}/credits-steam.png` });
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
    await cleanupSteamAccount();
  }

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
