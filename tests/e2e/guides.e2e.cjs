// Guías: escribir una guía con imagen y video, moderación desde
// /admin/guides, visibilidad según estado, Mis guías y HTML malicioso
// escrito saltándose la app. Borra las guías que crea al terminar.
// Requiere el emulador de functions solo para el escenario "externa"
// (E2E_GUIDES_EXTERNAL=1).
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

const IMAGE = "https://media.rawg.io/media/games/b11/b11127b9ee3c3701bd15b9af3286d20e.jpg";
const VIDEO_ID = "dQw4w9WgXcQ";
const TITLE = `Guía QA de Jett ${Date.now().toString(36)}`;
const XSS_TITLE = `Guía QA maliciosa ${Date.now().toString(36)}`;

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};
const createdIds = [];

let browser;
const session = async (user) => {
  const context = await browser.newContext({ locale: "es-MX", viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  page.errors = [];
  page.dialogs = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  page.on("dialog", async (dialog) => {
    page.dialogs.push(dialog.message());
    await dialog.dismiss();
  });
  if (user) {
    await page.goto(`${BASE}/login`);
    await page.locator("#email").fill(user.email);
    await page.locator("#password").fill(user.password);
    await page.locator("button[type=submit]").click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
    await page.waitForTimeout(2000);
  }
  return page;
};
const close = async (name, page) => {
  check(`${name}: sin errores de JS`, page.errors.length === 0, page.errors.join(" | ").slice(0, 200));
  await page.context().close();
};
const body = (page) => page.locator("body").innerText();

(async () => {
  browser = await chromium.launch({ channel: process.env.E2E_BROWSER || "msedge", headless: true });

  try {
    // ---------- 1. Ana escribe una guía con portada, imagen y video ----------
    console.log("\n=== escribir guía");
    let page = await session(QA.ana);
    await page.goto(`${BASE}/guias/nueva`);
    await page.locator("#guide-game").fill("Valorant");
    await page.locator(".p-autocomplete-item").first().waitFor({ timeout: 15000 });
    await page.locator(".p-autocomplete-item").first().click();
    await page.locator("#guide-title").fill(TITLE);

    await page.getByRole("textbox", { name: "Pegar URL de imagen" }).fill(IMAGE);
    await page.getByRole("button", { name: "Usar imagen" }).click();
    check("portada: se ve la vista previa", await page.locator(".guide-cover img").count() === 1);

    const editor = page.locator(".guide-editor__content");
    await editor.waitFor({ timeout: 20000 });
    await editor.click();
    await page.getByRole("button", { name: "Título", exact: true }).click();
    await page.keyboard.type("Cómo jugar con Jett");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Usa el ");
    await page.getByRole("button", { name: "Negrita" }).click();
    await page.keyboard.type("dash");
    await page.getByRole("button", { name: "Negrita" }).click();
    await page.keyboard.type(" para entrar al sitio.");
    await page.keyboard.press("Enter");

    await page.getByRole("button", { name: "Insertar imagen" }).click();
    await page.getByLabel("Desde una URL").fill(IMAGE);
    await page.getByRole("button", { name: "Insertar", exact: true }).click();
    check("editor: la imagen insertada aparece en el texto", await editor.locator("img").count() === 1);

    await page.locator("#guide-youtube").fill("https://youtu.be/xx");
    check("YouTube: un link inválido muestra error", /no es un link válido de YouTube/.test(await body(page)));
    await page.locator("#guide-youtube").fill(`https://www.youtube.com/watch?v=${VIDEO_ID}&t=42s`);
    const preview = page.locator(".guide-form__video iframe");
    check("YouTube: vista previa con youtube-nocookie", (await preview.getAttribute("src")) === `https://www.youtube-nocookie.com/embed/${VIDEO_ID}`);
    await page.screenshot({ path: `${SHOTS}/guia-formulario.png`, fullPage: true });

    await page.getByRole("button", { name: "Enviar para revisión" }).click();
    // El detalle de la guía nueva (no /guias/nueva, donde ya estamos)
    await page.waitForURL((url) => /^\/guias\/[A-Za-z0-9]+$/.test(url.pathname) && !url.pathname.endsWith("/nueva"), { timeout: 20000 });
    const guideId = page.url().split("/").pop();
    createdIds.push(guideId);
    const sentNotice = await page.getByText("Guía enviada", { exact: false }).waitFor({ timeout: 10000 }).then(() => true, () => false);
    check("enviar: lleva al detalle con el aviso de enviada", sentNotice);
    await page.screenshot({ path: `${SHOTS}/guia-enviada.png`, fullPage: true });

    const saved = (await db.doc(`guides/${guideId}`).get()).data();
    check("Firestore: pendiente, original, de ana, con el video", saved.status === "pending" && saved.type === "original"
      && saved.authorId === QA.ana.uid && saved.youtubeVideoId === VIDEO_ID && saved.coverImage === IMAGE);
    check("Firestore: el HTML guardado trae título, negrita e imagen", /<h2>/.test(saved.content) && /<strong>dash<\/strong>/.test(saved.content) && saved.content.includes(IMAGE),
      saved.content.slice(0, 160));
    await close("escribir guía", page);

    // ---------- 2. Pendiente: nadie más la ve ----------
    console.log("\n=== pendiente");
    page = await session(QA.bruno);
    await page.goto(`${BASE}/guias`);
    await page.waitForTimeout(3000);
    check("bruno no la ve en /guias", !(await body(page)).includes(TITLE));
    await page.goto(`${BASE}/guias/${guideId}`);
    await page.waitForTimeout(3000);
    check("bruno no la puede abrir por link", !(await body(page)).includes(TITLE));
    await close("pendiente", page);

    page = await session(null);
    await page.goto(`${BASE}/guias/${guideId}`);
    await page.waitForTimeout(3000);
    check("sin sesión tampoco", !(await body(page)).includes(TITLE));
    await close("pendiente (sin sesión)", page);

    // ---------- 3. Mis guías ----------
    console.log("\n=== mis guías");
    page = await session(QA.ana);
    await page.locator(".app-rail__avatar-btn").click();
    await page.locator(".gm-menu").waitFor({ timeout: 5000 });
    check("menú de una cuenta normal: sin Administración", !/Administración/.test(await page.locator(".gm-menu").innerText()));
    await page.keyboard.press("Escape");
    await page.goto(`${BASE}/profile`);
    const mine = page.locator(".my-guides__item", { hasText: TITLE });
    await mine.waitFor({ timeout: 10000 });
    check("Mi perfil la muestra como Pendiente", /Pendiente/i.test(await mine.innerText()));
    await close("mis guías", page);

    // ---------- 4. El admin la aprueba ----------
    console.log("\n=== moderación");
    const previous = (await admin.auth().getUser(QA.diego.uid)).customClaims || {};
    await admin.auth().setCustomUserClaims(QA.diego.uid, { ...previous, admin: true });
    try {
      page = await session(QA.diego);
      // Desde el menú del avatar, sin escribir la URL
      const dot = await page.locator(".app-rail__avatar-dot").waitFor({ timeout: 10000 }).then(() => true, () => false);
      check("admin: punto en el avatar por haber pendientes", dot);
      await page.locator(".app-rail__avatar-btn").click();
      const menu = page.locator(".gm-menu");
      await menu.waitFor({ timeout: 5000 });
      const menuText = await menu.innerText();
      check("admin: el menú muestra Administración con Reportes y Guías por revisar (n)",
        /Administración/i.test(menuText) && /Reportes/.test(menuText) && /Guías por revisar \(\d+\)/.test(menuText), menuText.replace(/\s+/g, " "));
      await page.screenshot({ path: `${SHOTS}/menu-admin.png` });
      await menu.getByText("Reportes", { exact: false }).click();
      await page.waitForURL(/\/admin\/reports$/, { timeout: 10000 });
      check("admin: Reportes lleva a /admin/reports", true);
      await page.locator(".app-rail__avatar-btn").click();
      await page.locator(".gm-menu").getByText("Guías por revisar", { exact: false }).click();
      await page.waitForURL(/\/admin\/guides$/, { timeout: 10000 });
      const item = page.locator(".admin-guide", { hasText: TITLE });
      await item.waitFor({ timeout: 15000 });
      check("admin: ve la guía con su video e imagen", await item.locator("iframe").count() === 1 && await item.locator(".guide-content img").count() === 1);
      await page.screenshot({ path: `${SHOTS}/guia-admin.png`, fullPage: true });
      await item.getByLabel("Nota para el autor").fill("¡Muy buena guía!");
      await item.getByRole("button", { name: "Aprobar" }).click();
      await page.waitForTimeout(3000);
      check("admin: al aprobarla desaparece de pendientes", await page.locator(".admin-guide", { hasText: TITLE }).count() === 0);
      const reviewed = (await db.doc(`guides/${guideId}`).get()).data();
      check("Firestore: aprobada con nota y fecha de revisión", reviewed.status === "approved" && reviewed.reviewNote === "¡Muy buena guía!" && Boolean(reviewed.reviewedAt));
      await close("moderación", page);
    } finally {
      const { admin: _removed, ...rest } = (await admin.auth().getUser(QA.diego.uid)).customClaims || {};
      await admin.auth().setCustomUserClaims(QA.diego.uid, Object.keys(rest).length ? rest : null);
      check("se quitó el admin temporal a qa_diego", !(await admin.auth().getUser(QA.diego.uid)).customClaims?.admin);
    }

    // ---------- 5. Aprobada: la ven todos ----------
    console.log("\n=== aprobada");
    page = await session(null);
    await page.goto(`${BASE}/guias`);
    const card = page.locator(".guide-card", { hasText: TITLE });
    await card.waitFor({ timeout: 15000 });
    // El autor se resuelve en vivo desde publicProfiles
    const authorShown = await card.getByText("qa_ana", { exact: false }).waitFor({ timeout: 10000 }).then(() => true, () => false);
    check("sin sesión la ve en /guias, con su autor", authorShown);
    await page.screenshot({ path: `${SHOTS}/guias-lista.png`, fullPage: true });
    await card.click();
    await page.waitForURL(/\/guias\//);
    await page.locator(".guide-content").waitFor({ timeout: 10000 });
    const content = page.locator(".guide-content");
    check("detalle: título, negrita e imagen renderizados", await content.locator("h2").count() === 1
      && await content.locator("strong").innerText() === "dash" && await content.locator("img").count() === 1);
    check("detalle: video de youtube-nocookie", (await page.locator(".guide-video iframe").getAttribute("src")) === `https://www.youtube-nocookie.com/embed/${VIDEO_ID}`);
    await page.screenshot({ path: `${SHOTS}/guia-detalle.png`, fullPage: true });
    await close("aprobada", page);

    // ---------- 6. HTML malicioso escrito saltándose la app ----------
    console.log("\n=== HTML malicioso");
    const evil = await db.collection("guides").add({
      authorId: QA.ana.uid, game: "Valorant", title: XSS_TITLE, type: "original", status: "approved",
      content: [
        "<p>Texto normal</p>",
        "<img src=x onerror=\"alert('xss-img')\">",
        "<script>alert('xss-script')</script>",
        "<a href=\"javascript:alert('xss-href')\">clic</a>",
        "<iframe src=\"https://evil.example.com\"></iframe>",
        "<p style=\"position:fixed;inset:0\" onclick=\"alert('xss-click')\">tapa todo</p>",
        "<svg onload=\"alert('xss-svg')\"></svg>"
      ].join(""),
      coverImage: null, youtubeVideoId: null, externalUrl: null, externalPreview: null,
      reviewNote: null, reviewedAt: null, createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    createdIds.push(evil.id);
    page = await session(QA.bruno);
    await page.goto(`${BASE}/guias/${evil.id}`);
    await page.locator(".guide-content").waitFor({ timeout: 10000 });
    await page.locator(".guide-content").getByText("tapa todo").click().catch(() => {});
    await page.waitForTimeout(1500);
    const html = await page.locator(".guide-content").innerHTML();
    check("no se ejecutó ningún script ni alert", page.dialogs.length === 0, page.dialogs.join(", "));
    check("el HTML mostrado no tiene script, iframe, svg, on*, style ni javascript:",
      !/<script|<iframe|<svg|\son\w+=|style=|javascript:/i.test(html), html);
    check("el texto legítimo sí se muestra", /Texto normal/.test(html));
    await close("HTML malicioso", page);

    // ---------- 7. Guía de link externo (necesita el emulador de functions) ----------
    if (process.env.E2E_GUIDES_EXTERNAL === "1") {
      console.log("\n=== guía externa");
      const EXTERNAL_URL = "https://github.com/firebase/firebase-tools";
      const EXTERNAL_TITLE = `Guía QA externa ${Date.now().toString(36)}`;
      page = await session(QA.ana);
      await page.goto(`${BASE}/guias/nueva`);
      await page.getByRole("radio", { name: "Compartir un link" }).click();
      await page.locator("#guide-game").fill("Valorant");
      await page.locator(".p-autocomplete-item").first().waitFor({ timeout: 15000 });
      await page.locator(".p-autocomplete-item").first().click();
      await page.locator("#guide-title").fill(EXTERNAL_TITLE);

      // Intento de SSRF desde la interfaz: la función no la pide y la UI lo dice
      await page.locator("#guide-url").fill("http://169.254.169.254/computeMetadata/v1/");
      await page.locator("#guide-title").click();
      const ssrfFailed = await page.getByText("No se pudo generar la vista previa", { exact: false }).waitFor({ timeout: 15000 }).then(() => true, () => false);
      check("SSRF: con 169.254.169.254 no hay vista previa", ssrfFailed && await page.locator(".link-preview").count() === 0);

      await page.locator("#guide-url").fill(EXTERNAL_URL);
      await page.locator("#guide-title").click();
      const card = page.locator(".link-preview");
      const loaded = await card.waitFor({ timeout: 20000 }).then(() => true, () => false);
      const cardText = loaded ? await card.innerText() : "";
      check("vista previa del sitio real (título y dominio)", /firebase-tools/i.test(cardText) && /github\.com/.test(cardText), cardText.replace(/\s+/g, " ").slice(0, 120));
      await page.screenshot({ path: `${SHOTS}/guia-externa-form.png`, fullPage: true });

      await page.getByRole("button", { name: "Enviar para revisión" }).click();
      await page.waitForURL((url) => /^\/guias\/[A-Za-z0-9]+$/.test(url.pathname) && !url.pathname.endsWith("/nueva"), { timeout: 20000 });
      const externalId = page.url().split("/").pop();
      createdIds.push(externalId);
      const externalDoc = (await db.doc(`guides/${externalId}`).get()).data();
      check("Firestore: externa, pendiente, con la vista previa ya resuelta", externalDoc.type === "external" && externalDoc.status === "pending"
        && externalDoc.externalUrl === EXTERNAL_URL && /firebase-tools/i.test(externalDoc.externalPreview?.title || ""));
      await close("guía externa (crear)", page);

      await db.doc(`guides/${externalId}`).update({ status: "approved", reviewedAt: admin.firestore.FieldValue.serverTimestamp() });
      page = await session(QA.bruno);
      await page.goto(`${BASE}/guias/${externalId}`);
      const open = page.locator("a.guide-detail__open");
      await open.waitFor({ timeout: 10000 });
      check("detalle: vista previa grande", await page.locator(".link-preview--large").count() === 1);
      check("detalle: el botón abre el link en otra pestaña sin opener",
        (await open.getAttribute("href")) === EXTERNAL_URL && (await open.getAttribute("target")) === "_blank" && (await open.getAttribute("rel")) === "noopener noreferrer");
      await page.screenshot({ path: `${SHOTS}/guia-externa-detalle.png`, fullPage: true });
      await close("guía externa (ver)", page);
    } else {
      console.log("\n(guía externa omitida: E2E_GUIDES_EXTERNAL=1 con el emulador de functions corriendo)");
    }
  } finally {
    await browser.close();
    // Las guías no se pueden borrar desde la app (reglas): se borran con Admin SDK
    for (const id of createdIds) await db.doc(`guides/${id}`).delete();
    console.log(`\n${createdIds.length} guías de prueba borradas`);
  }

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
