// Cuenta sin perfil (registro que falló a medias, auditoría M-13): al
// iniciar sesión, la app espera unos segundos y crea un perfil básico con un
// apodo genérico (no el correo), avisa, Mi perfil se muestra y pide "Elige
// tu apodo" (lo mismo que el primer inicio con Google). Cuenta temporal
// qa_mp_* que se borra al final.
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");
const r = require("module").createRequire(path.join(__dirname, "../../functions/index.js"));
const admin = r("firebase-admin");

admin.initializeApp({ projectId: "gamerteam-4ed20" });
const db = admin.firestore();

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const STAMP = Date.now().toString(36);
const ACC = { email: `qa.mp.${STAMP}@example.com`, password: `Qa-${STAMP}m4` };
const CHOSEN = `qa_mp_elegido_${STAMP}`;
const QA = JSON.parse(fs.readFileSync(`${__dirname}/.qa-users.json`, "utf8"));

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};

const cleanup = async () => {
  if (!ACC.uid) return;
  // Su nombre reservado (nombres únicos): el de su perfil
  const usernameLower = (await db.doc(`users/${ACC.uid}`).get()).get("usernameLower");
  if (usernameLower) await db.doc(`usernames/${usernameLower}`).delete();
  await db.recursiveDelete(db.doc(`users/${ACC.uid}`));
  await db.doc(`publicProfiles/${ACC.uid}`).delete();
  await admin.auth().deleteUser(ACC.uid).catch(() => {});
};

(async () => {
  let browser;
  try {
    // Cuenta de Auth sin users ni publicProfiles (como si el registro fallara a medias)
    const user = await admin.auth().createUser({ email: ACC.email, password: ACC.password, emailVerified: true });
    ACC.uid = user.uid;
    await db.doc(`users/${ACC.uid}/private/preferences`).set({ onboarding: { completed: true, showAgain: false, completedVersion: 1 }, ageConfirmation: { minAge: 18, confirmedAt: new Date() } });
    await db.doc(`users/${ACC.uid}`).delete();

    browser = await chromium.launch({ channel: process.env.E2E_BROWSER || "msedge", headless: true });
    const page = await (await browser.newContext({ locale: "es-MX", viewport: { width: 1366, height: 900 } })).newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${BASE}/login`);
    await page.locator("#email").fill(ACC.email);
    await page.locator("#password").fill(ACC.password);
    await page.locator("button[type=submit]").click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
    await page.goto(`${BASE}/profile`);

    const early = (await db.doc(`users/${ACC.uid}`).get()).exists;
    check("no lo crea en seguida (espera por si el registro lo está escribiendo)", !early);

    const notice = page.locator(".p-toast-message", { hasText: "Completamos tu perfil" });
    check("a los pocos segundos avisa que completó el perfil", await notice.waitFor({ timeout: 25000 }).then(() => true, () => false));
    check("y Mi perfil se muestra (ya no queda cargando)", await page.locator(".profile-hero").waitFor({ timeout: 15000 }).then(() => true, () => false));

    const userDoc = (await db.doc(`users/${ACC.uid}`).get()).data() || {};
    const pub = (await db.doc(`publicProfiles/${ACC.uid}`).get()).data() || {};
    const generic = userDoc.username;
    check("users con un apodo genérico (jugador_123456), no el correo", /^jugador_d{6}(_d{4})?$/.test(generic || "") && !generic.includes("qa.mp"), generic);
    check("y su perfil público, con fecha de creación", pub.username === generic && Boolean(pub.createdAt));
    const reservation = await db.doc(`usernames/${generic.toLowerCase()}`).get();
    check("y su nombre reservado (sin uid)", reservation.exists && !("uid" in reservation.data()));

    // ---------- Elige tu apodo ----------
    const prompt = page.locator(".username-prompt");
    check("pide \"Elige tu apodo\", con el campo vacío", await prompt.waitFor({ timeout: 15000 }).then(() => true, () => false)
      && await page.locator("#username-prompt-input").inputValue() === "");
    check("avisa que es público y con qué apodo sigue si lo salta", (await prompt.innerText()).includes("Es público") && (await prompt.innerText()).includes(generic));
    check("sin botón de cerrar", await prompt.locator(".p-dialog-header-close").count() === 0);
    await page.locator("#username-prompt-input").fill(QA.ana.username.toUpperCase());
    await prompt.getByRole("button", { name: "Guardar apodo" }).click();
    check("un apodo de otra cuenta: avisa que está en uso", await prompt.getByText("Ese apodo ya está en uso").waitFor({ timeout: 10000 }).then(() => true, () => false));
    await page.locator("#username-prompt-input").fill(CHOSEN);
    await page.keyboard.press("Enter");
    await prompt.waitFor({ state: "detached", timeout: 10000 }).catch(() => {});
    check("con Enter guarda y se cierra", await prompt.count() === 0);
    const after = (await db.doc(`users/${ACC.uid}`).get()).data() || {};
    const afterPub = (await db.doc(`publicProfiles/${ACC.uid}`).get()).data() || {};
    check("users y perfil público con el apodo elegido", after.username === CHOSEN && after.usernameLower === CHOSEN && afterPub.username === CHOSEN);
    check("reserva el nuevo y libera el genérico", (await db.doc(`usernames/${CHOSEN}`).get()).exists && !(await db.doc(`usernames/${generic.toLowerCase()}`).get()).exists);
    check("ya no queda pendiente", (await db.doc(`users/${ACC.uid}/private/preferences`).get()).get("chooseUsername") === false);
    await page.reload();
    await page.locator(".profile-hero").waitFor({ timeout: 15000 });
    check("al recargar no vuelve a preguntar", !(await prompt.waitFor({ timeout: 4000 }).then(() => true, () => false)));
    check("Mi perfil muestra el apodo elegido", (await page.locator(".profile-hero").innerText()).includes(CHOSEN));
    check("sin errores de JS", errors.length === 0, errors.join(" | ").slice(0, 200));
  } finally {
    if (browser) await browser.close();
    await cleanup().catch((e) => console.error("limpieza:", e.message));
  }

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
})().catch(async (error) => {
  console.error(error);
  await cleanup().catch(() => {});
  process.exit(1);
});
