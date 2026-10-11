// Moderación desde /admin/reports (Cloud Function moderate): borrar una
// partida y un comentario reportados, suspender una cuenta (y reactivarla con
// npm run admin:unsuspend) y eliminar otra. También el motivo "Parece menor
// de edad" al reportar.
// Necesita el emulador de functions con moderate (la app local lo usa).
// Cuentas temporales qa_mod_*; qa_diego es admin solo durante la prueba.
// Todo lo creado se borra al terminar.
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
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
const T1 = { email: `qa.mod.a.${STAMP}@example.com`, username: `qa_mod_a_${STAMP}`, password: `Qa-${STAMP}m9` };
const T2 = { email: `qa.mod.b.${STAMP}@example.com`, username: `qa_mod_b_${STAMP}`, password: `Qa-${STAMP}n9` };
const POST_DEL = `qa_mod_post_del_${STAMP}`;
const POST_KEEP = `qa_mod_post_keep_${STAMP}`;
const COMMENT = `qa_mod_comment_${STAMP}`;
const NOTE = `QA moderación ${STAMP}`;

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const until = async (fn, tries = 15) => {
  for (let i = 0; i < tries; i += 1) {
    if (await fn()) return true;
    await wait(1000);
  }
  return false;
};

let browser;
const errors = [];
const session = async (user) => {
  const page = await (await browser.newContext({ locale: "es-MX", viewport: { width: 1366, height: 900 } })).newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${BASE}/login`);
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page.locator("button[type=submit]").click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
  await page.waitForTimeout(2000);
  return page;
};
const toastText = async (page, timeout = 30000) => {
  const toast = page.locator(".p-toast-message").last();
  await toast.waitFor({ timeout });
  return (await toast.innerText()).replace(/\s+/g, " ");
};
// Espera el aviso que dice expected (los anteriores pueden seguir en pantalla)
const toastWith = async (page, expected, timeout = 60000) => {
  const toast = page.locator(".p-toast-message", { hasText: expected }).last();
  const ok = await toast.waitFor({ timeout }).then(() => true, () => false);
  return ok ? (await toast.innerText()).replace(/\s+/g, " ") : `(sin aviso "${expected}"; último: ${await toastText(page, 1000).catch(() => "ninguno")})`;
};

const createAccount = async (acc) => {
  const user = await admin.auth().createUser({ email: acc.email, password: acc.password, displayName: acc.username, emailVerified: true });
  acc.uid = user.uid;
  const profile = { username: acc.username, usernameLower: acc.username, avatar: null, region: "México", description: "", games: [], links: [], createdAt: new Date() };
  await db.doc(`users/${acc.uid}`).set(profile);
  await db.doc(`publicProfiles/${acc.uid}`).set(profile);
  await db.doc(`usernames/${acc.username}`).set({ createdAt: new Date() });
  await db.doc(`users/${acc.uid}/private/preferences`).set({ onboarding: { completed: true, showAgain: false, completedVersion: 1 }, ageConfirmation: { minAge: 18, confirmedAt: new Date() } });
};
// minutesAgo: la partida a reportar es la más nueva (primera en el feed)
const createPost = async (id, uid, label, minutesAgo = 0) => {
  const now = new Date(Date.now() - minutesAgo * 60000);
  await db.doc(`posts/${id}`).set({
    userId: uid, game: "Hades", platform: "pc", platforms: ["PC"], multiplatform: false, playersNeeded: 3,
    comments: `Partida de prueba de moderación ${label} ${STAMP}`, image: null, logo: null, clip: null, portada: null,
    scheduledAt: null, requiresMic: false, skillLevel: "casual", language: "es", authorRegion: "México",
    interestedCount: 0, createdAt: now
  });
  await db.doc(`group_chats/${id}`).set({ postId: id, participants: [uid], active: true, lastMessage: "", lastMessageAt: null, lastSenderId: null, createdAt: now });
};
const seedReport = (targetType, targetId, reason, label) => db.collection("reports").add({
  reporterId: QA.carla.uid, targetType, targetId, reason, note: `${NOTE} ${label}`, status: "pending", createdAt: new Date(), reviewedAt: null
});

const cleanup = async () => {
  for (const acc of [T1, T2]) {
    const user = acc.uid ? await admin.auth().getUser(acc.uid).catch(() => null) : null;
    if (acc.uid) {
      await db.recursiveDelete(db.doc(`users/${acc.uid}`));
      await db.doc(`publicProfiles/${acc.uid}`).delete();
      await db.doc(`usernames/${acc.username}`).delete();
    }
    if (user) await admin.auth().deleteUser(user.uid);
  }
  for (const id of [POST_DEL, POST_KEEP]) {
    await db.recursiveDelete(db.doc(`group_chats/${id}`));
    await db.doc(`posts/${id}`).delete();
  }
  await db.doc(`post_comments/${COMMENT}`).delete();
  for (const field of ["reporterId"]) {
    const reports = await db.collection("reports").where(field, "in", [QA.carla.uid, QA.ana.uid]).get();
    for (const d of reports.docs) if (String(d.get("note")).includes(NOTE) || [T1.uid, T2.uid, POST_DEL, POST_KEEP, COMMENT].includes(d.get("targetId"))) await d.ref.delete();
  }
  for (const id of [T1.uid, T2.uid, POST_DEL, POST_KEEP, COMMENT].filter(Boolean)) {
    for (const d of (await db.collection("moderation_log").where("targetId", "==", id).get()).docs) await d.ref.delete();
  }
  // Partidas de Hades: el -1 de la partida borrada se compensa (no se sumó al crearla)
  const stats = db.doc(`game_stats/${encodeURIComponent("Hades")}`);
  if (moderatedPost && (await stats.get()).exists) await stats.update({ postCount: admin.firestore.FieldValue.increment(1) });
  const { admin: _removed, ...rest } = (await admin.auth().getUser(QA.diego.uid)).customClaims || {};
  await admin.auth().setCustomUserClaims(QA.diego.uid, Object.keys(rest).length ? rest : null);
};
let moderatedPost = false;

(async () => {
  browser = await chromium.launch({ channel: process.env.E2E_BROWSER || "msedge", headless: true });
  try {
    await createAccount(T1);
    await createAccount(T2);
    await createPost(POST_DEL, T1.uid, "reportada");
    await createPost(POST_KEEP, T1.uid, "con comentario", 60);
    await db.doc(`post_comments/${COMMENT}`).set({ postId: POST_KEEP, userId: T1.uid, text: `Comentario reportado ${STAMP}`, createdAt: new Date() });

    // ---------- 1. Motivo "Parece menor de edad" ----------
    console.log("\n=== reportar: parece menor de edad");
    let page = await session(QA.ana);
    await page.goto(`${BASE}/`);
    const card = page.locator(".post-card", { hasText: T1.username }).first();
    await card.waitFor({ timeout: 15000 });
    await card.getByRole("button", { name: "Reportar publicación" }).click();
    const option = page.getByText("Parece menor de edad", { exact: true });
    check("el motivo aparece al reportar", await option.isVisible().catch(() => false));
    await option.click();
    await page.locator("#report-note").fill(`${NOTE} menor`);
    await page.getByRole("button", { name: "Enviar reporte" }).click();
    check("se envía", /Reporte enviado/.test(await toastText(page, 10000)));
    check("queda con reason underage", await until(async () =>
      (await db.collection("reports").where("reporterId", "==", QA.ana.uid).where("targetId", "==", POST_DEL).get()).docs.some((d) => d.get("reason") === "underage")));
    await page.context().close();

    await seedReport("comment", COMMENT, "harassment", "comentario");
    await seedReport("user", T1.uid, "harassment", "suspender");
    await seedReport("user", T2.uid, "underage", "eliminar");

    // ---------- 2. Panel de admin ----------
    const previous = (await admin.auth().getUser(QA.diego.uid)).customClaims || {};
    await admin.auth().setCustomUserClaims(QA.diego.uid, { ...previous, admin: true });
    page = await session(QA.diego);
    await page.goto(`${BASE}/admin/reports`);
    const item = (label) => page.locator(".admin-report", { hasText: `${NOTE} ${label}` });
    await item("menor").waitFor({ timeout: 15000 });
    check("partida reportada: solo \"Borrar partida\"", await item("menor").getByRole("button", { name: "Borrar partida" }).count() === 1
      && await item("menor").getByRole("button", { name: "Suspender cuenta" }).count() === 0);
    check("cuenta reportada: \"Suspender cuenta\" y \"Eliminar cuenta\"", await item("suspender").getByRole("button", { name: "Suspender cuenta" }).count() === 1
      && await item("suspender").getByRole("button", { name: "Eliminar cuenta" }).count() === 1);
    await page.screenshot({ path: `${SHOTS}/admin-moderacion.png`, fullPage: true });

    // Pulsa la acción, confirma y espera el aviso del resultado
    const act = async (label, button, expected) => {
      await item(label).getByRole("button", { name: button }).click();
      const dialog = page.locator(".gm-confirm");
      await dialog.waitFor({ timeout: 5000 });
      await dialog.getByRole("button", { name: button }).click();
      return toastWith(page, expected);
    };

    console.log("\n=== borrar partida");
    let toast = await act("menor", "Borrar partida", "Partida borrada");
    moderatedPost = true;
    check("aviso \"Partida borrada\"", /Partida borrada/.test(toast) && !/Ya no existía/.test(toast), toast);
    check("la partida y su chat de grupo ya no existen", await until(async () => !(await db.doc(`posts/${POST_DEL}`).get()).exists && !(await db.doc(`group_chats/${POST_DEL}`).get()).exists));
    check("el reporte sale de la lista", await until(async () => await item("menor").count() === 0));
    const log = (await db.collection("moderation_log").where("targetId", "==", POST_DEL).get()).docs[0]?.data();
    check("queda en moderation_log (admin, acción, autor)", log?.adminId === QA.diego.uid && log?.action === "deletePost" && log?.authorId === T1.uid, JSON.stringify(log));

    console.log("\n=== borrar comentario");
    toast = await act("comentario", "Borrar comentario", "Comentario borrado");
    check("aviso \"Comentario borrado\"", /Comentario borrado/.test(toast) && !/Ya no existía/.test(toast), toast);
    check("el comentario ya no existe y la partida sigue", await until(async () => !(await db.doc(`post_comments/${COMMENT}`).get()).exists) && (await db.doc(`posts/${POST_KEEP}`).get()).exists);

    console.log("\n=== suspender cuenta");
    toast = await act("suspender", "Suspender cuenta", "Cuenta suspendida");
    check("aviso \"Cuenta suspendida\"", /Cuenta suspendida/.test(toast), toast);
    check("la cuenta queda desactivada en Auth", (await admin.auth().getUser(T1.uid)).disabled === true);
    check("su contenido sigue (solo se suspende)", (await db.doc(`posts/${POST_KEEP}`).get()).exists);

    console.log("\n=== eliminar cuenta");
    toast = await act("eliminar", "Eliminar cuenta", "Cuenta eliminada");
    check("aviso \"Cuenta eliminada\"", /Cuenta eliminada/.test(toast), toast);
    check("la cuenta y su perfil ya no existen", !(await admin.auth().getUser(T2.uid).catch(() => null)) && !(await db.doc(`publicProfiles/${T2.uid}`).get()).exists);
    const closed = (await db.collection("reports").where("targetId", "==", T2.uid).get()).docs.map((d) => d.data());
    check("su reporte se conserva, revisado con la acción", closed.length === 1 && closed[0].status === "reviewed" && closed[0].resolution === "deleteUser");
    await page.context().close();

    // ---------- 3. La cuenta suspendida no entra; se reactiva con el script ----------
    console.log("\n=== cuenta suspendida");
    page = await (await browser.newContext({ locale: "es-MX" })).newPage();
    await page.goto(`${BASE}/login`);
    await page.locator("#email").fill(T1.email);
    await page.locator("#password").fill(T1.password);
    await page.locator("button[type=submit]").click();
    toast = await toastText(page, 15000);
    check("no puede iniciar sesión (aviso de cuenta desactivada)", /deshabilitad|desactivad|suspendid/i.test(toast) && page.url().includes("/login"), toast);
    await page.context().close();

    const script = spawnSync(process.execPath, [path.join(__dirname, "../../functions/scripts/unsuspendUser.js"), T1.email], { encoding: "utf8" });
    check("npm run admin:unsuspend la reactiva", script.status === 0 && (await admin.auth().getUser(T1.uid)).disabled === false, (script.stdout + script.stderr).trim());
    page = await session(T1);
    check("y vuelve a entrar", !page.url().includes("/login"));
    await page.context().close();

    check("sin errores de JS", errors.length === 0, errors.join(" | ").slice(0, 200));
  } finally {
    await browser.close();
    await cleanup().catch((error) => console.error("Limpieza:", error.message));
  }

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
})().catch(async (error) => {
  console.error(error);
  await cleanup().catch(() => {});
  process.exit(1);
});
