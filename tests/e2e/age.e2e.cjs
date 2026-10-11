// Confirmación de edad (18+):
// 1. Registro con correo: la casilla "Tengo 18 años o más" es obligatoria y
//    se guarda ageConfirmation; al entrar no se pregunta otra vez.
// 2. AgeGate: una cuenta sin confirmación (como las de Google o Steam en su
//    primer inicio) ve "Confirma tu edad", que no se cierra sin responder,
//    no tapa las páginas legales, deja cerrar sesión y, al confirmar, guarda
//    y no vuelve a salir. La guía de bienvenida espera a la respuesta.
// Usa cuentas temporales qa_age_* y las borra al terminar.
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
const REG = { email: `qa.age.reg.${STAMP}@example.com`, username: `qa_age_r_${STAMP}`, password: `Qa-${STAMP}a9` };
const GATE = { email: `qa.age.gate.${STAMP}@example.com`, username: `qa_age_g_${STAMP}`, password: `Qa-${STAMP}g9` };

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const prefsOf = async (uid) => (await db.doc(`users/${uid}/private/preferences`).get()).data() ?? null;
const ageSaved = async (uid) => {
  for (let i = 0; i < 10; i += 1) {
    const age = (await prefsOf(uid))?.ageConfirmation;
    if (age) return age;
    await wait(1000);
  }
  return null;
};

const removeAccount = async (acc) => {
  const user = acc.uid ? { uid: acc.uid } : await admin.auth().getUserByEmail(acc.email).catch(() => null);
  if (!user) return;
  const usernameLower = (await db.doc(`users/${user.uid}`).get()).get("usernameLower");
  if (usernameLower) await db.doc(`usernames/${usernameLower}`).delete();
  await db.recursiveDelete(db.doc(`users/${user.uid}`));
  await db.doc(`publicProfiles/${user.uid}`).delete();
  await admin.auth().deleteUser(user.uid).catch(() => {});
};

let browser;
const errors = [];
const newPage = async () => {
  const page = await (await browser.newContext({ locale: "es-MX", viewport: { width: 1366, height: 900 } })).newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  return page;
};
const gate = (page) => page.locator(".age-gate");
const gateOpens = (page, timeout = 10000) => gate(page).waitFor({ timeout }).then(() => true, () => false);
const login = async (page, acc) => {
  await page.goto(`${BASE}/login`);
  await page.locator("#email").fill(acc.email);
  await page.locator("#password").fill(acc.password);
  await page.locator("button[type=submit]").click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
};

