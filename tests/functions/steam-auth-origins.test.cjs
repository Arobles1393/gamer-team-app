// Login con Steam: a qué orígenes puede volver la respuesta (auditoría B-24).
// localhost solo en el emulador. Sin Firebase ni internet.
const path = require("path");
const modulePath = path.join(__dirname, "../../functions/steamAuth/steamAuth.service.js");
const { getAllowedOrigins } = require(require.resolve(modulePath, { paths: [path.join(__dirname, "../../functions")] }));

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`  ${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};

const withEnv = (env, fn) => {
  const saved = {};
  for (const [k, v] of Object.entries(env)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try { return fn(); } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
};

console.log("\n=== login con Steam: orígenes permitidos");
const prod = withEnv({ GCLOUD_PROJECT: "gamerteam-4ed20", FUNCTIONS_EMULATOR: undefined, STEAM_AUTH_ALLOWED_ORIGINS: undefined }, getAllowedOrigins);
check("producción: los dominios de Hosting del proyecto", prod.includes("https://gamerteam-4ed20.web.app") && prod.includes("https://gamerteam-4ed20.firebaseapp.com"), prod.join(", "));
check("producción: sin localhost", !prod.some((o) => o.includes("localhost")));

const emu = withEnv({ GCLOUD_PROJECT: "gamerteam-4ed20", FUNCTIONS_EMULATOR: "true", STEAM_AUTH_ALLOWED_ORIGINS: undefined }, getAllowedOrigins);
check("emulador: también localhost:3000", emu.includes("http://localhost:3000"));

const extra = withEnv({ GCLOUD_PROJECT: "gamerteam-4ed20", FUNCTIONS_EMULATOR: undefined, STEAM_AUTH_ALLOWED_ORIGINS: " https://gamermatch.app ,https://www.gamermatch.app," }, getAllowedOrigins);
check("dominio propio por STEAM_AUTH_ALLOWED_ORIGINS (recortado, sin vacíos)", extra.includes("https://gamermatch.app") && extra.includes("https://www.gamermatch.app") && !extra.includes(""));

const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed}/${results.length} OK`);
process.exit(failed ? 1 : 0);
