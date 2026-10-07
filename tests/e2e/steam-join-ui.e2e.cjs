// "Unirme en Steam" (2): el botón en la interfaz. La respuesta de
// getJoinInfo se simula en el navegador (la autorización real se prueba en
// tests/functions/steam-join.emulator.cjs y la llamada a Steam, a mano).
// qa_ana y qa_bruno son amigos; qa_bruno marcó "Quiero jugar" en qa_post_ana.
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const QA = JSON.parse(fs.readFileSync(`${__dirname}/.qa-users.json`, "utf8"));
const SHOTS = `${__dirname}/screenshots`;
fs.mkdirSync(SHOTS, { recursive: true });
const HOST = "76561197960287930";
const VALID = { available: true, gameName: "Counter-Strike 2", joinUrl: `steam://joinlobby/730/109775241047382912/${HOST}` };

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};

let browser;
// mock: función (data) => resultado; calls: peticiones recibidas
const session = async (acc, mock, { touch = false, clock = false } = {}) => {
  const context = await browser.newContext({
    locale: "es-MX",
    viewport: touch ? { width: 390, height: 844 } : { width: 1366, height: 900 },
    hasTouch: touch,
    isMobile: touch
  });
  const page = await context.newPage();
  page.calls = [];
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  await page.route("**/getJoinInfo", async (route) => {
    const data = JSON.parse(route.request().postData() || "{}").data;
    page.calls.push(data);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: mock(data) }) });
  });
  await page.goto(`${BASE}/login`);
  await page.locator("#email").fill(acc.email);
  await page.locator("#password").fill(acc.password);
  await page.locator("button[type=submit]").click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
  await page.waitForTimeout(1500);
  if (clock) await page.clock.install();
  return page;
};
const openChatWith = async (page, username) => {
  await page.goto(`${BASE}/chat`);
  await page.locator(".chat-item", { hasText: username }).first().click();
  await page.locator(".chat-window").waitFor({ timeout: 15000 });
};
const done = async (name, page) => {
  check(`${name}: sin errores de JS`, page.errors.length === 0, page.errors.join(" | ").slice(0, 200));
  await page.context().close();
};