(async () => {
  browser = await chromium.launch({ channel: process.env.E2E_BROWSER || "msedge", headless: true });
  try {
    // ---------- 1. Registro con correo ----------
    console.log("\n=== registro con correo");
    let page = await newPage();
    await page.goto(`${BASE}/login`);
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await page.locator("#email").fill(REG.email);
    await page.locator("#password").fill(REG.password);
    await page.locator("#username").fill(REG.username);
    await page.locator(".auth__select").click();
    const filter = page.locator(".p-dropdown-filter");
    if (await filter.count()) await filter.fill("Méxi");
    await page.locator(".p-dropdown-item", { hasText: "México" }).first().click();
    const submit = page.locator("button[type=submit]");
    check("la casilla \"Tengo 18 años o más\" está en el formulario", await page.locator("label[for=age-confirm]").innerText() === "Tengo 18 años o más");
    check("sin marcarla no se puede crear la cuenta", await submit.isDisabled());
    await page.locator("label[for=age-confirm]").click();
    check("al marcarla se habilita", await submit.isEnabled());
    await page.screenshot({ path: `${SHOTS}/registro-edad.png` });
    await submit.click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
    REG.uid = (await admin.auth().getUserByEmail(REG.email)).uid;
    const regAge = await ageSaved(REG.uid);
    check("guarda ageConfirmation { minAge: 18, confirmedAt }", regAge?.minAge === 18 && Boolean(regAge?.confirmedAt), JSON.stringify(regAge));
    check("al entrar no se pregunta la edad otra vez", !(await gateOpens(page, 5000)));
    await page.context().close();

    // ---------- 2. Cuenta sin confirmación (Google, Steam o anterior) ----------
    console.log("\n=== cuenta sin confirmación de edad");
    const user = await admin.auth().createUser({ email: GATE.email, password: GATE.password, displayName: GATE.username, emailVerified: true });
    GATE.uid = user.uid;
    const profile = { username: GATE.username, usernameLower: GATE.username, avatar: null, region: "México", description: "", games: [], links: [], createdAt: new Date() };
    await db.doc(`users/${GATE.uid}`).set(profile);
    await db.doc(`publicProfiles/${GATE.uid}`).set(profile);
    await db.doc(`usernames/${GATE.username}`).set({ createdAt: new Date() });
    // Sin preferencias: la guía de bienvenida también querría abrirse

    page = await newPage();
    await login(page, GATE);
    check("aparece \"Confirma tu edad\"", await gateOpens(page));
    check("la guía de bienvenida espera (no se abre debajo)", await page.locator(".onboarding").count() === 0);
    check("sin botón de cerrar", await gate(page).locator(".p-dialog-header-close").count() === 0);
    await page.keyboard.press("Escape");
    await wait(500);
    check("Escape no lo cierra", await gate(page).isVisible());
    await page.screenshot({ path: `${SHOTS}/confirmar-edad.png` });

    // Las páginas legales se pueden leer
    await page.goto(`${BASE}/terminos`);
    await page.locator(".legal__sections").waitFor({ timeout: 15000 });
    await wait(1500);
    check("/terminos se lee sin el diálogo encima", await gate(page).count() === 0);
    await page.goto(`${BASE}/`);
    check("fuera de las páginas legales vuelve a salir", await gateOpens(page));

    // Cerrar sesión desde el diálogo
    await gate(page).getByRole("button", { name: "Cerrar sesión" }).click();
    await page.locator(".rail-btn--login").waitFor({ timeout: 10000 }).catch(() => {});
    // El diálogo se va con una animación de cierre
    await gate(page).waitFor({ state: "detached", timeout: 5000 }).catch(() => {});
    const loggedOut = { login: await page.locator(".rail-btn--login").count(), gate: await gate(page).count(), url: page.url() };
    check("\"Cerrar sesión\" sale de la cuenta", loggedOut.login > 0 && loggedOut.gate === 0, JSON.stringify(loggedOut));
    check("no se guardó ninguna confirmación", !(await prefsOf(GATE.uid))?.ageConfirmation);

    // Volver a entrar y confirmar
    await login(page, GATE);
    check("al volver a entrar se pregunta otra vez", await gateOpens(page));
    await gate(page).getByRole("button", { name: "Tengo 18 años o más" }).click();
    await gate(page).waitFor({ state: "detached", timeout: 10000 }).catch(() => {});
    check("al confirmar se cierra", await gate(page).count() === 0);
    const gateAge = await ageSaved(GATE.uid);
    check("guarda ageConfirmation { minAge: 18, confirmedAt }", gateAge?.minAge === 18 && Boolean(gateAge?.confirmedAt), JSON.stringify(gateAge));
    check("después se abre la guía de bienvenida", await page.locator(".onboarding").waitFor({ timeout: 10000 }).then(() => true, () => false));
    await page.keyboard.press("Escape");
    await page.reload();
    await page.locator(".app-rail__avatar-btn").waitFor({ timeout: 15000 });
    check("al recargar ya no se pregunta", !(await gateOpens(page, 5000)));
    await page.context().close();

    check("sin errores de JS", errors.length === 0, errors.join(" | ").slice(0, 200));
  } finally {
    await browser.close();
    await removeAccount(REG).catch(() => {});
    await removeAccount(GATE).catch(() => {});
  }

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
})().catch(async (error) => {
  console.error(error);
  await removeAccount(REG).catch(() => {});
  await removeAccount(GATE).catch(() => {});
  process.exit(1);
});
