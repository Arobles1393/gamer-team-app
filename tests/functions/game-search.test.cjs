// logGameSearch (functions/games/games.service.js): cada persona suma una
// búsqueda por juego por hora (auditoría B-25). firebase-admin falso: sin
// Firebase ni internet.
const path = require("path");
const FUNCTIONS = path.join(__dirname, "../../functions");
const resolve = (id) => require.resolve(id, { paths: [FUNCTIONS] });

const updates = [];
let missing = new Set();
const fakeFirestore = {
  collection: () => ({
    doc: (id) => ({
      update: async (data) => {
        if (missing.has(id)) throw Object.assign(new Error("no existe"), { code: 5 });
        updates.push({ id, data });
      }
    })
  })
};
require.cache[resolve("firebase-admin")] = { id: "fa", filename: "fa", loaded: true, exports: { firestore: () => fakeFirestore } };
require.cache[resolve("firebase-admin/firestore")] = {
  id: "faf", filename: "faf", loaded: true,
  exports: { FieldValue: { increment: (n) => ({ increment: n }), serverTimestamp: () => "ts" } }
};

const { logGameSearch, ValidationError } = require(path.join(FUNCTIONS, "games/games.service.js"));

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`  ${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};

(async () => {
  console.log("\n=== búsquedas de juegos (tendencias)");
  const first = await logGameSearch({ game: "Valorant" }, "uidA");
  check("la primera búsqueda suma 1 en game_stats/{juego codificado}", first.logged && updates[0]?.id === "Valorant" && updates[0]?.data.searchCount.increment === 1);

  const again = await logGameSearch({ game: " valorant " }, "uidA");
  check("la misma persona y juego dentro de la hora: no suma", again.logged === false && again.repeated && updates.length === 1);

  await logGameSearch({ game: "Valorant" }, "uidB");
  check("otra persona sí suma", updates.length === 2);

  await logGameSearch({ game: "Fate/Grand Order" }, "uidA");
  check("otro juego de la misma persona sí suma (id codificado)", updates[2]?.id === "Fate%2FGrand%20Order");

  missing = new Set(["Inventado"]);
  const unknown = await logGameSearch({ game: "Inventado" }, "uidC");
  check("juego sin publicaciones: no crea nada", unknown.logged === false && updates.length === 3);
  const retry = await logGameSearch({ game: "Inventado" }, "uidC");
  check("y no queda marcado: si luego tiene publicaciones, cuenta", retry.logged === false && !retry.repeated);

  const invalid = await Promise.all([
    logGameSearch({ game: "" }, "u"), logGameSearch({ game: 5 }, "u"), logGameSearch({ game: "x".repeat(201) }, "u")
  ].map((p) => p.then(() => false, (e) => e instanceof ValidationError)));
  check("juego vacío, no texto o muy largo: rechazado", invalid.every(Boolean));

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
})();
