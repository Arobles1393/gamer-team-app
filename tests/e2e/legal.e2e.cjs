// Páginas legales (/privacidad, /terminos) y enlaces. Con
// E2E_LEGAL_CONSENT=1 prueba la casilla del registro (solo si
// REQUIRE_LEGAL_CONSENT está en true en src/legal/legalConfig.js): crea una
// cuenta temporal qa_legal_* y la borra al terminar.
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
const CONSENT = process.env.E2E_LEGAL_CONSENT === "1";
const STAMP = Date.now().toString(36);
const TMP = { email: `qa.legal.${STAMP}@example.com`, username: `qa_legal_${STAMP}`, password: `Qa-${STAMP}l9` };

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};

let browser;
const newPage = async (locale = "es-MX", viewport = { width: 1366, height: 900 }) => {
  const page = await (await browser.newContext({ locale, viewport })).newPage();
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  return page;
};
const close = async (name, page) => {
  check(`${name}: sin errores de JS`, page.errors.length === 0, page.errors.join(" | ").slice(0, 200));
  await page.context().close();
};

const removeTmp = async () => {
  const user = await admin.auth().getUserByEmail(TMP.email).catch(() => null);
  if (!user) return;
  await db.recursiveDelete(db.doc(`users/${user.uid}`));
  await db.doc(`publicProfiles/${user.uid}`).delete();
  await admin.auth().deleteUser(user.uid);
};

