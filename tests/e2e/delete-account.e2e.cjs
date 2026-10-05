// Eliminar cuenta (Cloud Function deleteAccount en el emulador de
// functions). Crea cuentas TEMPORALES qa_del_* con datos cruzados, elimina
// una desde la interfaz y confirma que no queda rastro suyo y que la otra
// sigue funcionando. Tarda ~6 min: espera a que una sesión tenga más de
// 5 minutos para comprobar que el servidor exige reautenticación.
// Uso: E2E_DELETE_ACCOUNT=1 npm run test:e2e (o node directo)
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");
const r = require("module").createRequire(path.join(__dirname, "../../functions/index.js"));
const admin = r("firebase-admin");

admin.initializeApp({ projectId: "gamerteam-4ed20" });
const db = admin.firestore();
const { FieldValue, Timestamp } = admin.firestore;

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const FUNCTIONS = process.env.E2E_FUNCTIONS_URL || "http://127.0.0.1:5001/gamerteam-4ed20/us-central1";
const QA = JSON.parse(fs.readFileSync(`${__dirname}/.qa-users.json`, "utf8"));
const KEY = fs.readFileSync(path.join(__dirname, "../../.env"), "utf8").match(/REACT_APP_FIREBASE_API_KEY=(.*)/)[1].trim().replace(/^["']|["']$/g, "");
const SHOTS = `${__dirname}/screenshots`;
fs.mkdirSync(SHOTS, { recursive: true });

const STAMP = Date.now().toString(36);
const account = (tag) => ({ tag, email: `qa.del.${tag}.${STAMP}@example.com`, username: `qa_del_${tag}_${STAMP}`, password: `Qa-${STAMP}-${tag}9` });
const A = account("a"); // se elimina desde la interfaz
const B = account("b"); // se queda: comparte datos con A
const C = account("c"); // se elimina por la API pasando el uid de B
const D = account("d"); // sesión de más de 5 minutos
const ALL = [A, B, C, D];
const GAME = `QA Borrar ${STAMP}`;

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};

const signIn = async (acc) => (await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${KEY}`,
  { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: acc.email, password: acc.password, returnSecureToken: true }) }
).then((res) => res.json())).idToken;
const callDelete = (idToken, data = {}) => fetch(`${FUNCTIONS}/deleteAccount`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
  body: JSON.stringify({ data })
}).then(async (res) => ({ status: res.status, body: await res.json().catch(() => ({})) }));

const createAccount = async (acc) => {
  const user = await admin.auth().createUser({ email: acc.email, password: acc.password, displayName: acc.username, emailVerified: true });
  acc.uid = user.uid;
  const profile = { username: acc.username, usernameLower: acc.username.toLowerCase(), avatar: null, region: "México", description: "", games: [], links: [], createdAt: new Date() };
  await db.doc(`users/${acc.uid}`).set(profile);
  await db.doc(`publicProfiles/${acc.uid}`).set(profile);
};

// Todo lo que puede quedar ligado a un uid
const traces = async (uid, postIds = [], chatIds = []) => {
  const q = (col, field, op = "==") => db.collection(col).where(field, op, uid).get().then((s) => s.size);
  const found = {
    users: (await db.doc(`users/${uid}`).get()).exists ? 1 : 0,
    publicProfiles: (await db.doc(`publicProfiles/${uid}`).get()).exists ? 1 : 0,
    matchProfiles: (await db.doc(`matchProfiles/${uid}`).get()).exists ? 1 : 0,
    posts: await q("posts", "userId"),
    post_comments: await q("post_comments", "userId"),
    post_interested: await q("post_interested", "userId"),
    friends: await q("friends", "users", "array-contains"),
    friend_requests: (await q("friend_requests", "senderId")) + (await q("friend_requests", "receiverId")),
    blocks: await q("blocks", "participants", "array-contains"),
    chats: await q("chats", "participants", "array-contains"),
    group_participant: await q("group_chats", "participants", "array-contains"),
    messages: (await db.collectionGroup("messages").where("senderId", "==", uid).get()).size,
    notifications: (await q("notifications", "userId")) + (await q("notifications", "senderId")),
    guides: await q("guides", "authorId"),
    group_chats_of_posts: (await Promise.all(postIds.map((id) => db.doc(`group_chats/${id}`).get()))).filter((d) => d.exists).length,
    chats_by_id: (await Promise.all(chatIds.map((id) => db.doc(`chats/${id}`).get()))).filter((d) => d.exists).length,
    notifications_about: (await Promise.all([...postIds, ...chatIds].map((id) => db.collection("notifications").where("relatedId", "==", id).get()))).reduce((n, s) => n + s.size, 0)
  };
  const left = Object.entries(found).filter(([, n]) => n > 0);
  return left.length ? JSON.stringify(Object.fromEntries(left)) : "";
};

const cleanup = async () => {
  for (const acc of ALL) {
    const user = await admin.auth().getUserByEmail(acc.email).catch(() => null);
    const uid = user?.uid ?? acc.uid;
    if (!uid) continue;
    const refs = [];
    for (const [col, field, op] of [["posts", "userId", "=="], ["post_comments", "userId", "=="], ["post_interested", "userId", "=="], ["friends", "users", "array-contains"],
      ["friend_requests", "senderId", "=="], ["friend_requests", "receiverId", "=="], ["blocks", "participants", "array-contains"], ["notifications", "userId", "=="],
      ["notifications", "senderId", "=="], ["guides", "authorId", "=="], ["reports", "reporterId", "=="], ["reports", "targetId", "=="]]) {
      (await db.collection(col).where(field, op, uid).get()).forEach((d) => refs.push(d.ref));
    }
    for (const chat of (await db.collection("chats").where("participants", "array-contains", uid).get()).docs) await db.recursiveDelete(chat.ref);
    for (const ref of refs) {
      if (ref.parent.id === "posts") await db.recursiveDelete(db.doc(`group_chats/${ref.id}`));
      await ref.delete();
    }
    for (const col of ["users", "publicProfiles", "matchProfiles"]) await db.doc(`${col}/${uid}`).delete();
    if (user) await admin.auth().deleteUser(uid);
  }
  await db.doc(`game_stats/${encodeURIComponent(GAME)}`).delete();
};

let browser;
(async () => {
  try {
    for (const acc of ALL) await createAccount(acc);
    // Sesión de D ahora: se usa cuando tenga más de 5 minutos
    const oldToken = await signIn(D);
    const oldSince = Date.now();

    // ---------- Datos cruzados entre A y B ----------
    const now = Timestamp.now();
    const postA = `qa_del_post_a_${STAMP}`;
    const postB = `qa_del_post_b_${STAMP}`;
    const chatAB = [A.uid, B.uid].sort().join("_");
    const batch = db.batch();
    for (const [id, owner, other] of [[postA, A, B], [postB, B, A]]) {
      batch.set(db.doc(`posts/${id}`), { userId: owner.uid, game: GAME, platform: "pc", comments: "QA", playersNeeded: 2, interestedCount: 1, scheduledAt: null, authorRegion: "México", createdAt: now });
      batch.set(db.doc(`group_chats/${id}`), { postId: id, participants: [owner.uid, other.uid], active: true, lastMessage: "", lastMessageAt: null, lastSenderId: null, createdAt: now });
      batch.set(db.doc(`post_interested/${id}_${other.uid}`), { postId: id, userId: other.uid, createdAt: now });
      batch.set(db.doc(`group_chats/${id}/messages/m_${other.tag}`), { senderId: other.uid, text: "hola grupo", createdAt: now });
      batch.set(db.collection("post_comments").doc(), { postId: id, userId: other.uid, text: "comentario cruzado", mediaUrl: "", mediaType: "", mediaPath: "", createdAt: now });
    }
    batch.set(db.doc(`game_stats/${encodeURIComponent(GAME)}`), { game: GAME, postCount: 2, updatedAt: now, lastPostId: postB });
    batch.set(db.doc(`friends/${chatAB}`), { users: [A.uid, B.uid].sort(), createdAt: now });
    batch.set(db.doc(`friend_requests/${A.uid}_${B.uid}`), { senderId: A.uid, receiverId: B.uid, status: "accepted", createdAt: now });
    batch.set(db.doc(`chats/${chatAB}`), { participants: [A.uid, B.uid].sort(), lastMessage: "hola", lastSenderId: A.uid, lastMessageAt: now, createdAt: now });
    batch.set(db.doc(`chats/${chatAB}/messages/m1`), { senderId: A.uid, text: "hola", createdAt: now });
    batch.set(db.doc(`chats/${chatAB}/messages/m2`), { senderId: B.uid, text: "qué tal", createdAt: now });
    batch.set(db.doc(`blocks/${A.uid}_${QA.diego.uid}`), { participants: [A.uid, QA.diego.uid], blockerId: A.uid, blockedId: QA.diego.uid, createdAt: now });
    batch.set(db.collection("notifications").doc(), { userId: B.uid, senderId: A.uid, type: "message", read: false, relatedId: chatAB, createdAt: now });
    batch.set(db.collection("notifications").doc(), { userId: A.uid, senderId: B.uid, type: "interested", read: false, relatedId: postA, createdAt: now });
    // Aviso de un tercero a B sobre la partida de A (decisión 2: también se borra)
    batch.set(db.collection("notifications").doc(), { userId: B.uid, senderId: QA.ana.uid, type: "group_message", read: false, relatedId: postA, createdAt: now });
    batch.set(db.doc(`matchProfiles/${A.uid}`), { preferences: { schedule: ["evening"], platforms: ["pc"], requiresMic: null, groupSize: null, skillLevel: null, languages: [], values: [] }, gameIds: ["1"], region: "México", updatedAt: now });
    batch.set(db.doc(`guides/qa_del_guide_${STAMP}`), { authorId: A.uid, game: GAME, title: "Guía QA", type: "original", status: "pending", content: "<p>x</p>", coverImage: null, youtubeVideoId: null, externalUrl: null, externalPreview: null, reviewNote: null, reviewedAt: null, createdAt: now });
    const reportByA = db.collection("reports").doc();
    const reportOnA = db.collection("reports").doc();
    batch.set(reportByA, { reporterId: A.uid, targetType: "user", targetId: B.uid, reason: "spam", note: "", status: "pending", createdAt: now, reviewedAt: null });
    batch.set(reportOnA, { reporterId: B.uid, targetType: "user", targetId: A.uid, reason: "spam", note: "", status: "pending", createdAt: now, reviewedAt: null });
    await batch.commit();
    check("datos cruzados creados", (await traces(A.uid, [postA], [chatAB])) !== "");

    // ---------- 1. A elimina su cuenta desde Mi perfil ----------
    console.log("\n=== eliminar desde la interfaz");
    browser = await chromium.launch({ channel: process.env.E2E_BROWSER || "msedge", headless: true });
    let context = await browser.newContext({ locale: "es-MX", viewport: { width: 1366, height: 900 } });
    let page = await context.newPage();
    let errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const login = async (acc) => {
      await page.goto(`${BASE}/login`);
      await page.locator("#email").fill(acc.email);
      await page.locator("#password").fill(acc.password);
      await page.locator("button[type=submit]").click();
      await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
      await page.waitForTimeout(2000);
    };
    await login(A);
    await page.goto(`${BASE}/profile`);
    const zone = page.locator(".danger-zone");
    await zone.waitFor({ timeout: 15000 });
    check("Mi perfil termina con la Zona de peligro", (await page.locator(".gm-section").last().getAttribute("class")).includes("danger-zone"));
    await zone.getByRole("button", { name: "Eliminar mi cuenta" }).click();
    const dialog = page.locator(".delete-account");
    await dialog.waitFor({ timeout: 5000 });
    const dialogText = await dialog.innerText();
    check("el diálogo explica qué se borra y que es irreversible",
      /irreversible/i.test(dialogText) && /partidas/.test(dialogText) && /chats/.test(dialogText) && /archivos/.test(dialogText));
    const confirmButton = dialog.getByRole("button", { name: "Eliminar definitivamente" });
    check("el botón final empieza deshabilitado", await confirmButton.isDisabled());
    await dialog.locator("#delete-confirm").fill(A.username.toUpperCase());
    await dialog.locator("#delete-password input, input#delete-password").first().fill(A.password);
    check("con el nickname mal escrito sigue deshabilitado", await confirmButton.isDisabled());
    await dialog.locator("#delete-confirm").fill(A.username);
    check("con el nickname exacto y la contraseña se habilita", await confirmButton.isEnabled());
    await page.screenshot({ path: `${SHOTS}/eliminar-cuenta.png` });
    await confirmButton.click();
    const deleting = await dialog.getByRole("button", { name: "Eliminando…" }).waitFor({ timeout: 5000 }).then(() => true, () => false);
    check("mientras borra muestra Eliminando… y no se puede cerrar", deleting && await dialog.locator(".p-dialog-header-close").count() === 0);
    await page.waitForURL((url) => url.pathname === "/", { timeout: 120000 });
    const toast = await page.locator(".p-toast-message").last().innerText({ timeout: 15000 }).catch(() => "");
    check("termina en el inicio con el aviso Cuenta eliminada", /Cuenta eliminada/.test(toast), toast.replace(/\s+/g, " "));
    const loggedOut = await page.locator(".rail-btn--login").waitFor({ timeout: 10000 }).then(() => true, () => false);
    check("la sesión quedó cerrada", loggedOut);
    await page.waitForTimeout(3000);
    check("y se queda en el inicio (no la manda al login)", new URL(page.url()).pathname === "/", page.url());
    check("eliminar desde la interfaz: sin errores de JS", errors.length === 0, errors.join(" | ").slice(0, 200));
    await context.close();

    // ---------- 2. No queda rastro de A ----------
    console.log("\n=== rastro de A");
    check("Firebase Auth: la cuenta ya no existe", !(await admin.auth().getUser(A.uid).catch(() => null)));
    const left = await traces(A.uid, [postA], [chatAB]);
    check("Firestore: no queda nada de A ni ligado a A", left === "", left);
    check("se borraron su guía y sus preferencias", !(await db.doc(`guides/qa_del_guide_${STAMP}`).get()).exists && !(await db.doc(`matchProfiles/${A.uid}`).get()).exists);
    check("el comentario de B en la partida de A se fue con la partida",
      (await db.collection("post_comments").where("postId", "==", postA).get()).empty);
    check("los reportes se conservan (registro de moderación)", (await reportByA.get()).exists && (await reportOnA.get()).exists);
    const stats = (await db.doc(`game_stats/${encodeURIComponent(GAME)}`).get()).data();
    check("game_stats: -1 por la partida borrada", stats.postCount === 1, `postCount ${stats.postCount}`);

    // ---------- 3. B sigue bien ----------
    console.log("\n=== la otra cuenta (B)");
    const postBDoc = (await db.doc(`posts/${postB}`).get()).data();
    const groupB = (await db.doc(`group_chats/${postB}`).get()).data();
    check("la partida de B sigue, con interestedCount 1 -> 0", postBDoc?.interestedCount === 0, `${postBDoc?.interestedCount}`);
    check("A salió del chat de la partida de B y su mensaje se borró",
      !groupB.participants.includes(A.uid) && !(await db.doc(`group_chats/${postB}/messages/m_a`).get()).exists);
    check("el mensaje de B en el chat de partida de B... no existía; el de A en la de A se fue con ella", !(await db.doc(`group_chats/${postA}`).get()).exists);
    context = await browser.newContext({ locale: "es-MX", viewport: { width: 1366, height: 900 } });
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await login(B);
    await page.goto(`${BASE}/chat`);
    await page.waitForTimeout(3000);
    check("B ya no tiene el chat 1:1 con A", !(await page.locator("body").innerText()).includes(A.username));
    await page.goto(`${BASE}/post/${postB}`);
    await page.waitForTimeout(3000);
    check("la partida de B abre bien", (await page.locator("body").innerText()).includes(GAME));
    await page.goto(`${BASE}/notifications`);
    await page.waitForTimeout(3000);
    check("B no ve avisos de A ni de la partida borrada", !(await page.locator("body").innerText()).includes(A.username));
    check("B: sin errores de JS", errors.length === 0, errors.join(" | ").slice(0, 200));
    await context.close();

    // ---------- 4. El uid de request.data se ignora ----------
    console.log("\n=== uid de otro en la petición");
    const byApi = await callDelete(await signIn(C), { uid: B.uid });
    check("la función responde success", byApi.status === 200 && byApi.body?.result?.success === true, JSON.stringify(byApi.body).slice(0, 120));
    check("borró a quien llamó (C)", !(await admin.auth().getUser(C.uid).catch(() => null)));
    check("y no a B, cuyo uid iba en la petición", Boolean(await admin.auth().getUser(B.uid).catch(() => null)) && (await db.doc(`users/${B.uid}`).get()).exists);

    // ---------- 5. Sesión de más de 5 minutos ----------
    console.log("\n=== sesión antigua");
    const wait = 5 * 60 * 1000 + 15000 - (Date.now() - oldSince);
    if (wait > 0) {
      console.log(`  (esperando ${Math.round(wait / 1000)} s a que la sesión de D tenga más de 5 minutos)`);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    const old = await callDelete(oldToken);
    check("con una sesión de más de 5 min exige reautenticación",
      old.status === 401 && old.body?.error?.status === "UNAUTHENTICATED" && /requires-recent-login/.test(old.body?.error?.message), JSON.stringify(old.body).slice(0, 160));
    check("y la cuenta de D sigue intacta", Boolean(await admin.auth().getUser(D.uid).catch(() => null)) && (await db.doc(`users/${D.uid}`).get()).exists);
    const fresh = await callDelete(await signIn(D));
    check("al volver a iniciar sesión sí se elimina", fresh.status === 200 && !(await admin.auth().getUser(D.uid).catch(() => null)));
  } finally {
    if (browser) await browser.close();
    await cleanup().catch((e) => console.error("limpieza:", e.message));
    console.log("\nCuentas temporales qa_del_* y sus datos borrados");
  }

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
})().catch(async (error) => {
  console.error(error);
  await cleanup().catch(() => {});
  process.exit(1);
});
