// "Unirme en Steam" (1): el interruptor de privacidad en Mi perfil.
// Cuenta temporal qa_sj_* con un enlace de Steam; qa_ana no tiene Steam.
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
const ACC = { email: `qa.sj.${STAMP}@example.com`, username: `qa_sj_${STAMP}`, password: `Qa-${STAMP}s9` };

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};

let browser;
const session = async (acc) => {
  const page = await (await browser.newContext({ locale: "es-MX", viewport: { width: 1366, height: 900 } })).newPage();
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  await page.goto(`${BASE}/login`);
  await page.locator("#email").fill(acc.email);
  await page.locator("#password").fill(acc.password);
  await page.locator("button[type=submit]").click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
  await page.goto(`${BASE}/profile`);
  await page.locator(".profile-privacy").waitFor({ timeout: 15000 });
  await page.waitForTimeout(1500);
  return page;
};
const toggle = (page) => page.locator(".profile-privacy .p-inputswitch");
const saved = async () => (await db.doc(`users/${ACC.uid}/private/preferences`).get()).data()?.privacy?.allowSteamJoin;

const cleanup = async () => {
  if (!ACC.uid) return;
  await db.recursiveDelete(db.doc(`users/${ACC.uid}`));
  await db.doc(`publicProfiles/${ACC.uid}`).delete();
  await admin.auth().deleteUser(ACC.uid).catch(() => {});
};

(async () => {
  try {
    const user = await admin.auth().createUser({ email: ACC.email, password: ACC.password, emailVerified: true });
    ACC.uid = user.uid;
    const profile = {
      username: ACC.username, usernameLower: ACC.username, avatar: null, region: "México", description: "", games: [],
      links: ["https://steamcommunity.com/id/gabelogannewell"], createdAt: new Date()
    };
    await db.doc(`users/${ACC.uid}`).set(profile);
    await db.doc(`publicProfiles/${ACC.uid}`).set(profile);
    await db.doc(`users/${ACC.uid}/private/preferences`).set({ onboarding: { completed: true, showAgain: false, completedVersion: 1 } });

    browser = await chromium.launch({ channel: process.env.E2E_BROWSER || "msedge", headless: true });

    // ---------- Sin Steam vinculado ----------
    console.log("\n=== sin Steam");
    let page = await session(QA.ana);
    const section = page.locator(".profile-privacy");
    check("sección Privacidad en Mi perfil (fuera del modo edición)", await section.isVisible() && await page.locator(".profile-savebar").count() === 0);
    check("sin Steam en las redes: interruptor deshabilitado", await toggle(page).locator("input").isDisabled());
    check("con el aviso para vincular Steam", /Vincula tu perfil de Steam/.test(await section.innerText()));
    check("el texto explica qué se comparte, quién y que no hay IP",
      /sala de Steam/.test(await section.innerText()) && /Quiero jugar/.test(await section.innerText()) && /dirección IP/.test(await section.innerText()));
    await page.context().close();

    // ---------- Con Steam: apagado por defecto, se guarda al momento ----------
    console.log("\n=== con Steam");
    page = await session(ACC);
    check("apagado por defecto", !(await toggle(page).getAttribute("class")).includes("p-highlight") && (await saved()) === undefined);
    check("habilitado y sin aviso de vincular", await toggle(page).locator("input").isEnabled() && !/Vincula tu perfil/.test(await page.locator(".profile-privacy").innerText()));
    await toggle(page).click();
    let value;
    for (let i = 0; i < 10 && value !== true; i += 1) {
      value = await saved();
      if (value !== true) await page.waitForTimeout(500);
    }
    check("al encenderlo se guarda privacy.allowSteamJoin true", value === true);
    await page.screenshot({ path: `${SHOTS}/privacidad-steam.png` });
    await page.reload();
    await page.locator(".profile-privacy").waitFor();
    await page.waitForTimeout(1500);
    check("tras recargar sigue encendido", (await toggle(page).getAttribute("class")).includes("p-highlight"));
    await toggle(page).click();
    for (let i = 0; i < 10 && value !== false; i += 1) {
      value = await saved();
      if (value !== false) await page.waitForTimeout(500);
    }
    check("al apagarlo se guarda false", value === false);
    check("sin errores de JS", page.errors.length === 0, page.errors.join(" | ").slice(0, 200));
    await page.context().close();
  } finally {
    if (browser) await browser.close();
    await cleanup();
  }

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
})().catch(async (error) => {
  console.error(error);
  await cleanup().catch(() => {});
  process.exit(1);
});
