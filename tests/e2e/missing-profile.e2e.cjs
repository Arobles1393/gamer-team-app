// Cuenta sin perfil (registro que falló a medias, auditoría M-13): al
// iniciar sesión, la app espera unos segundos y crea un perfil básico, avisa
// y Mi perfil se muestra. Cuenta temporal qa_mp_* que se borra al final.
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

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};

const cleanup = async () => {
  if (!ACC.uid) return;
  await db.recursiveDelete(db.doc(`users/${ACC.uid}`));
  await db.doc(`publicProfiles/${ACC.uid}`).delete();
  // Su nombre reservado (nombres únicos)
  for (const name of (await db.collection("usernames").where("uid", "==", ACC.uid).get()).docs) await name.ref.delete();
  await admin.auth().deleteUser(ACC.uid).catch(() => {});
};

(async () => {
  let browser;
  try {
    // Cuenta de Auth sin users ni publicProfiles (como si el registro fallara a medias)
    const user = await admin.auth().createUser({ email: ACC.email, password: ACC.password, emailVerified: true });
    ACC.uid = user.uid;
    await db.doc(`users/${ACC.uid}/private/preferences`).set({ onboarding: { completed: true, showAgain: false, completedVersion: 1 } });
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
    const expected = ACC.email.split("@")[0];
    check("users con el nombre de la parte del correo antes de la @", userDoc.username === expected && userDoc.usernameLower === expected.toLowerCase(), userDoc.username);
    check("y su perfil público, con fecha de creación", pub.username === expected && Boolean(pub.createdAt));
    const reservation = await db.doc(`usernames/${expected.toLowerCase()}`).get();
    check("y su nombre reservado", reservation.exists && reservation.data().uid === ACC.uid);
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
