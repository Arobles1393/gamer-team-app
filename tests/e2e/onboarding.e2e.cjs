// Guía de bienvenida: se abre sola la primera vez, navegación con ratón y
// teclado, pregunta final ("No" / "Sí" / cerrar sin responder), apertura
// manual desde el menú y desde Mi perfil, y dónde no se abre. Usa una
// cuenta temporal qa_onb_* SIN verificar (también prueba que puede guardar
// su respuesta) y la borra al terminar.
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");
const r = require("module").createRequire(path.join(__dirname, "../../functions/index.js"));
const admin = r("firebase-admin");

admin.initializeApp({ projectId: "gamerteam-4ed20" });
const db = admin.firestore();

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const SHOTS = `${__dirname}/screenshots`;
fs.mkdirSync(SHOTS, { recursive: true });
const STAMP = Date.now().toString(36);
const ACC = { email: `qa.onb.${STAMP}@example.com`, username: `qa_onb_${STAMP}`, password: `Qa-${STAMP}o9` };
const STEPS = 11;

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};
const prefsRef = () => db.doc(`users/${ACC.uid}/private/preferences`);
const onboardingSaved = async (expected) => {
  for (let i = 0; i < 10; i += 1) {
    const saved = (await prefsRef().get()).data()?.onboarding;
    if (saved && Object.entries(expected).every(([k, v]) => saved[k] === v)) return saved;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return (await prefsRef().get()).data()?.onboarding ?? null;
};

let browser;
let context;
let page;
const errors = [];
const guide = () => page.locator(".onboarding");
const question = () => page.locator(".onboarding-question");
const guideOpens = (timeout = 10000) => guide().waitFor({ timeout }).then(() => true, () => false);
const stepTitle = () => page.locator(".onboarding__title").innerText();
const login = async () => {
  await page.goto(`${BASE}/login`);
  await page.locator("#email").fill(ACC.email);
  await page.locator("#password").fill(ACC.password);
  await page.locator("button[type=submit]").click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
};
const logout = async () => {
  await page.locator(".app-rail__avatar-btn").click();
  await page.locator(".gm-menu").getByText("Cerrar sesión", { exact: true }).click();
  await page.locator(".rail-btn--login").waitFor({ timeout: 10000 });
};
const goToLastStep = async () => {
  for (let i = 0; i < STEPS - 1; i += 1) await page.keyboard.press("ArrowRight");
};

const cleanup = async () => {
  if (!ACC.uid) return;
  await db.recursiveDelete(db.doc(`users/${ACC.uid}`));
  await db.doc(`publicProfiles/${ACC.uid}`).delete();
  await admin.auth().deleteUser(ACC.uid).catch(() => {});
};

(async () => {
  try {
    const user = await admin.auth().createUser({ email: ACC.email, password: ACC.password, displayName: ACC.username, emailVerified: false });
    ACC.uid = user.uid;
    const profile = { username: ACC.username, usernameLower: ACC.username, avatar: null, region: "México", description: "", games: [], links: [], createdAt: new Date() };
    await db.doc(`users/${ACC.uid}`).set(profile);
    await db.doc(`publicProfiles/${ACC.uid}`).set(profile);

    browser = await chromium.launch({ channel: process.env.E2E_BROWSER || "msedge", headless: true });
    context = await browser.newContext({ locale: "es-MX", viewport: { width: 1366, height: 900 } });
    page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));

    // ---------- 1. No se abre en las páginas legales ----------
    console.log("\n=== primera vez");
    await page.goto(`${BASE}/login`);
    await page.locator("#email").fill(ACC.email);
    await page.locator("#password").fill(ACC.password);
    await page.locator("button[type=submit]").click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
    // Cuenta nueva: se abre sola al primer inicio de sesión
    check("cuenta nueva: la guía se abre sola", await guideOpens());
    check("con el aviso de verificar el correo detrás", await page.locator(".verify-banner").count() === 1);
    check(`muestra ${STEPS} pasos (todas las secciones existen)`, await page.locator(".onboarding__dot").count() === STEPS);
    check("empieza en la bienvenida", /Bienvenido a GamerMatch/.test(await stepTitle()));
    await page.screenshot({ path: `${SHOTS}/guia-bienvenida.png` });

    // ---------- 2. Navegación con ratón y teclado ----------
    console.log("\n=== navegación");
    const back = guide().getByRole("button", { name: "Atrás" });
    check("Atrás deshabilitado en el primer paso", await back.isDisabled());
    await guide().getByRole("button", { name: "Siguiente" }).click();
    check("Siguiente avanza (Partidas)", /Partidas/.test(await stepTitle()));
    await page.keyboard.press("ArrowRight");
    check("flecha derecha avanza (Publica tu partida)", /Publica tu partida/.test(await stepTitle()));
    await page.keyboard.press("ArrowLeft");
    check("flecha izquierda retrocede", /Partidas/.test(await stepTitle()));
    await back.click();
    check("Atrás retrocede", /Bienvenido/.test(await stepTitle()));
    check("el punto activo sigue al paso", await page.locator(".onboarding__dots li").nth(0).getAttribute("class").then((c) => c.includes("active")));
    await goToLastStep();
    check("el último paso explica dónde reabrirla", /menú de tu avatar|Mi perfil/.test(await guide().innerText()));
    check("y su botón dice Terminar", await guide().getByRole("button", { name: "Terminar" }).count() === 1);

    // ---------- 3. Escape = saltar -> pregunta; respuesta "No" ----------
    console.log("\n=== respuesta No");
    await page.keyboard.press("Escape");
    await question().waitFor({ timeout: 5000 });
    check("Escape salta a la pregunta final", (await question().innerText()).toLowerCase().includes("¿quieres que esta guía vuelva a aparecer?"));
    await page.screenshot({ path: `${SHOTS}/guia-pregunta.png` });
    await question().getByRole("button", { name: "No, no volver a mostrar" }).click();
    const no = await onboardingSaved({ completed: true, showAgain: false });
    check("sin verificar el correo: se guarda completed true, showAgain false, versión 1",
      no?.completed === true && no.showAgain === false && no.completedVersion === 1, JSON.stringify(no));
    await page.reload();
    check("al recargar no aparece", !(await guideOpens(6000)));
    await logout();
    await login();
    check("al volver a iniciar sesión no aparece", !(await guideOpens(6000)));

    // ---------- 4. Apertura manual: menú del avatar; cerrar la pregunta sin responder no cambia nada ----------
    console.log("\n=== apertura manual");
    await page.locator(".app-rail__avatar-btn").click();
    await page.locator(".gm-menu").getByText("Guía de la app", { exact: true }).click();
    check("Guía de la app (menú) la abre", await guideOpens(5000));
    await guide().getByRole("button", { name: "Saltar" }).click();
    await question().waitFor({ timeout: 5000 });
    await page.keyboard.press("Escape");
    await question().waitFor({ state: "detached", timeout: 5000 });
    const manualDismiss = (await prefsRef().get()).data().onboarding;
    check("abierta a mano, cerrar la pregunta sin responder no cambia showAgain", manualDismiss.showAgain === false);

    // ---------- 5. Desde Mi perfil, respuesta "Sí" ----------
    console.log("\n=== respuesta Sí");
    await page.goto(`${BASE}/profile`);
    await page.locator(".profile-guide").getByRole("button", { name: "Ver la guía" }).click();
    check("el botón de Mi perfil (junto al idioma) la abre", await guideOpens(5000));
    await goToLastStep();
    await guide().getByRole("button", { name: "Terminar" }).click();
    await question().getByRole("button", { name: "Sí, mostrármela de nuevo" }).click();
    const yes = await onboardingSaved({ showAgain: true });
    check("se guarda showAgain true", yes?.showAgain === true, JSON.stringify(yes));
    await page.reload();
    check("en la misma sesión, al recargar no aparece", !(await guideOpens(6000)));
    await logout();
    await login();
    check("al iniciar la siguiente sesión aparece una vez", await guideOpens());
    await page.keyboard.press("Escape");
    await question().getByRole("button", { name: "Sí, mostrármela de nuevo" }).click();
    await question().waitFor({ state: "detached", timeout: 5000 });
    await page.reload();
    check("y no en cada recarga", !(await guideOpens(6000)));

    // ---------- 6. Abierta sola, cerrar la pregunta sin responder = "No" ----------
    console.log("\n=== cerrar sin responder");
    await prefsRef().set({ onboarding: { completed: false, showAgain: false, completedVersion: 1 } }, { merge: true });
    await page.goto(`${BASE}/privacidad`);
    await page.reload();
    check("en /privacidad no se abre", !(await guideOpens(5000)));
    await page.locator(".app-rail a[href='/']").first().click();
    check("al pasar a otra página sí se abre (no estaba completada)", await guideOpens());
    await page.keyboard.press("Escape");
    await question().waitFor({ timeout: 5000 });
    await page.keyboard.press("Escape");
    const dismissed = await onboardingSaved({ completed: true, showAgain: false });
    check("cerrar sin responder guarda showAgain false", dismissed?.completed === true && dismissed.showAgain === false, JSON.stringify(dismissed));
    const info = await page.locator(".p-toast-message").last().innerText({ timeout: 8000 }).catch(() => "");
    check("y avisa que se puede reabrir desde el menú", /volver a abrirla desde el menú/.test(info), info.replace(/\s+/g, " "));

    // ---------- 7. Celular ----------
    console.log("\n=== celular");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/`);
    await page.locator(".verify-banner").waitFor({ timeout: 10000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator(".app-rail__avatar-btn").click();
    // Si se hace clic durante la animación de apertura del menú, Playwright
    // desplaza la página para "alcanzar" la entrada (con el pie global la
    // página ya es más alta que la pantalla)
    await page.waitForTimeout(600);
    await page.locator(".gm-menu").getByText("Guía de la app", { exact: true }).click();
    await guideOpens(5000);
    // Se mide cuando termina la animación de apertura
    await page.waitForTimeout(800);
    const box = await guide().boundingBox();
    check("en celular ocupa casi toda la pantalla, sin desbordarse",
      box && box.width >= 360 && box.x >= 0 && box.x + box.width <= 390 && box.height > 580 && box.y + box.height >= 830, JSON.stringify(box));
    const bannerButton = await page.locator(".verify-banner button").first().boundingBox();
    check("deja a la vista los botones del aviso de verificación",
      bannerButton && bannerButton.y >= 0 && bannerButton.y + bannerButton.height <= box.y, JSON.stringify(bannerButton));
    check("los botones se ven", await guide().getByRole("button", { name: "Siguiente" }).isVisible() && await guide().getByRole("button", { name: "Saltar" }).isVisible());
    await page.screenshot({ path: `${SHOTS}/guia-movil.png` });

    check("sin errores de JS", errors.length === 0, errors.join(" | ").slice(0, 200));
  } finally {
    if (browser) await browser.close();
    await cleanup().catch((e) => console.error("limpieza:", e.message));
    console.log("\nCuenta temporal qa_onb_* borrada");
  }

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
})().catch(async (error) => {
  console.error(error);
  await cleanup().catch(() => {});
  process.exit(1);
});
