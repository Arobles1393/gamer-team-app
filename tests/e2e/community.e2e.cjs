// Mapa de la comunidad (/comunidad). Necesita el emulador de functions
// con getCommunityStats. Crea documentos TEMPORALES users/qa_map_* (sin
// cuenta de Auth ni perfil público) con país, juegos y lastSeen reciente
// para llegar a la masa crítica, y los borra al terminar.
//   Finlandia 15 (10 Valorant + 5 Fortnite), Noruega 7 Valorant,
//   Islandia 3 Valorant (enmascarado)
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

// Ids reales de RAWG (los que devuelve el buscador del filtro)
const VALORANT = { id: 415171, name: "Valorant" };
const FORTNITE = { id: 47137, name: "Fortnite Battle Royale" };
// La función guarda 60 s lo que consultó
const CACHE_MS = 62 * 1000;

const TEMP = [
  ...Array.from({ length: 10 }, () => ({ region: "Finlandia", games: [VALORANT] })),
  ...Array.from({ length: 5 }, () => ({ region: "Finlandia", games: [FORTNITE] })),
  ...Array.from({ length: 7 }, () => ({ region: "Noruega", games: [VALORANT] })),
  ...Array.from({ length: 3 }, () => ({ region: "Islandia", games: [VALORANT] }))
].map((data, i) => ({ id: `qa_map_${String(i + 1).padStart(2, "0")}`, ...data }));

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};

const removeTemp = async () => {
  const batch = db.batch();
  TEMP.forEach(({ id }) => batch.delete(db.doc(`users/${id}`)));
  await batch.commit();
};

const rowOf = (page, name) => page.locator(".country-rank__row", { hasText: name });
const rowText = async (page, name) => (await rowOf(page, name).innerText()).replace(/\s+/g, " ");