(async () => {
  browser = await chromium.launch({ channel: process.env.E2E_BROWSER || "msedge", headless: true });
  try {
    if (!CONSENT) {
      // ---------- 1. Sin sesión, en español ----------
      console.log("\n=== páginas sin sesión");
      let page = await newPage();
      for (const [route, title, sections] of [["/privacidad", "Política de privacidad", 8], ["/terminos", "Términos de uso", 10]]) {
        await page.goto(`${BASE}${route}`);
        await page.locator(".legal__sections").waitFor({ timeout: 15000 });
        check(`${route}: abre sin sesión con su título`, (await page.locator("h1").innerText()).trim().toLowerCase() === title.toLowerCase());
        check(`${route}: aviso de borrador`, await page.locator(".legal__notice--draft").isVisible());
        check(`${route}: "Última actualización: Pendiente"`, /Última actualización: Pendiente/.test(await page.locator(".legal__updated").innerText()));
        check(`${route}: ${sections} secciones e índice con las mismas`, await page.locator(".legal__section").count() === sections
          && await page.locator(".legal__toc a").count() === sections);
        check(`${route}: todo el contenido dice [PENDIENTE: ...]`, (await page.locator(".legal__paragraph").allInnerTexts()).every((p) => p.startsWith("[PENDIENTE")));
        check(`${route}: sin aviso de "solo en español"`, await page.locator(".legal__notice:not(.legal__notice--draft)").count() === 0);
        check(`${route}: título de la pestaña`, (await page.title()).startsWith(title));
        // Índice: el último enlace lleva a la última sección
        const lastLink = page.locator(".legal__toc a").last();
        const targetId = (await lastLink.getAttribute("href")).slice(1);
        await lastLink.click();
        await page.waitForTimeout(1200);
        // La última sección no puede subir hasta arriba (fin de la página):
        // basta con que la página se haya desplazado y quede a la vista
        const inView = await page.locator(`#${targetId}`).evaluate((el) => {
          const r = el.getBoundingClientRect();
          return window.scrollY > 0 && r.top >= -2 && r.bottom <= innerHeight + 2;
        });
        check(`${route}: el índice lleva a la sección`, inView);
      }
      check("sin HTML en el contenido (solo texto)", await page.locator(".legal__paragraph *").count() === 0);
      await page.screenshot({ path: `${SHOTS}/legal-terminos.png`, fullPage: true });
      await close("páginas legales", page);

      // ---------- 2. Otros idiomas: caen al español con aviso ----------
      console.log("\n=== otros idiomas");
      for (const [locale, notice] of [["en-US", "only available in Spanish"], ["pt-BR", "só está disponível em espanhol"], ["fr-FR", "disponible qu'en espagnol"]]) {
        page = await newPage(locale);
        await page.goto(`${BASE}/privacidad`);
        await page.locator(".legal__sections").waitFor({ timeout: 15000 });
        const text = await page.locator(".legal__notice:not(.legal__notice--draft)").innerText().catch(() => "");
        check(`${locale}: aviso de solo en español y contenido en español`,
          text.includes(notice) && (await page.locator(".legal__section-title").first().innerText()).includes("Qué datos recopilamos"), text);
        await close(`idioma ${locale}`, page);
      }

      // ---------- 3. Enlaces ----------
      console.log("\n=== enlaces");
      page = await newPage();
      await page.goto(`${BASE}/login`);
      const authLinks = page.locator(".auth__legal a");
      await authLinks.first().waitFor({ timeout: 15000 });
      const linkTexts = (await authLinks.allInnerTexts()).join("|");
      check("login: enlaces a Privacidad y Términos", linkTexts.toLowerCase() === "privacidad|términos", linkTexts);
      await page.getByRole("button", { name: "Crear cuenta" }).click();
      await page.locator("#username").waitFor();
      check("registro: también los enlaces", await page.locator(".auth__legal a").count() === 2);
      check("registro: sin la casilla de consentimiento (flag en false)", await page.locator("#legal-consent").count() === 0);
      await page.locator("#email").fill(QA.ana.email);
      await page.getByRole("button", { name: "Iniciar sesión" }).click().catch(() => {});
      await page.goto(`${BASE}/login`);
      await page.locator("#email").fill(QA.ana.email);
      await page.locator("#password").fill(QA.ana.password);
      await page.locator("button[type=submit]").click();
      await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
      await page.goto(`${BASE}/profile`);
      await page.locator(".profile-page__legal").waitFor({ timeout: 15000 });
      check("Mi perfil: enlaces al final", await page.locator(".profile-page__legal a").count() === 2);
      await page.locator(".app-rail__avatar-btn").click();
      await page.locator(".gm-menu").getByText("Términos", { exact: true }).click();
      await page.waitForURL(/\/terminos$/, { timeout: 10000 });
      check("menú del avatar: Términos abre /terminos", true);
      await page.locator(".app-rail__avatar-btn").click();
      await page.locator(".gm-menu").getByText("Privacidad", { exact: true }).click();
      await page.waitForURL(/\/privacidad$/, { timeout: 10000 });
      check("menú del avatar: Privacidad abre /privacidad", true);
      check("el rail no cambió (sin enlaces legales)", await page.locator('.app-rail a[href="/privacidad"], .app-rail a[href="/terminos"]').count() === 0);
      await close("enlaces", page);
    } else {
      // ---------- 4. Casilla de consentimiento (REQUIRE_LEGAL_CONSENT = true) ----------
      console.log("\n=== consentimiento en el registro");
      const page = await newPage();
      await page.goto(`${BASE}/login`);
      await page.getByRole("button", { name: "Crear cuenta" }).click();
      await page.locator("#legal-consent").waitFor({ timeout: 10000 });
      await page.locator("#email").fill(TMP.email);
      await page.locator("#password").fill(TMP.password);
      await page.locator("#username").fill(TMP.username);
      await page.locator(".auth__select").click();
      const filter = page.locator(".p-dropdown-filter");
      if (await filter.count()) await filter.fill("Méxi");
      await page.locator(".p-dropdown-item", { hasText: "México" }).first().click();
      const submit = page.locator("button[type=submit]");
      check("sin marcar la casilla el registro está bloqueado", await submit.isDisabled());
      check("la casilla enlaza a Términos y Privacidad", await page.locator(".legal-consent a").count() === 2);
      await page.screenshot({ path: `${SHOTS}/registro-consentimiento.png` });
      await page.locator(".legal-consent .p-checkbox").click();
      check("al marcarla se habilita", await submit.isEnabled());
      await submit.click();
      await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
      const user = await admin.auth().getUserByEmail(TMP.email);
      let consent = null;
      for (let i = 0; i < 10 && !consent; i += 1) {
        consent = (await db.doc(`users/${user.uid}/private/preferences`).get()).data()?.legalConsent ?? null;
        if (!consent) await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      check("guarda legalConsent con las versiones y la fecha",
        consent?.termsVersion === "borrador-0" && consent?.privacyVersion === "borrador-0" && Boolean(consent?.acceptedAt), JSON.stringify(consent));
      await close("consentimiento", page);
    }
  } finally {
    await browser.close();
    await removeTmp();
  }

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
})().catch(async (error) => {
  console.error(error);
  await removeTmp().catch(() => {});
  process.exit(1);
});
