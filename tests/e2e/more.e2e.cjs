// Segunda tanda de pruebas de interfaz en Edge: chat de grupo, reportes y
// panel de admin, partidas programadas y "Más filtros", y vista en celular.
const fs = require("fs");
const { chromium } = require("playwright-core");
const r = require("module").createRequire(require("path").join(__dirname, "../../functions/index.js"));
const admin = r("firebase-admin");

admin.initializeApp({ projectId: "gamerteam-4ed20" });
const db = admin.firestore();

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const QA = JSON.parse(fs.readFileSync(`${__dirname}/.qa-users.json`, "utf8"));
const SHOTS = `${__dirname}/screenshots`;
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};
const only = process.argv.slice(2);

let browser;
const session = async (user, { mobile = false } = {}) => {
  const context = await browser.newContext(mobile
    ? { locale: "es-MX", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { locale: "es-MX", viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  await page.goto(`${BASE}/login`);
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page.locator("button[type=submit]").click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
  await page.waitForTimeout(2500);
  return page;
};
const done = async (name, page) => {
  check(`${name}: sin errores de JS (${page.qaUser})`, page.errors.length === 0, page.errors.join(" | ").slice(0, 200));
  await page.context().close();
};
const scenario = async (name, fn) => {
  if (only.length && !only.includes(name)) return;
  console.log(`\n=== ${name}`);
  try {
    await fn();
  } catch (error) {
    check(`${name}: terminó sin excepción`, false, error.message.split("\n")[0]);
  }
};
const toastText = async (page, timeout = 10000) => {
  const toast = page.locator(".p-toast-message").last();
  await toast.waitFor({ timeout });
  return (await toast.innerText()).replace(/\s+/g, " ");
};
const body = (page) => page.locator("body").innerText();

(async () => {
  browser = await chromium.launch({ channel: process.env.E2E_BROWSER || "msedge", headless: true });

  // ---------------- Chat de grupo ----------------
  await scenario("grupo", async () => {
    // Carla se une a la partida de Ana desde el detalle
    let page = await session(QA.carla);
    await page.goto(`${BASE}/post/qa_post_ana`);
    // qa_carla tiene portugués guardado en su cuenta: la app le habla en portugués
    await page.getByRole("button", { name: "Quero jogar" }).click();
    await page.getByRole("button", { name: "Não tenho mais interesse" }).waitFor({ timeout: 10000 });
    const [interest, post, group] = await Promise.all([
      db.doc(`post_interested/qa_post_ana_${QA.carla.uid}`).get(),
      db.doc("posts/qa_post_ana").get(),
      db.doc("group_chats/qa_post_ana").get()
    ]);
    check("grupo: Quiero jugar crea el interés con id fijo", interest.exists);
    check("grupo: interestedCount 1 -> 2", post.data().interestedCount === 2, `${post.data().interestedCount}`);
    check("grupo: carla entra al chat del grupo", group.data().participants.includes(QA.carla.uid));

    await page.getByRole("button", { name: "Chat do grupo" }).click();
    await page.waitForURL(/\/chat/);
    const composer = page.getByPlaceholder("Escreva uma mensagem…");
    await composer.waitFor({ timeout: 10000 });
    await composer.fill("Hola grupo, soy carla (QA)");
    await page.getByRole("button", { name: "Enviar mensagem" }).click();
    await page.locator(".chat-messages").getByText("Hola grupo, soy carla (QA)").waitFor({ timeout: 10000 });
    check("grupo: carla escribe en el chat del grupo", true);
    await page.screenshot({ path: `${SHOTS}/grupo-carla.png` });
    await done("grupo", page);

    // Ana lo ve en "Chats de partida", con el nombre de quien escribió
    page = await session(QA.ana);
    await page.goto(`${BASE}/chat`);
    await page.getByRole("tab", { name: /Chats de partida/ }).click();
    await page.locator(".chat-item", { hasText: "Valorant" }).first().click();
    await page.locator(".chat-messages").getByText("Hola grupo, soy carla (QA)").waitFor({ timeout: 10000 });
    // El nombre llega con el perfil, que puede cargar un momento después del mensaje
    const senderShown = await page.locator(".chat-group__sender", { hasText: "qa_carla" }).first()
      .waitFor({ timeout: 10000 }).then(() => true, () => false);
    check("grupo: ana ve el mensaje y que lo escribió qa_carla", senderShown);
    await page.screenshot({ path: `${SHOTS}/grupo-ana.png` });
    await done("grupo", page);

    // Diego no participa: su pestaña de partidas está vacía
    page = await session(QA.diego);
    await page.goto(`${BASE}/chat`);
    await page.getByRole("tab", { name: /Chats de partida/ }).click();
    await page.waitForTimeout(2000);
    check("grupo: quien no participa no ve el grupo", /Aún no tienes chats de partida/i.test(await body(page)));
    await done("grupo", page);

    // Carla se sale: deja de contar y sale del grupo
    page = await session(QA.carla);
    await page.goto(`${BASE}/post/qa_post_ana`);
    await page.getByRole("button", { name: "Não tenho mais interesse" }).click();
    await page.getByRole("button", { name: "Quero jogar" }).waitFor({ timeout: 10000 });
    const [post2, group2, interest2] = await Promise.all([
      db.doc("posts/qa_post_ana").get(), db.doc("group_chats/qa_post_ana").get(), db.doc(`post_interested/qa_post_ana_${QA.carla.uid}`).get()
    ]);
    check("grupo: Ya no me interesa baja el contador a 1 y borra el interés", post2.data().interestedCount === 1 && !interest2.exists);
    check("grupo: carla sale del chat del grupo", !group2.data().participants.includes(QA.carla.uid));
    await page.goto(`${BASE}/chat`);
    await page.getByRole("tab", { name: /Chats de partida/ }).click();
    await page.waitForTimeout(2000);
    check("grupo: el grupo ya no aparece en sus chats de partida (en pt la pestaña también se llama así)", !(await page.locator(".chat-item", { hasText: "Valorant" }).count()));
    await done("grupo", page);
  });

  // ---------------- Reportes y panel de admin ----------------
  await scenario("reportes", async () => {
    let page = await session(QA.carla);
    // En el detalle no hay botón para reportar la partida: se reporta desde su tarjeta
    await page.goto(`${BASE}/`);
    await page.locator(".post-card", { hasText: "qa_bruno" }).first().getByRole("button", { name: "Denunciar publicação" }).click();
    await page.getByText("Spam", { exact: true }).click();
    await page.locator("#report-note").fill("Reporte de prueba QA");
    await page.getByRole("button", { name: "Enviar denúncia" }).click();
    const toast = await toastText(page);
    check("reportes: se envía con aviso (en portugués)", /Denúncia enviada/.test(toast), toast);
    const reports = await db.collection("reports").where("reporterId", "==", QA.carla.uid).where("status", "==", "pending").get();
    const report = reports.docs.find((d) => d.data().targetId === "qa_post_bruno");
    check("reportes: el reporte quedó pendiente en Firestore", Boolean(report) && report.data().reason === "spam");
    await done("reportes", page);

    page = await session(QA.ana);
    await page.goto(`${BASE}/admin/reports`);
    await page.waitForTimeout(3000);
    check("reportes: sin permiso de admin, /admin/reports da 404", /nivel no encontrado/i.test(await body(page)));
    await done("reportes", page);

    // Admin temporal para qa_diego; se quita siempre al terminar
    const previous = (await admin.auth().getUser(QA.diego.uid)).customClaims || {};
    await admin.auth().setCustomUserClaims(QA.diego.uid, { ...previous, admin: true });
    try {
      page = await session(QA.diego);
      await page.goto(`${BASE}/admin/reports`);
      const item = page.locator(".admin-report", { hasText: "Reporte de prueba QA" });
      await item.waitFor({ timeout: 15000 });
      // El nombre de quien reporta se resuelve en vivo desde publicProfiles
      await item.getByText("qa_carla").waitFor({ timeout: 10000 }).catch(() => {});
      const itemText = await item.innerText();
      check("reportes: el admin ve el reporte con motivo, nota y quién lo hizo", /Spam/i.test(itemText) && /qa_carla/.test(itemText));
      await page.screenshot({ path: `${SHOTS}/admin-reportes.png` });
      await item.getByRole("button", { name: "Marcar como revisado" }).click();
      await page.waitForTimeout(3000);
      check("reportes: al marcarlo revisado desaparece de la lista", await page.locator(".admin-report", { hasText: "Reporte de prueba QA" }).count() === 0);
      check("reportes: queda como reviewed en Firestore", report && (await report.ref.get()).data().status === "reviewed");
      await done("reportes", page);
    } finally {
      const { admin: _removed, ...rest } = (await admin.auth().getUser(QA.diego.uid)).customClaims || {};
      await admin.auth().setCustomUserClaims(QA.diego.uid, Object.keys(rest).length ? rest : null);
      const after = (await admin.auth().getUser(QA.diego.uid)).customClaims;
      check("reportes: se quitó el admin temporal a qa_diego", !after?.admin, JSON.stringify(after));
    }
  });

  // ---------------- Programadas y Más filtros ----------------
  await scenario("programadas", async () => {
    const page = await session(QA.ana);
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(3000);
    const upcoming = page.locator("section", { hasText: /Próximamente/i }).first();
    check("programadas: la partida de carla está en Próximamente", /Tomb Raider/.test(await upcoming.innerText()));

    await page.goto(`${BASE}/post/qa_post_carla`);
    await page.waitForTimeout(3000);
    check("programadas: el detalle muestra cuándo es", /Programad/i.test(await body(page)));
    await page.screenshot({ path: `${SHOTS}/programada-detalle.png` });

    // Programar sin elegir fecha: el formulario lo pide
    await page.goto(`${BASE}/`);
    await page.getByRole("button", { name: /Publicar/ }).first().click();
    await page.getByPlaceholder("Busca el juego…").fill("Valorant");
    await page.locator(".p-autocomplete-item").first().waitFor({ timeout: 15000 });
    await page.locator(".p-autocomplete-item").first().click();
    await page.getByRole("radio", { name: "PC", exact: true }).click();
    await page.getByPlaceholder(/Modo de juego/).fill("No se debería publicar (QA)");
    await page.getByText("Programar para después").click();
    await page.getByRole("button", { name: "Publicar partida" }).last().click();
    await page.waitForTimeout(1500);
    const dialogText = await page.locator(".p-dialog").innerText();
    check("programadas: sin fecha no publica y pide la fecha", /Elige la fecha y hora/i.test(dialogText));
    const leaked = await db.collection("posts").where("comments", "==", "No se debería publicar (QA)").get();
    check("programadas: no se creó ningún post", leaked.empty);
    await page.screenshot({ path: `${SHOTS}/programada-sin-fecha.png` });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(800);

    // Más filtros: las partidas QA requieren micrófono
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(3000);
    const anaCard = () => page.locator(".post-card", { hasText: "qa_ana" });
    check("filtros: sin filtros se ve la partida de qa_ana", await anaCard().count() > 0);
    await page.getByRole("button", { name: /^Más filtros/ }).click();
    await page.getByRole("button", { name: "Sin micrófono" }).click();
    await page.waitForTimeout(1500);
    check("filtros: 'Sin micrófono' oculta las partidas que lo requieren", await anaCard().count() === 0);
    await page.getByRole("button", { name: "Con micrófono" }).click();
    await page.waitForTimeout(1500);
    check("filtros: 'Con micrófono' las vuelve a mostrar", await anaCard().count() > 0);
    check("filtros: el botón marca que hay filtros activos", await page.getByRole("button", { name: /hay filtros activos/ }).count() > 0);
    await page.screenshot({ path: `${SHOTS}/filtros.png` });
    await done("programadas", page);
  });

  // ---------------- Vista en celular ----------------
  await scenario("movil", async () => {
    const page = await session(QA.ana, { mobile: true });
    const pages = [["inicio", "/"], ["detalle", "/post/qa_post_ana"], ["chat", "/chat"], ["perfil", "/profile"], ["amigos", "/friends"], ["notificaciones", "/notifications"], ["explorar", "/explorar?categoria=recent"]];
    for (const [name, path] of pages) {
      await page.goto(`${BASE}${path}`);
      await page.waitForTimeout(3000);
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
      check(`móvil: ${name} sin scroll horizontal`, scrollWidth <= innerWidth + 1, `${scrollWidth}px de ancho en ${innerWidth}px`);
      await page.screenshot({ path: `${SHOTS}/movil-${name}.png` });
    }
    // Abrir un chat en celular y volver a la lista
    await page.goto(`${BASE}/chat`);
    await page.locator(".chat-item", { hasText: "qa_bruno" }).click();
    await page.locator(".chat-messages").getByText("Mensaje QA 60").waitFor({ timeout: 10000 });
    await page.screenshot({ path: `${SHOTS}/movil-chat-abierto.png` });
    const back = page.getByRole("button", { name: "Volver a los chats" });
    check("móvil: el chat abierto tiene botón para volver", await back.count() > 0);
    if (await back.count()) {
      await back.click();
      await page.waitForTimeout(1000);
      check("móvil: al volver se ve la lista de chats", await page.locator(".chat-item", { hasText: "qa_bruno" }).isVisible());
    }
    await done("movil", page);
  });

  await browser.close();
  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