let browser;
(async () => {
  browser = await chromium.launch({ channel: process.env.E2E_BROWSER || "msedge", headless: true });
  const context = await browser.newContext({ locale: "es-MX", viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  try {
    await removeTemp();

    // qa_ana (México): su sesión la cuenta como activa
    await page.goto(`${BASE}/login`);
    await page.locator("#email").fill(QA.ana.email);
    await page.locator("#password").fill(QA.ana.password);
    await page.locator("button[type=submit]").click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
    await page.waitForTimeout(2000);

    // ---------- 1. Menú del avatar ----------
    console.log("\n=== acceso");
    await page.locator(".app-rail__avatar-btn").click();
    await page.locator(".gm-menu").getByText("Comunidad", { exact: true }).click();
    await page.waitForURL(/\/comunidad$/, { timeout: 10000 });
    check("Comunidad está en el menú del avatar y lleva a /comunidad", true);
    check("no está en el rail principal", await page.locator('.app-rail a[href="/comunidad"]').count() === 0);

    // ---------- 2. Sin masa crítica ----------
    console.log("\n=== comunidad creciendo");
    // Si se acaba de correr otra vez, la función puede tener en caché (60 s)
    // los documentos temporales de la corrida anterior: se recarga hasta verlo
    const growing = page.getByText("La comunidad está creciendo");
    for (let attempt = 0; attempt < 8 && !(await growing.isVisible()); attempt += 1) {
      await page.waitForTimeout(10000);
      await page.reload();
      await page.locator(".community .feed-empty, .country-rank").first().waitFor({ timeout: 20000 }).catch(() => {});
    }
    await growing.waitFor({ timeout: 20000 });
    const firstCallAt = Date.now();
    check("con menos de 20 activos: estado 'creciendo' sin mapa ni números",
      await page.locator(".world-map, .country-rank, .community__total").count() === 0);
    await page.screenshot({ path: `${SHOTS}/comunidad-creciendo.png`, fullPage: true });

    // ---------- 3. Con masa crítica ----------
    console.log("\n=== con 25 activos de prueba");
    const now = admin.firestore.Timestamp.now();
    const batch = db.batch();
    TEMP.forEach(({ id, region, games }) => batch.set(db.doc(`users/${id}`), { username: id, region, games, lastSeen: now }));
    await batch.commit();
    await page.waitForTimeout(Math.max(0, CACHE_MS - (Date.now() - firstCallAt)));

    await page.reload();
    await page.locator(".country-rank").waitFor({ timeout: 20000 });
    await page.locator(".world-map").waitFor({ timeout: 20000 });
    const total = await page.locator(".community__total").innerText();
    check("muestra el total (aproximado porque hay países enmascarados)", /^Más de \d+ jugadores activos ahora$/.test(total.trim()), total);
    check("Finlandia: 15 jugadores activos", /15 jugadores activos/.test(await rowText(page, "Finlandia")), await rowText(page, "Finlandia"));
    check("Noruega: 7 jugadores activos", /7 jugadores activos/.test(await rowText(page, "Noruega")));
    check("Islandia (3): 'Menos de 5 jugadores activos', sin el número",
      /Menos de 5 jugadores activos/.test(await rowText(page, "Islandia")) && !/\b3\b/.test(await rowText(page, "Islandia")),
      await rowText(page, "Islandia"));
    check("México (Ana) también enmascarado", /Menos de 5/.test(await rowText(page, "México")));
    const order = await page.locator(".country-rank__name").allInnerTexts();
    check("ordenada por actividad (Finlandia, Noruega y luego los enmascarados)",
      order[0] === "Finlandia" && order[1] === "Noruega", order.join(", "));
    check("en el mapa: Finlandia con actividad, Islandia con tinte de enmascarado",
      await page.locator('.world-map__country--active[data-code="FI"]').count() === 1
      && await page.locator('.world-map__country--masked[data-code="IS"]').count() === 1);
    check("punto solo en países con número (FI, NO), no en enmascarados",
      await page.locator(".world-map__dot").count() === 2);
    check("ningún nombre de usuario en la página",
      !/qa_map_|qa_ana/.test(await page.locator(".community").innerText()));
    await page.screenshot({ path: `${SHOTS}/comunidad-mapa.png`, fullPage: true });

    // ---------- 4. Filtro por juego ----------
    console.log("\n=== filtro por juego");
    const pickGame = async (query, name) => {
      await page.locator("#community-game").fill(query);
      const option = page.locator(".p-autocomplete-item", { hasText: name }).first();
      await option.waitFor({ timeout: 15000 });
      await option.click();
    };
    await page.locator("#community-game").fill("Valorant");
    await page.locator(".p-autocomplete-item").first().waitFor({ timeout: 15000 });
    // El resultado exacto "Valorant" (también salen "Valorant 2.0", etc.)
    await page.locator(".p-autocomplete-item").filter({ hasText: /^\s*Valorant\s*$/ }).first().click();
    await page.waitForFunction(() => /10 jugadores activos/.test(
      [...document.querySelectorAll(".country-rank__row")].find((row) => row.textContent.includes("Finlandia"))?.textContent || ""
    ), null, { timeout: 15000 }).catch(() => {});
    check("Valorant: Finlandia baja de 15 a 10", /10 jugadores activos/.test(await rowText(page, "Finlandia")), await rowText(page, "Finlandia"));
    check("Valorant: Noruega sigue en 7 e Islandia enmascarado",
      /7 jugadores activos/.test(await rowText(page, "Noruega")) && /Menos de 5/.test(await rowText(page, "Islandia")));
    await page.screenshot({ path: `${SHOTS}/comunidad-valorant.png`, fullPage: true });

    await page.getByRole("button", { name: "Todos los juegos" }).click();
    await pickGame("Fortnite", "Fortnite Battle Royale");
    const growingGame = await page.getByText("Todavía no hay suficientes jugadores de", { exact: false })
      .waitFor({ timeout: 15000 }).then(() => true, () => false);
    check("Fortnite (5 de prueba + reales, menos de 20): estado 'creciendo' para ese juego, sin datos parciales",
      growingGame && await page.locator(".country-rank").count() === 0);
    await page.getByRole("button", { name: "Ver todos los juegos" }).click();
    await page.locator(".country-rank").waitFor({ timeout: 15000 });
    check("'Ver todos los juegos' quita el filtro", /15 jugadores activos/.test(await rowText(page, "Finlandia")));

    // ---------- 5. Lista y mapa abren el mismo panel ----------
    console.log("\n=== seleccionar país");
    await rowOf(page, "Finlandia").click();
    const panel = page.locator(".country-panel");
    await panel.waitFor({ timeout: 5000 });
    const fromList = (await panel.innerText()).replace(/\s+/g, " ");
    check("desde la lista: panel de Finlandia con su conteo", /Finlandia/.test(fromList) && /15 jugadores activos/.test(fromList), fromList);
    check("la fila queda marcada", (await rowOf(page, "Finlandia").getAttribute("aria-pressed")) === "true");
    check("y el país en el mapa con borde de seleccionado", await page.locator('.world-map__country--selected[data-code="FI"]').count() === 1);
    await panel.getByRole("button", { name: "Cerrar" }).click();
    check("Cerrar quita el panel", await page.locator(".country-panel").count() === 0);

    await page.locator('.world-map__country[data-code="FI"]').click();
    await panel.waitFor({ timeout: 5000 });
    const fromMap = (await panel.innerText()).replace(/\s+/g, " ");
    check("desde el mapa: el mismo panel", fromMap === fromList, fromMap);
    await page.locator('.world-map__country[data-code="IS"]').click();
    check("Islandia desde el mapa: 'Menos de 5'", /Islandia/.test(await panel.innerText()) && /Menos de 5/.test(await panel.innerText()));
    await page.locator(".world-map__country:not(.world-map__country--active)").first().click({ force: true });
    check("un país sin actividad no se puede seleccionar", /Islandia/.test(await panel.innerText()));

    // ---------- 6. Ver partidas del país ----------
    console.log("\n=== partidas del país");
    // Cuenta las tarjetas cuando ya no hay esqueletos de carga
    const countPosts = async () => {
      // PostCard es <article>; el esqueleto de carga es un <div>. Espera a
      // que el número deje de cambiar (o 20 s sin partidas)
      let last = -1;
      for (let elapsed = 0; elapsed < 20000; elapsed += 1000) {
        await page.waitForTimeout(1000);
        const count = await page.locator(".post-grid article").count();
        if (count > 0 && count === last) return count;
        last = count;
      }
      return last;
    };
    await page.goto(`${BASE}/explorar?category=nearby`);
    const nearbyCount = await countPosts();
    await page.goto(`${BASE}/explorar?category=recent`);
    const recentCount = await countPosts();

    await page.goto(`${BASE}/comunidad`);
    await rowOf(page, "México").click();
    await page.locator(".country-panel").getByRole("button", { name: "Ver partidas de México" }).click();
    await page.waitForURL(/\/explorar\?category=recent&region=MX$/, { timeout: 10000 });
    const regionCount = await countPosts();
    check("lleva a /explorar?category=recent&region=MX con el título del país",
      (await page.locator(".feed-header__title").innerText()).trim().toLowerCase() === "partidas de méxico");
    check("muestra lo mismo que 'Cerca de ti' de Ana (authorRegion México), no todos los recientes",
      regionCount === nearbyCount && regionCount > 0 && regionCount < recentCount,
      `region=${regionCount} cerca=${nearbyCount} recientes=${recentCount}`);
    const mexico = new Set((await db.collection("posts").where("authorRegion", "==", "México").get()).docs.map((d) => d.data().userId));
    const others = (await db.collection("posts").get()).docs.filter((d) => d.data().authorRegion !== "México").length;
    check("Firestore: hay posts de otros países que no aparecen", others > 0, `otros=${others}`);
    check("los autores mostrados publicaron desde México", mexico.size > 0);
    await page.screenshot({ path: `${SHOTS}/explorar-mexico.png`, fullPage: true });
    await page.locator(".explore-region").click();
    await page.waitForURL((url) => !url.search.includes("region="), { timeout: 10000 });
    check("el chip del país quita el filtro", true);

    // ---------- 7. Celular: la lista primero, el mapa con el toggle ----------
    console.log("\n=== celular");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/comunidad`);
    await page.locator(".country-rank").waitFor({ timeout: 20000 });
    check("a 390 px se ve la lista y el mapa queda oculto", await page.locator(".community-map").isHidden());
    await page.getByRole("button", { name: "Mapa", exact: true }).click();
    check("con 'Mapa' aparece el mapa", await page.locator(".community-map").isVisible());
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    check("sin desbordes horizontales", !overflow);
    await page.screenshot({ path: `${SHOTS}/comunidad-movil.png`, fullPage: true });

    check("sin errores de JS", errors.length === 0, errors.join(" | ").slice(0, 200));
  } finally {
    await browser.close();
    await removeTemp();
    console.log(`\n${TEMP.length} documentos temporales users/qa_map_* borrados`);
  }

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
})().catch(async (error) => {
  console.error(error);
  await removeTemp().catch(() => {});
  process.exit(1);
});
