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
// Sin verificar (restablecer la contraseña con el enlace marca el correo como verificado)
const VER = { email: `qa.ver.${STAMP}@example.com`, username: `qa_ver_${STAMP}`, password: `Qa-${STAMP}v9` };

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
  for (const account of [TMP, VER]) {
    const user = await admin.auth().getUserByEmail(account.email).catch(() => null);
    if (!user) continue;
    // Lo que haya escrito en partidas de otros (si una corrida se cortó a medias)
    for (const interest of (await db.collection("post_interested").where("userId", "==", user.uid).get()).docs) {
      const { postId } = interest.data();
      await interest.ref.delete();
      await db.doc(`posts/${postId}`).update({ interestedCount: admin.firestore.FieldValue.increment(-1) }).catch(() => {});
      await db.doc(`group_chats/${postId}`).update({ participants: admin.firestore.FieldValue.arrayRemove(user.uid) }).catch(() => {});
    }
    for (const comment of (await db.collection("post_comments").where("userId", "==", user.uid).get()).docs) await comment.ref.delete();
    await Promise.all(["users", "publicProfiles", "matchProfiles"].map((c) => db.doc(`${c}/${user.uid}`).delete()));
    await admin.auth().deleteUser(user.uid);
  }
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

    // ---------- 6. Verificación de correo ----------
    console.log("\n=== verificación de correo");
    const KEY = fs.readFileSync(path.join(__dirname, "../../.env"), "utf8").match(/REACT_APP_FIREBASE_API_KEY=(.*)/)[1].trim().replace(/^["']|["']$/g, "");
    const idTokenOf = async (email, password) => (await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, returnSecureToken: true }) }
    ).then((res) => res.json())).idToken;
    // Escribir un comentario directo a Firestore (REST), sin pasar por la app
    const directComment = (idToken) => fetch(
      "https://firestore.googleapis.com/v1/projects/gamerteam-4ed20/databases/(default)/documents/post_comments",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ fields: {
          postId: { stringValue: "qa_post_ana" }, userId: { stringValue: verUser.uid },
          text: { stringValue: "comentario directo (QA)" }, createdAt: { timestampValue: new Date().toISOString() }
        } })
      }
    );
    // Registro desde la app: crea la cuenta y manda el correo de verificación
    page = await newPage();
    await page.goto(`${BASE}/login`);
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await page.locator("#email").fill(VER.email);
    await page.locator("#password").fill(VER.password);
    await page.locator("#username").fill(VER.username);
    await page.locator(".auth__select").click();
    const regionFilter = page.locator(".p-dropdown-filter");
    if (await regionFilter.count()) await regionFilter.fill("Méxi");
    await page.locator(".p-dropdown-item", { hasText: "México" }).first().click();
    await page.locator("button[type=submit]").click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
    const verUser = await admin.auth().getUserByEmail(VER.email);
    const banner = page.locator(".verify-banner");
    await banner.waitFor({ timeout: 15000 }).catch(() => {});
    check("usuario nuevo: ve el aviso con su correo", await banner.isVisible() && (await banner.innerText()).includes(VER.email));
    check("el correo de verificación salió (sin aviso de error)", !(await page.locator("body").innerText()).includes("No pudimos enviar"));
    await page.screenshot({ path: `${SHOTS}/verificacion-aviso.png` });
    const verifyDialog = page.locator(".verify-dialog");
    const expectDialog = async (name) => {
      const opened = await verifyDialog.waitFor({ timeout: 5000 }).then(() => true, () => false);
      check(`${name}: abre "Verifica tu correo para continuar"`, opened);
      if (opened) {
        await page.keyboard.press("Escape");
        await verifyDialog.waitFor({ state: "detached", timeout: 5000 }).catch(() => {});
      }
    };

    await page.goto(`${BASE}/`);
    await page.getByRole("button", { name: /Publicar/ }).first().click();
    await expectDialog("publicar");
    check("y no abre el formulario de publicar", await page.locator(".p-dialog", { hasText: "Publicar partida" }).count() === 0);

    await page.goto(`${BASE}/post/qa_post_ana`);
    await page.getByRole("button", { name: /Quiero jugar/i }).first().click();
    await expectDialog("Quiero jugar");
    await page.getByRole("textbox", { name: "Escribe un comentario" }).fill("Hola, ¿jugamos?");
    await page.locator(".comment-composer").getByRole("button", { name: "Comentar" }).click();
    await expectDialog("comentar");
    check("el comentario se queda escrito", (await page.getByRole("textbox", { name: "Escribe un comentario" }).inputValue()) === "Hola, ¿jugamos?");

    await page.goto(`${BASE}/guias`);
    await page.getByRole("button", { name: "Escribir guía" }).first().click();
    await expectDialog("escribir guía");

    const unverifiedToken = await idTokenOf(VER.email, VER.password);
    const denied = await directComment(unverifiedToken);
    check("saltándose la app, firestore.rules rechaza el comentario", denied.status === 403, `HTTP ${denied.status}`);

    // Reenviar: aviso y cuenta regresiva
    await banner.getByRole("button", { name: "Reenviar correo" }).click();
    const resent = await toastText(page);
    check("reenviar el correo avisa", /Correo enviado/.test(resent), resent.replace(/\s+/g, " "));
    const resendLabel = (await banner.locator("button").first().innerText()).trim();
    check("y bloquea el botón con cuenta regresiva", /Reenviar en \d+ s/i.test(resendLabel), resendLabel);

    // Verificar (como al abrir el enlace) y esperar la revisión automática
    await admin.auth().updateUser(verUser.uid, { emailVerified: true });
    const hidden = await banner.waitFor({ state: "detached", timeout: 25000 }).then(() => true, () => false);
    check("al verificar, el aviso desaparece solo (sin recargar)", hidden);
    const verifiedToast = await toastText(page);
    check("con aviso de correo verificado", /Correo verificado/.test(verifiedToast), verifiedToast.replace(/\s+/g, " "));
    await page.goto(`${BASE}/`);
    await page.getByRole("button", { name: /Publicar/ }).first().click();
    const formOpened = await page.locator(".p-dialog", { hasText: "Publicar partida" }).waitFor({ timeout: 10000 }).then(() => true, () => false);
    check("ya verificado, Publicar abre el formulario", formOpened && await verifyDialog.count() === 0);
    const allowed = await directComment(await idTokenOf(VER.email, VER.password));
    check("y firestore.rules ya acepta sus escrituras", allowed.status === 200, `HTTP ${allowed.status}`);
    if (allowed.ok) await db.doc(new URL((await allowed.json()).name, "https://x/").pathname.split("/documents/")[1]).delete().catch(() => {});
    await close("verificación", page);

    // Cuentas verificadas (qa_ana) no ven el aviso
    page = await newPage();
    await login(page, QA.ana);
    check("cuenta verificada: sin aviso", await page.locator(".verify-banner").count() === 0);
    await close("cuenta verificada", page);
  } finally {
    await browser.close();
    await removeTmp();
    console.log(`\nCuentas temporales ${TMP.username} y ${VER.username} borradas`);
  }

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
})().catch(async (error) => {
  console.error(error);
  await removeTmp().catch(() => {});
  process.exit(1);
});
