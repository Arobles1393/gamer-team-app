// Logs sin claves (auditoría M-10): describeError no incluye la config de
// axios. Se provoca un error real de axios con una clave falsa (petición a un
// puerto local cerrado: sin internet).
const path = require("path");
const util = require("util");
const r = require("module").createRequire(path.join(__dirname, "../../functions/package.json"));
const axios = r("axios");
const { describeError } = require(path.join(__dirname, "../../functions/shared/safeError.js"));

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`  ${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};

const SECRET_KEY = "CLAVE_FALSA_123";
const SECRET_TOKEN = "TOKEN_FALSO_456";

(async () => {
  console.log("\n=== logs sin claves");
  let error;
  try {
    await axios.get("http://127.0.0.1:9/api", {
      params: { key: SECRET_KEY },
      headers: { Authorization: `Bearer ${SECRET_TOKEN}` },
      timeout: 2000
    });
  } catch (e) {
    error = e;
  }
  const full = util.inspect(error, { depth: 4 });
  check("el objeto completo SÍ trae las claves (por eso no se registra)", full.includes(SECRET_KEY) && full.includes(SECRET_TOKEN));
  const safe = describeError(error);
  check("describeError no trae la clave ni el token", !safe.includes(SECRET_KEY) && !safe.includes(SECRET_TOKEN), safe);
  check("pero sí el código del error", /ECONNREFUSED|ECONNRESET|ETIMEDOUT|ECONNABORTED/.test(safe));

  const http = Object.assign(new Error("Request failed with status code 403"), { name: "AxiosError", response: { status: 403 }, config: { params: { key: SECRET_KEY } } });
  check("con respuesta HTTP: incluye el estado", describeError(http) === "AxiosError HTTP 403: Request failed with status code 403", describeError(http));
  check("sin error / texto suelto", describeError(null) === "error desconocido" && describeError("x") === "x");

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed ? 1 : 0);
})();
