// Compatibilidad entre jugadores: preferencias desde Mi perfil, pestaña
// "Compatibles contigo" en Buscar jugadores, estado needsSetup y que
// amigos y bloqueados nunca aparezcan. Al terminar deja las cuentas qa_
// como estaban (sin preferencias, Carla con sus juegos y sin el bloqueo).
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");
const r = require("module").createRequire(path.join(__dirname, "../../functions/index.js"));
const admin = r("firebase-admin");

admin.initializeApp({ projectId: "gamerteam-4ed20" });
const db = admin.firestore();
const { FieldValue } = admin.firestore;

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const QA = JSON.parse(fs.readFileSync(`${__dirname}/.qa-users.json`, "utf8"));
const SHOTS = `${__dirname}/screenshots`;
fs.mkdirSync(SHOTS, { recursive: true });

// Textos en el idioma de cada cuenta (Carla usa la app en portugués)
const LOCALES = path.join(__dirname, "../../src/locales");
const text = (lang, namespace, key) =>
  key.split(".").reduce((node, part) => node[part], JSON.parse(fs.readFileSync(`${LOCALES}/${lang}/${namespace}.json`, "utf8")));

const VALORANT = { id: 766, name: "Valorant", image: "https://media.rawg.io/media/games/b11/b11127b9ee3c3701bd15b9af3286d20e.jpg" };
const QA_UIDS = ["ana", "bruno", "carla", "diego", "eva"].map((key) => QA[key]?.uid).filter(Boolean);
const BLOCK_ID = `${QA.diego.uid}_${QA.ana.uid}`;

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};

