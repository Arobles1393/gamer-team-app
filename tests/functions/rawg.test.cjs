// RAWG desde el servidor (functions/games/rawg.service.js, auditoría M-16).
// Con un cliente HTTP falso: sin internet ni clave real.
const path = require("path");
process.env.RAWG_API_KEY = "clave-de-prueba";
const rawg = require(path.join(__dirname, "../../functions/games/rawg.service.js"));

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`  ${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};
const throwsValidation = (fn) => {
  try { fn(); return false; } catch (e) { return e instanceof rawg.ValidationError; }
};
const rejectsValidation = (promise) => promise.then(() => false, (e) => e instanceof rawg.ValidationError);

const fakeHttp = (data) => {
  const calls = [];
  return { calls, get: async (url, opts) => { calls.push({ url, params: opts?.params }); return { data }; } };
};

(async () => {
  console.log("\n=== RAWG: validación");
  check("normaliza la búsqueda (minúsculas, espacios)", rawg.normalizeQuery("  Valorant   Night ") === "valorant night");
  check("menos de 2 caracteres: rechazada", throwsValidation(() => rawg.normalizeQuery("a")));
  check("más de 100 caracteres: rechazada", throwsValidation(() => rawg.normalizeQuery("x".repeat(101))));
  check("no texto: rechazada", throwsValidation(() => rawg.normalizeQuery({ $gt: "" })));
  check("id de juego entero positivo", rawg.normalizeGameId("3498") === 3498);
  check("id inválido: rechazado", ["abc", -1, 0, 1.5, "../x", null].every((v) => throwsValidation(() => rawg.normalizeGameId(v))));

  console.log("\n=== RAWG: respuesta");
  const sample = {
    results: [
      { id: 1, name: "Valorant", background_image: "https://media.rawg.io/v.jpg", platforms: [{ platform: { name: "PC" } }], rating: 4, extra: "x" },
      { id: "mal", name: "sin id entero" },
      { id: 2, name: "Sin imagen", platforms: null }
    ]
  };
  const mapped = rawg.mapSearchResults(sample);
  check("misma forma que armaba el navegador", JSON.stringify(mapped[0]) === JSON.stringify({ id: 1, label: "Valorant", value: "Valorant", image: "https://media.rawg.io/v.jpg", platforms: ["PC"] }), JSON.stringify(mapped[0]));
  check("descarta resultados sin id o nombre válidos", mapped.length === 2);
  check("sin imagen ni plataformas: null y []", mapped[1].image === null && mapped[1].platforms.length === 0);
  check("como máximo 20 resultados", rawg.mapSearchResults({ results: Array.from({ length: 40 }, (_, i) => ({ id: i + 1, name: `J${i}` })) }).length === 20);
  check("respuesta vacía o rara: []", rawg.mapSearchResults(null).length === 0 && rawg.mapSearchResults({ results: "x" }).length === 0);

  const detail = rawg.mapGameDetail({ stores: [{ store: { slug: "epic" }, url: "https://epic" }, { store: { slug: "steam" }, url: "https://store.steampowered.com/app/730/" }], clip: { clip: "https://clip.mp4" } });
  check("detalle: appid de Steam y clip", detail.steamAppId === "730" && detail.clip === "https://clip.mp4", JSON.stringify(detail));
  check("detalle sin Steam ni clip: null", JSON.stringify(rawg.mapGameDetail({})) === JSON.stringify({ steamAppId: null, clip: null }));

  console.log("\n=== RAWG: llamadas y caché");
  const http = fakeHttp(sample);
  const first = await rawg.searchGames("Valorant", http);
  check("busca en /games con la clave del servidor", http.calls[0]?.url === "/games" && http.calls[0]?.params.key === "clave-de-prueba" && http.calls[0]?.params.search === "valorant");
  await rawg.searchGames("  VALORANT ", http);
  check("la misma búsqueda sale de la caché", http.calls.length === 1 && first.length === 2);
  check("búsqueda inválida no llama a RAWG", await rejectsValidation(rawg.searchGames("x", http)) && http.calls.length === 1);

  const httpDetail = fakeHttp({ stores: [], clip: null });
  await rawg.getGameDetail(3498, httpDetail);
  await rawg.getGameDetail("3498", httpDetail);
  check("detalle en /games/{id}, con caché", httpDetail.calls.length === 1 && httpDetail.calls[0].url === "/games/3498");

  delete process.env.RAWG_API_KEY;
  const noKey = await rawg.searchGames("otro juego", fakeHttp(sample)).then(() => false, (e) => /RAWG_API_KEY/.test(e.message));
  check("sin RAWG_API_KEY: error claro (no llama sin clave)", noKey);

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
})();
