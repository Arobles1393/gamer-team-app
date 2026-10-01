// Registro: el aviso "Cuenta creada" se ve ya dentro de la app, y no aparece
// si el registro falla. Crea qa_fer temporal y la borra al terminar.
const fs = require("fs");
const { chromium } = require("playwright-core");
const r = require("module").createRequire(require("path").join(__dirname, "../../functions/index.js"));
const admin = r("firebase-admin");
admin.initializeApp({ projectId: "gamerteam-4ed20" });
const db = admin.firestore();
const QA = JSON.parse(fs.readFileSync(`${__dirname}/.qa-users.json`, "utf8"));
const results = [];
const check = (n, ok, extra = "") => { results.push(ok); console.log(`${ok ? "OK   " : "FALLA"} ${n}${extra ? ` -> ${extra}` : ""}`); };

const register = async (page, email, username) => {
  await page.goto(`${process.env.E2E_BASE_URL || "http://localhost:3000"}/login`);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await page.locator("#email").fill(email);
  await page.locator("#password").fill("Qa-Temporal-123");
  await page.locator("#username").fill(username);
  await page.locator(".auth__select").click();
  const filter = page.locator(".p-dropdown-filter");
  if (await filter.count()) await filter.fill("Perú");
  await page.locator(".p-dropdown-item", { hasText: "Perú" }).first().click();
  await page.locator("button[type=submit]").click();
};

(async () => {
  const browser = await chromium.launch({ channel: process.env.E2E_BROWSER || "msedge", headless: true });
  try {
    // Correo ya registrado: error y sin bienvenida
    let page = await (await browser.newContext({ locale: "es-MX" })).newPage();
    await register(page, QA.ana.email, "qa_repetido");
    const err = page.locator(".p-toast-message").last();
    await err.waitFor({ timeout: 10000 });
    check("correo repetido: muestra el error", /Ya existe una cuenta con ese correo/.test(await err.innerText()), (await err.innerText()).replace(/\s+/g, " "));
    check("correo repetido: sigue en el formulario", page.url().includes("/login"));
    check("correo repetido: no queda bienvenida pendiente", await page.evaluate(() => sessionStorage.getItem("gm-welcome-notice")) === null);
    await page.context().close();

    // Registro correcto: la bienvenida se ve en la app
    page = await (await browser.newContext({ locale: "es-MX" })).newPage();
    await register(page, "qa.fer@example.com", "qa_fer");
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
    const toast = page.locator(".p-toast-message").last();
    await toast.waitFor({ timeout: 10000 });
    const text = (await toast.innerText()).replace(/\s+/g, " ");
    check("registro: ya en la app se ve 'Cuenta creada'", /Cuenta creada/.test(text) && /Bienvenido a GamerMatch/.test(text), text);
    await page.screenshot({ path: `${__dirname}/screenshots/bienvenida.png` });
    await page.reload();
    await page.waitForTimeout(3000);
    check("registro: al recargar no se repite", await page.locator(".p-toast-message").count() === 0);
    await page.context().close();
  } finally {
    await browser.close();
    // Borra qa_fer (cuenta, users y publicProfiles)
    const user = await admin.auth().getUserByEmail("qa.fer@example.com").catch(() => null);
    if (user) {
      await Promise.all([db.doc(`users/${user.uid}`).delete(), db.doc(`publicProfiles/${user.uid}`).delete()]);
      await admin.auth().deleteUser(user.uid);
      console.log("qa_fer temporal borrada");
    }
  }
  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
