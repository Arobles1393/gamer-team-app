// "Unirme en Steam": funciones puras de functions/steamJoin y garantía de
// que ninguna otra función devuelve datos de salas ni IPs de servidor.
// Sin Firebase ni internet.
const fs = require("fs");
const path = require("path");
const svc = require(path.join(__dirname, "../../functions/steamJoin/steamJoin.service.js"));

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`  ${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};

const HOST = "76561197960287930";

console.log("\n=== isEligible (todas las combinaciones)");
let allOk = true;
for (const consent of [true, false]) {
  for (const isBlocked of [true, false]) {
    for (const isFriend of [true, false]) {
      for (const hasInterest of [true, false]) {
        const expected = consent && !isBlocked && (isFriend || hasInterest);
        if (svc.isEligible({ consent, isBlocked, isFriend, hasInterest }) !== expected) allOk = false;
      }
    }
  }
}
check("las 16 combinaciones dan lo esperado", allOk);
check("sin permiso nunca (aunque sea amigo e interesado)", !svc.isEligible({ consent: false, isBlocked: false, isFriend: true, hasInterest: true }));
check("con bloqueo nunca (aunque haya permiso y amistad)", !svc.isEligible({ consent: true, isBlocked: true, isFriend: true, hasInterest: true }));
check("consent tiene que ser exactamente true", !svc.isEligible({ consent: "true", isBlocked: false, isFriend: true, hasInterest: false }));

console.log("\n=== buildJoinUrl");
check("válido -> steam://joinlobby/app/lobby/host",
  svc.buildJoinUrl({ appId: "730", lobbyId: "109775241047382912", hostSteamId: HOST }) === `steam://joinlobby/730/109775241047382912/${HOST}`);
check("appId numérico también", svc.buildJoinUrl({ appId: 570, lobbyId: "123", hostSteamId: HOST }) === `steam://joinlobby/570/123/${HOST}`);
const invalid = [
  ["lobby \"0\"", { lobbyId: "0" }],
  ["lobby \"000\"", { lobbyId: "000" }],
  ["lobby vacío", { lobbyId: "" }],
  ["lobby null", { lobbyId: null }],
  ["lobby con letras", { lobbyId: "12ab" }],
  ["lobby con ../", { lobbyId: "../123" }],
  ["lobby con espacios", { lobbyId: "123 456" }],
  ["lobby javascript:", { lobbyId: "javascript:alert(1)" }],
  ["appId con letras", { appId: "73a" }],
  ["appId javascript:", { appId: "javascript:alert(1)" }],
  ["steamid de 16 dígitos", { hostSteamId: "7656119796028793" }],
  ["steamid de 18 dígitos", { hostSteamId: "765611979602879300" }],
  ["steamid con letras", { hostSteamId: "7656119796028793x" }],
  ["steamid con ../", { hostSteamId: "../76561197960287" }]
];
for (const [name, override] of invalid) {
  check(`${name} -> null`, svc.buildJoinUrl({ appId: "730", lobbyId: "123", hostSteamId: HOST, ...override }) === null);
}

console.log("\n=== sanitizeGameName");
check("quita caracteres de control", svc.sanitizeGameName("Counter\u0000-Strike\u0007 2\n") === "Counter-Strike 2");
check("recorta a 80 caracteres", svc.sanitizeGameName("x".repeat(500)).length === 80);
check("no string -> null", svc.sanitizeGameName(42) === null && svc.sanitizeGameName(null) === null);
check("vacío o solo controles -> null", svc.sanitizeGameName("\u0001\u0002") === null);

console.log("\n=== enlace de Steam del perfil");
check("/profiles/<SteamID64>", svc.steamIdentifierFromLinks(["https://x.com/a", `https://steamcommunity.com/profiles/${HOST}/`]) === HOST);
check("/id/<vanity>", svc.steamIdentifierFromLinks(["https://steamcommunity.com/id/gaben"]) === "gaben");
check("sin Steam -> null", svc.steamIdentifierFromLinks(["https://twitch.tv/a"]) === null);
check("identificador raro -> null", svc.steamIdentifierFromLinks(["https://steamcommunity.com/id/a b<c>"]) === null);

console.log("\n=== límite de uso (30 por minuto por usuario)");
let t = 0;
const limiter = svc.createRateLimiter(30, 60000, () => t);
let blocked = false;
for (let i = 0; i < 30; i += 1) limiter("a");
try { limiter("a"); } catch (e) { blocked = e instanceof svc.RateLimitError; }
check("la llamada 31 en el mismo minuto se rechaza", blocked);
let otherOk = true;
try { limiter("b"); } catch { otherOk = false; }
check("no afecta a otro usuario", otherOk);
t = 61000;
let afterOk = true;
try { limiter("a"); } catch { afterOk = false; }
check("al pasar el minuto vuelve a dejar", afterOk);

console.log("\n=== ninguna otra función devuelve datos de salas ni IPs");
const FUNCTIONS = path.join(__dirname, "../../functions");
const files = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "scripts"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".js")) files.push(full);
  }
};
walk(FUNCTIONS);
const offenders = files
  .filter((file) => !file.includes(`${path.sep}steamJoin${path.sep}`))
  .filter((file) => {
    // Los comentarios pueden nombrarlos; el código no
    const code = fs.readFileSync(file, "utf8").replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
    return /lobbysteamid|gameserverip|steam:\/\/connect/i.test(code);
  })
  .map((file) => path.relative(FUNCTIONS, file));
check(`${files.length - 2} archivos de functions revisados (getSteamPresence, getSteamStats, loginWithSteam...): ninguno usa lobbysteamid, gameserverip ni steam://connect`,
  offenders.length === 0, offenders.join(", "));
const joinCode = fs.readFileSync(path.join(FUNCTIONS, "steamJoin/steamJoin.service.js"), "utf8").replace(/\/\/.*$/gm, "");
check("getJoinInfo no lee gameserverip ni usa steam://connect", !/gameserverip|steam:\/\/connect/i.test(joinCode));

const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed}/${results.length} pruebas OK${failed ? ` (${failed} fallaron)` : ""}`);
process.exit(failed ? 1 : 0);