let browser;
const session = async (user) => {
  const context = await browser.newContext({ locale: "es-MX", viewport: { width: 1366, height: 900 } });
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
const close = async (name, page) => {
  check(`${name}: sin errores de JS`, page.errors.length === 0, page.errors.join(" | ").slice(0, 200));
  await page.context().close();
};

// Marca las preferencias en la sección de Mi perfil (ya en modo edición)
const fillPreferences = async (page, lang, { schedule, platforms, mic, group, level, language, values }) => {
  const section = page.locator("#preferencias");
  const t = (key) => text(lang, "matching", key);
  const pick = (role, name) => section.getByRole(role, { name, exact: true }).click();

  for (const value of schedule) await pick("checkbox", t(`time.${value}`));
  for (const label of platforms) await pick("checkbox", label);
  await pick("radio", t(`mic.${mic}`));
  await pick("radio", t(`group.${group}`));
  await pick("radio", t(`level.${level}`));
  if (language) {
    await section.locator(".match-prefs__languages").click();
    await page.locator(".p-multiselect-filter").fill(language.slice(0, 4));
    await page.locator(".p-multiselect-panel li[role=option]", { hasText: language }).first().click();
    await page.keyboard.press("Escape");
  }
  for (const value of values) await pick("checkbox", t(`values.${value}`));
};

const save = async (page, lang) => {
  await page.getByRole("button", { name: text(lang, "profile", "saveBar.save") }).click();
  await page.locator(".profile-savebar").waitFor({ state: "detached", timeout: 15000 });
};

const openCompatible = async (page) => {
  await page.goto(`${BASE}/findPlayers?tab=compatible`);
  await page.locator(".players-grid .match-card, .feed-empty").first().waitFor({ timeout: 20000 });
  await page.waitForTimeout(1500);
};

const cardOf = (page, username) => page.locator(".match-card", { hasText: username });

(async () => {
  const carlaRef = db.doc(`users/${QA.carla.uid}`);
  const carlaPublicRef = db.doc(`publicProfiles/${QA.carla.uid}`);
  const carlaGames = (await carlaRef.get()).data().games;
  browser = await chromium.launch({ channel: process.env.E2E_BROWSER || "msedge", headless: true });

  try {
    // ---------- Estado inicial ----------
    // Nadie con preferencias; Carla además juega Valorant (como Ana).
    // Bruno es amigo de Ana y Diego la bloquea: los dos tienen preferencias
    // idénticas a las de Ana, así que sin el filtro saldrían al 100%.
    await Promise.all(QA_UIDS.map((uid) => db.doc(`matchProfiles/${uid}`).delete()));
    const withValorant = [VALORANT, ...carlaGames.filter((game) => game.id !== VALORANT.id)];
    await carlaRef.update({ games: withValorant });
    await carlaPublicRef.update({ games: withValorant });

    const anaLike = {
      schedule: ["evening"], platforms: ["pc"], requiresMic: true, groupSize: "squad",
      skillLevel: "competitive", languages: ["es"], values: ["no_rage"]
    };
    const now = FieldValue.serverTimestamp();
    await db.doc(`matchProfiles/${QA.bruno.uid}`).set({ preferences: anaLike, gameIds: ["47137"], region: "México", updatedAt: now });
    await db.doc(`matchProfiles/${QA.diego.uid}`).set({ preferences: anaLike, gameIds: ["766"], region: "México", updatedAt: now });
    await db.doc(`blocks/${BLOCK_ID}`).set({ participants: [QA.diego.uid, QA.ana.uid], blockerId: QA.diego.uid, blockedId: QA.ana.uid, createdAt: now });

    // ---------- 1. Sin preferencias: needsSetup, no una lista vacía ----------
    console.log("\n=== sin preferencias (qa_eva)");
    let page = await session(QA.eva);
    await openCompatible(page);
    const setupTitle = text("es", "matching", "setup.title");
    check("muestra la invitación a configurar, no 'sin resultados'",
      await page.getByText(setupTitle).count() === 1 && await page.locator(".match-card").count() === 0
      && await page.getByText(text("es", "matching", "empty.title")).count() === 0);
    await page.screenshot({ path: `${SHOTS}/compatibles-sin-preferencias.png`, fullPage: true });
    await page.getByRole("button", { name: text("es", "matching", "setup.action") }).click();
    await page.waitForURL(/\/profile$/, { timeout: 10000 });
    const section = page.locator("#preferencias");
    await section.getByRole("checkbox").first().waitFor({ timeout: 10000 });
    check("el botón abre Mi perfil en modo edición con las preferencias", await section.getByRole("checkbox").count() > 0
      && await page.locator(".profile-savebar").count() === 1);
    const inView = await section.evaluate((el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; });
    check("y baja hasta la sección", inView);
    await close("sin preferencias", page);

    // ---------- 2. Ana configura sus preferencias desde Mi perfil ----------
    console.log("\n=== Ana guarda sus preferencias");
    page = await session(QA.ana);
    await page.goto(`${BASE}/findPlayers?tab=compatible`);
    await page.getByRole("button", { name: text("es", "matching", "setup.action") }).click();
    await page.locator("#preferencias").getByRole("checkbox").first().waitFor({ timeout: 10000 });
    await fillPreferences(page, "es", {
      schedule: ["evening"], platforms: ["PC"], mic: "yes", group: "squad", level: "competitive",
      language: "Español", values: ["no_rage"]
    });
    await page.locator("#preferencias").screenshot({ path: `${SHOTS}/preferencias-edicion.png` });
    await save(page, "es");
    const anaDoc = (await db.doc(`matchProfiles/${QA.ana.uid}`).get()).data();
    check("Firestore: matchProfiles de Ana con lo que marcó y sus juegos",
      JSON.stringify(anaDoc?.preferences) === JSON.stringify(anaLike)
      && JSON.stringify(anaDoc.gameIds) === JSON.stringify(["766", "47137"]) && anaDoc.region === "México",
      JSON.stringify(anaDoc));
    const summary = await page.locator("#preferencias").innerText();
    check("fuera de edición se ve el resumen de lo elegido", /Noche/.test(summary) && /Squad/.test(summary) && /Sin rage/.test(summary));
    await close("Ana guarda", page);

    // ---------- 3. Carla (en portugués) configura las suyas ----------
    console.log("\n=== Carla guarda sus preferencias");
    page = await session(QA.carla);
    await page.goto(`${BASE}/findPlayers?tab=compatible`);
    await page.getByRole("button", { name: text("pt", "matching", "setup.action") }).click();
    await page.locator("#preferencias").getByRole("checkbox").first().waitFor({ timeout: 10000 });
    await fillPreferences(page, "pt", {
      schedule: ["evening"], platforms: ["PC", "PlayStation"], mic: "yes", group: "squad", level: "competitive",
      values: ["no_rage"]
    });
    await save(page, "pt");
    const carlaDoc = (await db.doc(`matchProfiles/${QA.carla.uid}`).get()).data();
    check("Firestore: matchProfiles de Carla sin idiomas (sin preferencia)",
      carlaDoc?.preferences.languages.length === 0 && carlaDoc.gameIds.includes("766"));

    // Juegos 12.5 (1 en común de 2) + horario 15 + plataforma 15 + nivel 10
    // + grupo 10 + idioma neutral 5 + micrófono 5 + región 0 + valores 5 = 77.5
    const EXPECTED = 78;

    // ---------- 4. Carla ve a Ana (y a Diego, que con ella no tiene bloqueo) ----------
    await openCompatible(page);
    const anaCard = cardOf(page, "qa_ana");
    await anaCard.waitFor({ timeout: 15000 });
    const anaCardText = await anaCard.innerText();
    check(`Carla ve a Ana con ${EXPECTED}% (en verde)`, anaCardText.includes(`${EXPECTED}%`)
      && await anaCard.locator(".match-card__score--high").count() === 1, anaCardText.replace(/\s+/g, " "));
    check("señales de Carla: Valorant, Noite, PC, Competitivo",
      ["Valorant", "Noite", "PC", "Competitivo"].every((label) => anaCardText.includes(label)));
    check("Carla también ve a Diego (el bloqueo es solo con Ana)", await cardOf(page, "qa_diego").count() === 1);
    check("Carla no ve a Bruno (no comparten juegos)", await cardOf(page, "qa_bruno").count() === 0);
    await close("Carla", page);

    // ---------- 5. Ana ve a Carla; nunca a su amigo ni a quien la bloqueó ----------
    console.log("\n=== Compatibles de Ana");
    page = await session(QA.ana);
    await openCompatible(page);
    const carlaCard = cardOf(page, "qa_carla");
    await carlaCard.waitFor({ timeout: 15000 });
    const carlaCardText = await carlaCard.innerText();
    check(`Ana ve a Carla con el mismo ${EXPECTED}%`, carlaCardText.includes(`${EXPECTED}%`), carlaCardText.replace(/\s+/g, " "));
    check("señales de Ana: Valorant, Noche, PC, Competitivo (máximo 4)",
      ["Valorant", "Noche", "PC", "Competitivo"].every((label) => carlaCardText.includes(label))
      && await carlaCard.locator(".match-card__signal").count() === 4);
    check("Bruno (amigo, preferencias idénticas) no aparece", await cardOf(page, "qa_bruno").count() === 0);
    check("Diego (la bloqueó, preferencias idénticas) no aparece", await cardOf(page, "qa_diego").count() === 0);
    check("el buscador por nombre no se muestra en esta pestaña", await page.locator(".players-search").count() === 0);
    await page.screenshot({ path: `${SHOTS}/compatibles-ana.png`, fullPage: true });

    await carlaCard.getByRole("button").click();
    const dialog = page.locator(".p-dialog");
    await dialog.waitFor({ timeout: 10000 });
    check("la card abre el perfil de Carla", /qa_carla/.test(await dialog.innerText()));
    check("el perfil que ven los demás no muestra las preferencias", !/Sin rage|Squad|preferencias de juego/i.test(await dialog.innerText()));
    await page.keyboard.press("Escape");

    await page.getByRole("tab", { name: text("es", "matching", "tabs.search") }).click();
    const searchBack = await page.locator(".players-search").waitFor({ timeout: 5000 }).then(() => true, () => false);
    check("la pestaña de búsqueda por nombre sigue igual", searchBack && !/tab=/.test(page.url()), page.url());
    await close("Ana", page);

    // ---------- 6. Quitar todas las preferencias = salir de las sugerencias ----------
    console.log("\n=== Carla quita sus preferencias");
    page = await session(QA.carla);
    await page.goto(`${BASE}/profile`);
    await page.getByRole("button", { name: text("pt", "profile", "page.edit") }).click();
    const prefs = page.locator("#preferencias");
    await prefs.getByRole("checkbox").first().waitFor({ timeout: 10000 });
    const checked = prefs.locator("[role=checkbox][aria-checked=true]");
    while (await checked.count() > 0) await checked.first().click();
    // Micrófono "sin preferencia"; grupo y nivel se quitan eligiendo "Qualquer"
    const radioIn = (group, option) => prefs
      .getByRole("radiogroup", { name: text("pt", "matching", `prefs.${group}`) })
      .getByRole("radio", { name: text("pt", "matching", option), exact: true });
    await radioIn("mic", "mic.any").click();
    await radioIn("groupSize", "group.any").click();
    await radioIn("skillLevel", "level.any").click();
    await save(page, "pt");
    check("Firestore: se borró su matchProfile", !(await db.doc(`matchProfiles/${QA.carla.uid}`).get()).exists);
    await openCompatible(page);
    check("Carla vuelve a ver la invitación a configurar", await page.getByText(text("pt", "matching", "setup.title")).count() === 1);
    await close("Carla quita", page);

    page = await session(QA.ana);
    await openCompatible(page);
    check("y ya no aparece en los compatibles de Ana", await cardOf(page, "qa_carla").count() === 0);
    await close("Ana sin Carla", page);
  } finally {
    await browser.close();
    await Promise.all(QA_UIDS.map((uid) => db.doc(`matchProfiles/${uid}`).delete()));
    await db.doc(`blocks/${BLOCK_ID}`).delete();
    await carlaRef.update({ games: carlaGames });
    await carlaPublicRef.update({ games: carlaGames });
    console.log("\nCuentas qa_ restauradas (sin preferencias, sin el bloqueo, juegos de Carla)");
  }

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
