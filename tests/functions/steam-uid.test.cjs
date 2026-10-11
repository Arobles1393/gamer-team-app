// uid seudónimo de las cuentas de Steam (functions/steamAuth/steamAuth.service.js).
// Sin Firebase ni internet: getUser se simula.
const path = require("path");
const { steamUid, resolveSteamUid } = require(path.join(__dirname, "../../functions/steamAuth/steamAuth.service.js"));

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`  ${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};
const throws = (fn) => {
  try {
    fn();
    return false;
  } catch {
    return true;
  }
};

const SECRET = "clave-de-prueba-de-al-menos-32-caracteres!!";
const OTHER_SECRET = "otra-clave-de-prueba-de-al-menos-32-caracteres";
const STEAM_ID = "76561197960287930";
const notFound = async () => {
  throw Object.assign(new Error("no"), { code: "auth/user-not-found" });
};

(async () => {
  console.log("\n=== uid seudónimo");
  const uid = steamUid(STEAM_ID, SECRET);
  check("28 caracteres base64url, como un uid de Firebase", /^[A-Za-z0-9_-]{28}$/.test(uid), uid);
  check("no contiene el SteamID ni 'steam'", !uid.includes(STEAM_ID) && !uid.includes(STEAM_ID.slice(-6)) && !/steam/i.test(uid));
  check("la misma cuenta de Steam siempre da el mismo uid", steamUid(STEAM_ID, SECRET) === uid);
  check("otra cuenta de Steam da otro uid", steamUid("76561197960287931", SECRET) !== uid);
  check("con otra clave da otro uid (sin la clave no se reproduce)", steamUid(STEAM_ID, OTHER_SECRET) !== uid);
  check("sin clave: error (no inicia sesión con un uid adivinable)", throws(() => steamUid(STEAM_ID, undefined)));
  check("clave corta: error", throws(() => steamUid(STEAM_ID, "corta")));

  console.log("\n=== cuenta nueva o anterior");
  const fresh = await resolveSteamUid(STEAM_ID, { secret: SECRET, getUser: notFound });
  check("sin cuenta anterior: el seudónimo", fresh === uid, fresh);
  const legacy = await resolveSteamUid(STEAM_ID, { secret: SECRET, getUser: async (u) => ({ uid: u }) });
  check("con cuenta anterior (steam:<id>): la conserva", legacy === `steam:${STEAM_ID}`, legacy);
  const legacyNoSecret = await resolveSteamUid(STEAM_ID, { secret: undefined, getUser: async (u) => ({ uid: u }) });
  check("la cuenta anterior entra aunque falte la clave", legacyNoSecret === `steam:${STEAM_ID}`);
  const authDown = await resolveSteamUid(STEAM_ID, {
    secret: SECRET,
    getUser: async () => {
      throw Object.assign(new Error("caído"), { code: "auth/internal-error" });
    }
  }).then(() => "resolvió", () => "error");
  check("si Auth falla, error (no crea una cuenta duplicada)", authDown === "error");

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} pruebas OK${failed ? ` (${failed} fallaron)` : ""}`);
  process.exit(failed ? 1 : 0);
})();
