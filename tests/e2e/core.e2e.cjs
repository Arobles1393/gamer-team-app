// Pruebas de interfaz en Edge con las cuentas qa_* contra localhost:3000
// (Firebase de producción). Cada escenario usa su propio contexto (sesión).
const fs = require("fs");
const { chromium } = require("playwright-core");
const r = require("module").createRequire(require("path").join(__dirname, "../../functions/index.js"));
const admin = r("firebase-admin");

admin.initializeApp({ projectId: "gamerteam-4ed20" });
const db = admin.firestore();

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const QA = JSON.parse(fs.readFileSync(`${__dirname}/.qa-users.json`, "utf8"));
const API_KEY = fs.readFileSync(require("path").join(__dirname, "../../.env"), "utf8")
  .match(/REACT_APP_FIREBASE_API_KEY=(.*)/)[1].trim().replace(/^["']|["']$/g, "");
const SHOTS = `${__dirname}/screenshots`;
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};
const only = process.argv.slice(2);

let browser;
const scenario = async (name, fn, locale = "es-MX") => {
  if (only.length && !only.includes(name)) return;
  console.log(`\n=== ${name}`);
  const context = await browser.newContext({ locale, viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await fn(page);
  } catch (error) {
    check(`${name}: terminó sin excepción`, false, error.message.split("\n")[0]);
    await page.screenshot({ path: `${SHOTS}/${name}-error.png` }).catch(() => {});
  }
  check(`${name}: sin errores de JS en la página`, errors.length === 0, errors.join(" | ").slice(0, 200));
  await context.close();
};

const login = async (page, user) => {
  await page.goto(`${BASE}/login`);
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page.locator("button[type=submit]").click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
  await page.waitForTimeout(2500);
};

const toastText = async (page, timeout = 8000) => {
  const toast = page.locator(".p-toast-message").last();
  await toast.waitFor({ timeout });
  return (await toast.innerText()).replace(/\s+/g, " ");
};

const body = (page) => page.locator("body").innerText();

(async () => {
  browser = await chromium.launch({ channel: process.env.E2E_BROWSER || "msedge", headless: true });

  // 1) Registro desde el formulario (5.ª cuenta)
  await scenario("registro", async (page) => {
    const exists = await admin.auth().getUserByEmail("qa.eva@example.com").then(() => true, () => false);
    if (exists) {
      check("registro: qa_eva ya existía (se omite)", true);
      return;
    }
    const password = `Qa-${Math.random().toString(36).slice(2, 10)}9`;
    await page.goto(`${BASE}/login`);
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await page.locator("#email").fill("qa.eva@example.com");
    await page.locator("#password").fill(password);
    await page.locator("#username").fill("qa_eva");
    await page.locator(".auth__select").click();
    const filter = page.locator(".p-dropdown-filter");
    if (await filter.count()) await filter.fill("Méxi");
    await page.locator(".p-dropdown-item", { hasText: "México" }).first().click();
    await page.locator("button[type=submit]").click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
    check("registro: entra a la app al crear la cuenta", true);
    const user = await admin.auth().getUserByEmail("qa.eva@example.com");
    const [priv, pub] = await Promise.all([db.doc(`users/${user.uid}`).get(), db.doc(`publicProfiles/${user.uid}`).get()]);
    check("registro: users sin correo ni teléfono (el correo vive en Auth)", priv.exists && !("email" in priv.data()) && !("phone" in priv.data()) && user.email === "qa.eva@example.com");
    check("registro: publicProfiles sin correo ni teléfono, con región", pub.exists && !("email" in pub.data()) && !("phone" in pub.data()) && pub.data().region === "México", JSON.stringify(Object.keys(pub.data() || {})));
    // Como el resto de cuentas qa_: verificada (las reglas lo piden para publicar)
    await admin.auth().updateUser(user.uid, { emailVerified: true });
    QA.eva = { uid: user.uid, email: "qa.eva@example.com", password, username: "qa_eva" };
    fs.writeFileSync(`${__dirname}/.qa-users.json`, JSON.stringify(QA, null, 2));
    await page.screenshot({ path: `${SHOTS}/registro.png` });
  });

  // 2) Publicar una partida desde la UI (createdAt del servidor, game_stats en el batch)
  await scenario("publicar", async (page) => {
    await login(page, QA.eva);
    const before = (await db.doc(`game_stats/${encodeURIComponent("Valorant")}`).get()).data()?.postCount ?? 0;
    await page.getByRole("button", { name: /Publicar/ }).first().click();
    const gameInput = page.getByPlaceholder("Busca el juego…");
    await gameInput.fill("Valorant");
    await page.locator(".p-autocomplete-item").first().waitFor({ timeout: 15000 });
    await page.locator(".p-autocomplete-item").first().click();
    await page.waitForTimeout(1500);
    await page.getByRole("radio", { name: "PC", exact: true }).click();
    await page.getByPlaceholder(/Modo de juego/).fill("Partida QA creada desde la interfaz");
    await page.screenshot({ path: `${SHOTS}/publicar-form.png` });
    await page.getByRole("button", { name: "Publicar partida" }).last().click();
    const toast = await toastText(page, 30000);
    check("publicar: aviso de partida publicada", /Partida publicada/.test(toast), toast);
    await page.waitForTimeout(2000);
    const posts = await db.collection("posts").where("userId", "==", QA.eva.uid).get();
    // El más reciente (cada corrida publica uno nuevo)
    const post = posts.docs
      .filter((d) => d.data().comments === "Partida QA creada desde la interfaz")
      .sort((x, y) => (y.data().createdAt?.toMillis() ?? 0) - (x.data().createdAt?.toMillis() ?? 0))[0];
    check("publicar: el post existe con createdAt del servidor", Boolean(post) && typeof post.data().createdAt?.toMillis === "function" && Math.abs(Date.now() - post.data().createdAt.toMillis()) < 120000);
    const group = post && await db.doc(`group_chats/${post.id}`).get();
    check("publicar: su chat de grupo existe", Boolean(group?.exists));
    const stats = (await db.doc(`game_stats/${encodeURIComponent(post?.data().game || "Valorant")}`).get()).data();
    check("publicar: game_stats +1 con lastPostId", stats?.lastPostId === post?.id, `postCount ${before} -> ${stats?.postCount}`);
    QA.evaPostId = post?.id;
    fs.writeFileSync(`${__dirname}/.qa-users.json`, JSON.stringify(QA, null, 2));
  });

  // 3) Ana acepta la solicitud de Carla (amistad con consentimiento) y revisa notificaciones
  await scenario("amistad", async (page) => {
    await login(page, QA.ana);
    await page.goto(`${BASE}/notifications`);
    await page.waitForTimeout(3000);
    const text = await body(page);
    check("amistad: ve la solicitud de qa_carla", /qa_carla\s+quiere agregarte como amigo/.test(text));
    check("amistad: ve el Me interesa y el comentario de qa_bruno", /qa_bruno\s+está interesado en tu partida/.test(text) && /qa_bruno\s+comentó en tu publicación/.test(text));
    await page.screenshot({ path: `${SHOTS}/notificaciones-ana.png` });
    const carlaRequest = page.locator(".notif", { hasText: "quiere agregarte como amigo" }).filter({ hasText: "qa_carla" });
    await carlaRequest.getByRole("button", { name: "Aceptar" }).click();
    await page.waitForTimeout(3000);
    check("amistad: la solicitud queda Aceptada", /Aceptada/i.test(await page.locator(".notif", { hasText: "qa_carla" }).filter({ hasText: /Aceptada/i }).first().innerText().catch(() => "")));
    const pair = [QA.ana.uid, QA.carla.uid].sort().join("_");
    const [friend, request] = await Promise.all([db.doc(`friends/${pair}`).get(), db.doc(`friend_requests/${QA.carla.uid}_${QA.ana.uid}`).get()]);
    check("amistad: friends con id ordenado y solicitud accepted", friend.exists && request.data()?.status === "accepted");
    await page.goto(`${BASE}/friends`);
    await page.waitForTimeout(3000);
    const friends = await body(page);
    check("amistad: Mis amigos muestra a qa_bruno y qa_carla", /qa_bruno/.test(friends) && /qa_carla/.test(friends));
    await page.screenshot({ path: `${SHOTS}/amigos-ana.png` });
  });

  // 4) Chat: últimos 50, Ver mensajes anteriores, enviar y adjunto no permitido
  await scenario("chat", async (page) => {
    await login(page, QA.ana);
    await page.goto(`${BASE}/chat`);
    await page.waitForTimeout(2500);
    await page.locator(".chat-item", { hasText: "qa_bruno" }).click();
    const list = page.locator(".chat-messages");
    await list.getByText("Mensaje QA 60", { exact: true }).waitFor({ timeout: 10000 });
    await page.getByRole("button", { name: "Ver mensajes anteriores" }).waitFor({ timeout: 10000 });
    let text = await page.locator(".chat-messages").innerText();
    check("chat: se ven los últimos 50 (11..60)", /Mensaje QA 11\b/.test(text) && !/Mensaje QA 10\b/.test(text));
    const older = page.getByRole("button", { name: "Ver mensajes anteriores" });
    check("chat: aparece Ver mensajes anteriores", await older.count() === 1);
    await older.click();
    await list.getByText("Mensaje QA 1", { exact: true }).waitFor({ timeout: 10000 });
    text = await page.locator(".chat-messages").innerText();
    check("chat: al cargar anteriores llegan los 60", /Mensaje QA 1\b/.test(text) && /Mensaje QA 60/.test(text));
    check("chat: ya no hay más anteriores (botón oculto)", await older.count() === 0);
    await page.screenshot({ path: `${SHOTS}/chat-anteriores.png` });

    await page.getByPlaceholder("Escribe un mensaje…").fill("Hola desde la prueba QA");
    await page.getByRole("button", { name: "Enviar mensaje" }).click();
    await list.getByText("Hola desde la prueba QA").waitFor({ timeout: 10000 });
    check("chat: el mensaje enviado aparece", true);

    await page.locator("input[type=file]").setInputFiles({ name: "virus.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") });
    const toast = await toastText(page);
    check("chat: un .exe se rechaza con aviso claro", /no se puede enviar/.test(toast), toast);
    await page.screenshot({ path: `${SHOTS}/chat-exe.png` });
  });

  // 5) Idioma de la cuenta: qa_bruno tiene inglés guardado
  await scenario("idioma", async (page) => {
    await login(page, QA.bruno);
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(3000);
    const text = await body(page);
    check("idioma: la cuenta en inglés ve la app en inglés", /available parties/i.test(text) && !/partidas disponibles/i.test(text), text.slice(0, 80).replace(/\n/g, " / "));
    await page.goto(`${BASE}/post/qa_post_ana`);
    await page.waitForTimeout(3000);
    const post = await body(page);
    check("idioma: el detalle del post en inglés con su comentario", /Comments/i.test(post) && /Me apunto/.test(post));
    await page.screenshot({ path: `${SHOTS}/bruno-en.png` });
  }, "es-MX");

  // 6) Bloqueo desde la UI: qa_diego bloquea a qa_eva
  await scenario("bloqueo", async (page) => {
    await login(page, QA.diego);
    await page.goto(`${BASE}/findPlayers`);
    await page.getByPlaceholder("Nombre de usuario…").fill("qa_");
    await page.waitForTimeout(3000);
    const results = await body(page);
    check("bloqueo: la búsqueda (publicProfiles) encuentra a las cuentas qa_", /qa_ana/.test(results) && /qa_eva/.test(results));
    check("bloqueo: los resultados no muestran correos", !/@example\.com/.test(results));
    await page.locator(".player-card", { hasText: "qa_eva" }).getByRole("button", { name: /Ver perfil/ }).click();
    await page.waitForTimeout(2500);
    await page.getByRole("button", { name: "Más opciones" }).click();
    await page.getByText("Bloquear a qa_eva").click();
    await page.locator(".p-confirm-dialog").getByRole("button", { name: "Bloquear" }).click();
    await page.waitForTimeout(3000);
    const block = await db.doc(`blocks/${QA.diego.uid}_${QA.eva.uid}`).get();
    check("bloqueo: se creó blocks/{diego}_{eva}", block.exists);

    await page.goto(`${BASE}/post/${QA.evaPostId}`);
    await page.waitForTimeout(3500);
    const blocked = await body(page);
    check("bloqueo: el post de qa_eva por link dice no disponible", /Esta partida no está disponible/i.test(blocked));
    await page.screenshot({ path: `${SHOTS}/post-bloqueado.png` });

    await page.goto(`${BASE}/findPlayers`);
    await page.getByPlaceholder("Nombre de usuario…").fill("qa_");
    await page.waitForTimeout(3000);
    check("bloqueo: qa_eva ya no sale en la búsqueda", !/qa_eva/.test(await body(page)));
  });

  // 7) Estados vacíos (qa_diego no tiene amigos ni notificaciones)
  await scenario("vacios", async (page) => {
    await login(page, QA.diego);
    await page.goto(`${BASE}/friends`);
    await page.waitForTimeout(3000);
    check("vacíos: Amigos muestra 'Aún no tienes amigos'", /Aún no tienes amigos/i.test(await body(page)));
    await page.screenshot({ path: `${SHOTS}/vacio-amigos.png` });
    await page.goto(`${BASE}/notifications`);
    await page.waitForTimeout(3000);
    check("vacíos: Notificaciones muestra 'Estás al día'", /Estás al día/i.test(await body(page)));
    await page.goto(`${BASE}/chat`);
    await page.waitForTimeout(3000);
    check("vacíos: Chats muestra 'Aún no tienes chats'", /Aún no tienes chats/i.test(await body(page)));
    await page.screenshot({ path: `${SHOTS}/vacio-chats.png` });
  });

  // 8) Privacidad contra producción con el token real de qa_ana (sin la UI)
  await scenario("privacidad", async () => {
    const sign = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: QA.ana.email, password: QA.ana.password, returnSecureToken: true })
    }).then((res) => res.json());
    const get = (path) => fetch(`https://firestore.googleapis.com/v1/projects/gamerteam-4ed20/databases/(default)/documents/${path}`,
      { headers: { Authorization: `Bearer ${sign.idToken}` } });
    const other = await get(`users/${QA.bruno.uid}`);
    check("privacidad: qa_ana NO puede leer el users de qa_bruno", other.status === 403, `HTTP ${other.status}`);
    const own = await get(`users/${QA.ana.uid}`);
    check("privacidad: qa_ana sí lee su propio users", own.status === 200, `HTTP ${own.status}`);
    const pub = await get(`publicProfiles/${QA.bruno.uid}`);
    const fields = Object.keys((await pub.json()).fields || {});
    check("privacidad: el perfil público de qa_bruno no trae correo ni teléfono", pub.status === 200 && !fields.includes("email") && !fields.includes("phone"), fields.join(","));
  });

  await browser.close();
  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
