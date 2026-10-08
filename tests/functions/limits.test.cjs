// Límites por usuario y caché (functions/shared/limits.js y
// callableLimits.js, auditoría M-09). Sin Firebase ni internet.
const path = require("path");
const { createRateLimiter, createTtlCache, RateLimitError } = require(path.join(__dirname, "../../functions/shared/limits.js"));
const { perUserLimit } = require(path.join(__dirname, "../../functions/shared/callableLimits.js"));

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`  ${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};
const throws = (fn, cls) => { try { fn(); return false; } catch (e) { return !cls || e instanceof cls; } };

console.log("\n=== límite por usuario");
{
  let t = 0;
  const limit = createRateLimiter(3, 60000, () => t);
  limit("ana"); limit("ana"); limit("ana");
  check("la 4ª llamada en el mismo minuto se rechaza", throws(() => limit("ana"), RateLimitError));
  check("cada usuario tiene su propio contador", !throws(() => limit("bruno")));
  t = 60001;
  check("pasado el minuto vuelve a permitir", !throws(() => limit("ana")));
}
{
  let t = 0;
  const limit = createRateLimiter(1, 1000, () => t);
  for (let i = 0; i < 1000; i++) limit(`u${i}`);
  t = 5000;
  limit("nuevo");
  // Tras la limpieza, los 1000 usuarios inactivos ya no ocupan memoria: pueden volver a llamar
  check("descarta usuarios inactivos y vuelven a poder llamar", !throws(() => limit("u1")));
}

console.log("\n=== respuesta de la callable");
{
  const limit = perUserLimit(1);
  limit("ana");
  let error;
  try { limit("ana"); } catch (e) { error = e; }
  check("al pasarse responde resource-exhausted", error?.code === "resource-exhausted", error?.code);
}

console.log("\n=== caché");
{
  let t = 0;
  const cache = createTtlCache({ ttlMs: 1000, max: 2 }, () => t);
  cache.set("a", 1);
  check("devuelve lo guardado", cache.get("a") === 1);
  t = 1000;
  check("caduca a tiempo", cache.get("a") === undefined);
  cache.set("x", 1); cache.set("y", 2); cache.set("z", 3);
  check("con el tope lleno descarta la más vieja", cache.get("x") === undefined && cache.get("z") === 3 && cache.size === 2);
}

const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed}/${results.length} OK`);
process.exit(failed ? 1 : 0);
