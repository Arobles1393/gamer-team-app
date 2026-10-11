// deleteAccount: reautenticación reciente exigida en el servidor
// (functions/account/account.service.js). Sin Firebase ni internet.
const path = require("path");
const { assertRecentLogin, RecentLoginError, RECENT_LOGIN_SECONDS } = require(path.join(__dirname, "../../functions/account/account.service.js"));

const results = [];
const check = (name, ok) => {
  results.push(ok);
  console.log(`  ${ok ? "OK   " : "FALLA"} ${name}`);
};
const rejects = (token, now) => {
  try {
    assertRecentLogin(token, now);
    return false;
  } catch (error) {
    return error instanceof RecentLoginError;
  }
};

const now = 1_800_000_000;
console.log("\n=== reautenticación reciente");
check("el límite es de 5 minutos", RECENT_LOGIN_SECONDS === 300);
check("sesión de hace 10 s: sí", !rejects({ auth_time: now - 10 }, now));
check("sesión de hace 5 min justos: sí", !rejects({ auth_time: now - 300 }, now));
check("sesión de hace 5 min y 1 s: no", rejects({ auth_time: now - 301 }, now));
check("sesión de hace 2 h: no", rejects({ auth_time: now - 7200 }, now));
check("sin auth_time: no", rejects({}, now));
check("sin token: no", rejects(undefined, now));

const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed}/${results.length} pruebas OK${failed ? ` (${failed} fallaron)` : ""}`);
process.exit(failed ? 1 : 0);