(async () => {
  browser = await chromium.launch({ channel: process.env.E2E_BROWSER || "msedge", headless: true });
  try {
    // ---------- 1. Chat 1:1 con un amigo ----------
    console.log("\n=== chat 1:1 (amigos)");
    let page = await session(QA.ana, () => VALID);
    await openChatWith(page, "qa_bruno");
    const btn = page.locator(".chat-window .steam-join__btn");
    await btn.waitFor({ timeout: 10000 });
    check("consulta con el uid del amigo y sin postId", page.calls.some((c) => c.targetUid === QA.bruno.uid && !c.postId));
    check("muestra Unirme en Steam con el juego", /Unirme en Steam/.test(await btn.innerText()) && /Jugando Counter-Strike 2/.test(await btn.innerText()));
    check("es un enlace steam://joinlobby con rel noopener noreferrer",
      (await btn.getAttribute("href")) === VALID.joinUrl && (await btn.getAttribute("rel")) === "noopener noreferrer");
    check("con el texto de ayuda", /Se abrirá Steam en tu computadora/.test(await page.locator(".chat-window .steam-join__help").innerText()));
    await btn.focus();
    check("accesible con el teclado (recibe foco)", await btn.evaluate((el) => document.activeElement === el));
    await page.locator(".chat-window").screenshot({ path: `${SHOTS}/steam-join-chat.png` });
    await done("chat 1:1", page);

    // ---------- 2. Defensa en profundidad: enlace raro -> sin botón ----------
    console.log("\n=== enlaces no válidos");
    for (const [name, joinUrl] of [
      ["steam://connect", "steam://connect/1.2.3.4:27015"],
      ["javascript:", "javascript:alert(1)"],
      ["steamid de 16 dígitos", "steam://joinlobby/730/123/7656119796028793"]
    ]) {
      page = await session(QA.ana, () => ({ available: true, gameName: "x", joinUrl }));
      await openChatWith(page, "qa_bruno");
      await page.waitForTimeout(2500);
      check(`${name}: no se muestra`, await page.locator(".steam-join__btn").count() === 0 && page.calls.length > 0);
      await done(`enlace ${name}`, page);
    }

    // ---------- 3. Táctil: no se muestra ----------
    console.log("\n=== táctil");
    page = await session(QA.ana, () => VALID, { touch: true });
    await openChatWith(page, "qa_bruno");
    await page.waitForTimeout(2500);
    check("en un dispositivo táctil no se muestra", await page.locator(".steam-join__btn").count() === 0);
    await done("táctil", page);

    // ---------- 4. Partida: autor e interesado ----------
    console.log("\n=== partida");
    page = await session(QA.bruno, () => VALID);
    await page.goto(`${BASE}/post/qa_post_ana`);
    const postBtn = page.locator(".post-info .steam-join__btn");
    await postBtn.waitFor({ timeout: 10000 });
    check("interesado: botón en la partida, con postId y el autor", page.calls.some((c) => c.targetUid === QA.ana.uid && c.postId === "qa_post_ana"));
    await page.goto(`${BASE}/chat`);
    // qa_bruno usa la app en inglés
    await page.getByRole("tab", { name: /partida|party/i }).click();
    await page.locator(".chat-item", { hasText: /Valorant/i }).first().click();
    const groupBtn = page.locator(".chat-window--group .steam-join__btn");
    check("y en el chat de esa partida", await groupBtn.waitFor({ timeout: 10000 }).then(() => true, () => false));
    await done("partida (interesado)", page);

    page = await session(QA.ana, () => VALID);
    await page.goto(`${BASE}/post/qa_post_ana`);
    await page.locator(".post-info").waitFor({ timeout: 10000 });
    await page.waitForTimeout(2500);
    check("el autor no ve el botón en su propia partida ni consulta", await page.locator(".steam-join__btn").count() === 0
      && !page.calls.some((c) => c.postId === "qa_post_ana"));
    await done("partida (autor)", page);

    // ---------- 5. Perfil: solo con amistad ----------
    console.log("\n=== perfil");
    page = await session(QA.carla, () => VALID);
    await page.goto(`${BASE}/post/qa_post_ana`);
    await page.locator(".post-info").waitFor({ timeout: 10000 });
    await page.locator(".post-info__host, .post-info button", { hasText: "qa_ana" }).first().click();
    await page.locator(".p-dialog").waitFor({ timeout: 10000 });
    await page.waitForTimeout(2500);
    check("sin amistad (carla) ni interés: ni botón ni consultas", await page.locator(".steam-join__btn").count() === 0 && page.calls.length === 0, `${page.calls.length} consultas`);
    await done("perfil sin amistad", page);

    page = await session(QA.ana, () => VALID);
    await page.goto(`${BASE}/friends`);
    await page.locator(".player-card", { hasText: "qa_bruno" }).getByRole("button", { name: /Ver perfil/ }).click();
    const profileBtn = page.locator(".p-dialog .steam-join__btn");
    check("perfil de un amigo: botón Unirme en Steam", await profileBtn.waitFor({ timeout: 10000 }).then(() => true, () => false)
      && page.calls.some((c) => c.targetUid === QA.bruno.uid));
    await page.locator(".p-dialog").screenshot({ path: `${SHOTS}/steam-join-perfil.png` });
    await done("perfil de un amigo", page);

    // ---------- 6. Ritmo de consultas: 45 s, pausa con la pestaña oculta, 120 s tras 3 sin sala ----------
    console.log("\n=== ritmo de consultas");
    page = await session(QA.ana, () => ({ available: false }), { clock: true });
    await openChatWith(page, "qa_bruno");
    await page.waitForTimeout(1500);
    const count = () => page.calls.length;
    const start = count();
    check("consulta al abrir", start >= 1, `${start}`);
    await page.clock.runFor(46000);
    await page.waitForTimeout(500);
    check("vuelve a consultar a los 45 s", count() === start + 1, `${count() - start}`);
    await page.clock.runFor(46000);
    await page.waitForTimeout(500);
    const afterThree = count();
    check("tercera respuesta sin sala", afterThree === start + 2);
    await page.clock.runFor(46000);
    await page.waitForTimeout(500);
    check("tras 3 sin sala ya no consulta a los 45 s", count() === afterThree, `${count() - afterThree}`);
    await page.clock.runFor(80000);
    await page.waitForTimeout(500);
    check("sino a los 120 s", count() === afterThree + 1, `${count() - afterThree}`);
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    const hiddenAt = count();
    await page.clock.runFor(300000);
    await page.waitForTimeout(500);
    check("con la pestaña oculta no consulta", count() === hiddenAt, `${count() - hiddenAt}`);
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(800);
    check("al volver a la pestaña consulta de inmediato", count() === hiddenAt + 1, `${count() - hiddenAt}`);
    await page.context().close();
  } finally {
    await browser.close();
  }

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
