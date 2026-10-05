// Cuentas y privacidad: registro sin teléfono ni copia del correo en users,
// Mi perfil con el correo de Firebase Auth y el cambio de correo por enlace.
// Crea una cuenta temporal qa_tmp_* y la borra al terminar.
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
const TMP = { email: `qa.tmp.${STAMP}@example.com`, username: `qa_tmp_${STAMP}`, password: `Qa-${STAMP}x9` };

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};

let browser;
const newPage = async () => {
  const context = await browser.newContext({ locale: "es-MX", viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  return page;
};
const login = async (page, user) => {
  await page.goto(`${BASE}/login`);
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page.locator("button[type=submit]").click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
  await page.waitForTimeout(2000);
};
const close = async (name, page) => {
  check(`${name}: sin errores de JS`, page.errors.length === 0, page.errors.join(" | ").slice(0, 200));
  await page.context().close();
};
const toastText = (page) => page.locator(".p-toast-message").last().innerText({ timeout: 10000 }).catch(() => "");

const removeTmp = async () => {
  const user = await admin.auth().getUserByEmail(TMP.email).catch(() => null);
  if (!user) return;
  await Promise.all(["users", "publicProfiles", "matchProfiles"].map((c) => db.doc(`${c}/${user.uid}`).delete()));
  await admin.auth().deleteUser(user.uid);
};

(async () => {
  browser = await chromium.launch({ channel: process.env.E2E_BROWSER || "msedge", headless: true });

  try {
    // ---------- 1. Registro sin teléfono ni copia del correo ----------
    console.log("\n=== registro");
    let page = await newPage();
    await page.goto(`${BASE}/login`);
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await page.locator("#email").waitFor();
    check("el formulario ya no pide teléfono", await page.locator("#phone").count() === 0);
    await page.locator("#email").fill(TMP.email);
    await page.locator("#password").fill(TMP.password);
    await page.locator("#username").fill(TMP.username);
    await page.locator(".auth__select").click();
    const filter = page.locator(".p-dropdown-filter");
    if (await filter.count()) await filter.fill("Méxi");
    await page.locator(".p-dropdown-item", { hasText: "México" }).first().click();
    await page.screenshot({ path: `${SHOTS}/registro-sin-telefono.png` });
    await page.locator("button[type=submit]").click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
    const authUser = await admin.auth().getUserByEmail(TMP.email);
    const [priv, pub] = await Promise.all([db.doc(`users/${authUser.uid}`).get(), db.doc(`publicProfiles/${authUser.uid}`).get()]);
    check("la cuenta se crea con el correo en Firebase Auth", authUser.email === TMP.email);
    check("users/{uid} sin correo ni teléfono", priv.exists && !("email" in priv.data()) && !("phone" in priv.data()),
      JSON.stringify(Object.keys(priv.data() || {}).sort()));
    check("publicProfiles creado con región", pub.exists && pub.data().region === "México");

    // ---------- 2. Mi perfil: correo desde Auth, sin teléfono ----------
    console.log("\n=== Mi perfil");
    await page.goto(`${BASE}/profile`);
    const info = page.locator(".personal-info");
    await info.waitFor({ timeout: 15000 });
    const infoText = await info.innerText();
    check("muestra el correo de Firebase Auth", infoText.includes(TMP.email));
    check("ya no muestra teléfono", !/Teléfono/i.test(infoText));
    await page.getByRole("button", { name: "Editar perfil" }).click();
    await page.locator("#profile-email").waitFor();
    check("en edición tampoco hay campo de teléfono", await page.locator("#profile-phone").count() === 0);
    await page.locator(".profile-page textarea").first().fill("Cuenta temporal de QA");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    const saved = await toastText(page);
    check("guardar el perfil funciona con la regla nueva", /Perfil actualizado/.test(saved), saved);
    await close("registro y perfil", page);

    // ---------- 3. Cuenta vieja (limpiada por el script) ----------
    console.log("\n=== cuenta existente (qa_bruno)");
    const brunoOriginal = (await db.doc(`users/${QA.bruno.uid}`).get()).data().description ?? "";
    page = await newPage();
    await login(page, QA.bruno);
    await page.goto(`${BASE}/profile`);
    await page.locator(".personal-info").waitFor({ timeout: 15000 });
    check("su correo sale de Auth aunque users ya no lo guarda", (await page.locator(".personal-info").innerText()).includes(QA.bruno.email));
    await page.getByRole("button", { name: /Edit profile|Editar perfil/ }).click();
    // Sin cambios el botón de guardar está deshabilitado: se toca la descripción
    const about = page.locator(".profile-page textarea").first();
    const brunoDescription = await about.inputValue();
    await about.fill(`${brunoDescription} `);
    await about.fill(brunoDescription.endsWith(".") ? brunoDescription.slice(0, -1) : `${brunoDescription}.`);
    await page.getByRole("button", { name: /Save changes|Guardar cambios/ }).click();
    const brunoSaved = await toastText(page);
    check("guardar su perfil funciona después de limpiar el documento", /updated|actualizado/i.test(brunoSaved), brunoSaved);
    const brunoDoc = (await db.doc(`users/${QA.bruno.uid}`).get()).data();
    check("users de qa_bruno sigue sin correo ni teléfono", !("email" in brunoDoc) && !("phone" in brunoDoc));
    // Deja la descripción como estaba
    await db.doc(`users/${QA.bruno.uid}`).update({ description: brunoOriginal });
    await db.doc(`publicProfiles/${QA.bruno.uid}`).update({ description: brunoOriginal });
    await close("cuenta existente", page);

    // ---------- 4. Cambio de correo: enlace al nuevo, el actual sigue ----------
    console.log("\n=== cambio de correo");
    page = await newPage();
    await login(page, TMP);
    await page.goto(`${BASE}/profile`);
    await page.getByRole("button", { name: "Editar perfil" }).click();
    const newEmail = `qa.tmp.${STAMP}.nuevo@example.com`;
    await page.locator("#profile-email").fill(newEmail);
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    const changeToast = await toastText(page);
    check("aviso: enlace al correo nuevo y el actual sigue activo",
      changeToast.includes(newEmail) && /tu correo actual sigue activo/.test(changeToast), changeToast.replace(/\s+/g, " "));
    check("Firebase Auth conserva el correo actual hasta confirmar", (await admin.auth().getUser(authUser.uid)).email === TMP.email);
    check("y users sigue sin correo", !("email" in (await db.doc(`users/${authUser.uid}`).get()).data()));
    await close("cambio de correo", page);

    // ---------- 5. Recuperar contraseña ----------
    console.log("\n=== recuperar contraseña");
    page = await newPage();
    await page.goto(`${BASE}/login`);
    await page.locator("#email").fill(TMP.email);
    await page.getByRole("button", { name: "¿Olvidaste tu contraseña?" }).click();
    await page.waitForURL(/\/recuperar$/, { timeout: 10000 });
    check("el enlace del login lleva a /recuperar sin sesión", true);
    check("trae el correo que ya había escrito", (await page.locator("#email").inputValue()) === TMP.email);
    check("explica que Google y Steam no tienen contraseña", /Google/.test(await page.locator(".auth__help").innerText()));

    const sendAndRead = async (email) => {
      await page.locator("#email").fill(email);
      await page.locator("button[type=submit]").click();
      await page.locator(".auth__notice").waitFor({ timeout: 15000 });
      return (await page.locator(".auth__notice").innerText()).trim();
    };
    const existing = await sendAndRead(TMP.email);
    const button = page.locator("button[type=submit]");
    const label = (await button.innerText()).trim();
    check("cuenta regresiva visible y botón bloqueado", /Enviar de nuevo en \d+ s/i.test(label) && await button.isDisabled(), label);
    await page.waitForTimeout(2200);
    const later = (await button.innerText()).trim();
    check("la cuenta regresiva avanza", later !== label, `${label} -> ${later}`);
    await page.screenshot({ path: `${SHOTS}/recuperar-enviado.png` });

    // Otra página para no esperar los 60 s: correo que no existe
    await page.reload();
    const missing = await sendAndRead(`qa.noexiste.${STAMP}@example.com`);
    check("mismo mensaje con un correo que no existe (no revela cuentas)", missing === existing && /Si existe una cuenta/.test(existing), existing);

    await page.reload();
    await page.locator("#email").fill("no-es-un-correo");
    await page.locator("button[type=submit]").click();
    const invalid = await toastText(page);
    check("formato inválido: sí se avisa", /formato válido/.test(invalid), invalid.replace(/\s+/g, " "));
    await close("recuperar contraseña", page);

    // El enlace (el que llega por correo) permite fijar otra contraseña y entrar
    const resetLink = await admin.auth().generatePasswordResetLink(TMP.email, { url: `${BASE}/login` });
    page = await newPage();
    await page.goto(resetLink);
    const newPassword = `Qa-${STAMP}-nueva9`;
    await page.locator('input[type="password"]').first().waitFor({ timeout: 20000 });
    await page.locator('input[type="password"]').first().fill(newPassword);
    await page.locator('button, input[type="submit"]').filter({ hasText: /save|guardar/i }).first().click();
    await page.getByText(/changed|cambiado|actualizada/i).first().waitFor({ timeout: 20000 });
    await login(page, { email: TMP.email, password: newPassword });
    check("con el enlace se fija una contraseña nueva y se entra con ella", !page.url().includes("/login"));
    await close("enlace de restablecimiento", page);
  } finally {
    await browser.close();
    await removeTmp();
    console.log(`\nCuenta temporal ${TMP.username} borrada`);
  }

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
})().catch(async (error) => {
  console.error(error);
  await removeTmp().catch(() => {});
  process.exit(1);
});
