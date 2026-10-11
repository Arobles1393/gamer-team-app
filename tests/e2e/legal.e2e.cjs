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
// Correo de contacto: de src/config/contact.js (módulo ES), como LEGAL_VERSIONS
const CONTACT_EMAIL = fs.readFileSync(path.join(__dirname, "../../src/config/contact.js"), "utf8")
  .match(/CONTACT_EMAIL = "([^"]+)"/)[1];
const MAILTO = `mailto:${CONTACT_EMAIL}`;
// Sin desplazamiento horizontal de la página (móvil a 360 px)
const noHorizontalScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
// Versiones vigentes, leídas de src/legal/legalConfig.js (módulo ES): así la
// prueba no queda atrás cuando cambia LEGAL_VERSIONS
const LEGAL_VERSIONS = (() => {
  const config = fs.readFileSync(path.join(__dirname, "../../src/legal/legalConfig.js"), "utf8");
  const [, terms, privacy] = config.match(/LEGAL_VERSIONS\s*=\s*\{\s*terms:\s*"([^"]+)",\s*privacy:\s*"([^"]+)"\s*\}/) || [];
  if (!terms || !privacy) throw new Error("No se encontró LEGAL_VERSIONS en src/legal/legalConfig.js");
  return { terms, privacy };
})();
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
      for (const [route, title, sections] of [["/privacidad", "Política de privacidad", 9], ["/terminos", "Términos de uso", 10]]) {
        await page.goto(`${BASE}${route}`);
        await page.locator(".legal__sections").waitFor({ timeout: 15000 });
        check(`${route}: abre sin sesión con su título`, (await page.locator("h1").innerText()).trim().toLowerCase() === title.toLowerCase());
        check(`${route}: aviso de versión provisional (quedan [PENDIENTE])`, /Versión provisional: puede cambiar/.test(await page.locator(".legal__notice--draft").innerText().catch(() => "")));
        check(`${route}: con fecha de última actualización`, /Última actualización: \d{1,2} de \w+ de \d{4}/.test(await page.locator(".legal__updated").innerText()));
        check(`${route}: ${sections} secciones e índice con las mismas`, await page.locator(".legal__section").count() === sections
          && await page.locator(".legal__toc a").count() === sections);
        const paragraphs = await page.locator(".legal__paragraph").allInnerTexts();
        check(`${route}: cada sección con su texto y sin notas internas [APUNTE]`, paragraphs.length === sections && paragraphs.every((p) => p.length > 40 && !p.includes("[APUNTE")));
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
      check("sin HTML en el contenido: solo el enlace mailto del correo de contacto",
        await page.locator(".legal__paragraph *").count() === await page.locator(".legal__paragraph a.legal__contact").count());
      check("términos: el correo de contacto como enlace mailto (sin marcador)", await page.locator(`.legal__paragraph a[href="${MAILTO}"]`).count() === 1
        && !/PENDIENTE: correo/.test(await page.locator(".legal__sections").innerText()));
      await page.goto(`${BASE}/privacidad`);
      await page.locator(".legal__sections").waitFor({ timeout: 15000 });
      check("privacidad: el correo como enlace mailto en derechos y en contacto", await page.locator(`.legal__paragraph a[href="${MAILTO}"]`).count() === 2
        && (await page.locator(`.legal__paragraph a[href="${MAILTO}"]`).allInnerTexts()).every((text) => text === CONTACT_EMAIL));
      check("pie: \"Contacto\" con mailto", await page.locator(`.app-footer .legal-links a[href="${MAILTO}"]`).innerText() === "Contacto");
      await page.goto(`${BASE}/creditos`);
      const contactLine = page.locator(".credits__contact");
      await contactLine.waitFor({ timeout: 15000 });
      check("créditos: línea \"Contacto\" con el mismo enlace", /^Contacto:/.test(await contactLine.innerText())
        && await contactLine.locator(`a[href="${MAILTO}"]`).count() === 1);
      await close("páginas legales", page);

      // Móvil a 360 px: el pie con "Contacto", créditos y las páginas legales no desbordan
      page = await newPage("es-MX", { width: 360, height: 740 });
      for (const route of ["/privacidad", "/terminos", "/creditos", "/"]) {
        await page.goto(`${BASE}${route}`);
        await page.locator(".app-footer .legal-links").waitFor({ timeout: 15000 });
        await page.waitForTimeout(800);
        check(`360 px: ${route} sin desplazamiento horizontal`, await noHorizontalScroll(page));
      }
      await page.locator(".app-footer").screenshot({ path: `${SHOTS}/pie-contacto-360.png` });
      await close("móvil 360 px", page);

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
      const authLinks = page.locator(".auth__legal .legal-links a");
      await authLinks.first().waitFor({ timeout: 15000 });
      const linkTexts = (await authLinks.allInnerTexts()).join("|");
      check("login: enlaces a Privacidad, Términos y Contacto (pie global)", linkTexts.toLowerCase() === "privacidad|términos|contacto", linkTexts);
      await page.getByRole("button", { name: "Crear cuenta" }).click();
      await page.locator("#username").waitFor();
      check("registro: también los enlaces", await page.locator(".auth__legal .legal-links a").count() === 3);
      check("registro: sin la casilla de consentimiento (flag en false)", await page.locator("#legal-consent").count() === 0);
      await page.locator("#email").fill(QA.ana.email);
      await page.getByRole("button", { name: "Iniciar sesión" }).click().catch(() => {});
      await page.goto(`${BASE}/login`);
      await page.locator("#email").fill(QA.ana.email);
      await page.locator("#password").fill(QA.ana.password);
      await page.locator("button[type=submit]").click();
      await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
      await page.goto(`${BASE}/profile`);
      await page.locator(".app-footer .legal-links").waitFor({ timeout: 15000 });
      check("Mi perfil: enlaces al final (pie global, con Contacto)", await page.locator(".app-footer .legal-links a").count() === 3);
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
      await page.locator("#legal-consent").locator("xpath=..").click();
      await page.locator("label[for=age-confirm]").click();
      check("al marcarla se habilita", await submit.isEnabled());
      await submit.click();
      await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
      const user = await admin.auth().getUserByEmail(TMP.email);
      let consent = null;
      for (let i = 0; i < 10 && !consent; i += 1) {
        consent = (await db.doc(`users/${user.uid}/private/preferences`).get()).data()?.legalConsent ?? null;
        if (!consent) await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      check(`guarda legalConsent con las versiones vigentes (${LEGAL_VERSIONS.terms}/${LEGAL_VERSIONS.privacy}) y la fecha`,
        consent?.termsVersion === LEGAL_VERSIONS.terms && consent?.privacyVersion === LEGAL_VERSIONS.privacy && Boolean(consent?.acceptedAt), JSON.stringify(consent));
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
