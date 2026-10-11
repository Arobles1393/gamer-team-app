// getJoinInfo contra el emulador de Firestore (Steam simulado: la llamada
// real a Steam se prueba a mano). Corre dentro de `firebase emulators:exec`,
// que pone FIRESTORE_EMULATOR_HOST. Uso: npm run test:functions:emulator
const path = require("path");
const r = require("module").createRequire(path.join(__dirname, "../../functions/index.js"));
const admin = r("firebase-admin");
const { createGetJoinInfo, createRateLimiter, RateLimitError } = require(path.join(__dirname, "../../functions/steamJoin/steamJoin.service.js"));

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error("Falta FIRESTORE_EMULATOR_HOST: corre con npm run test:functions:emulator");
  process.exit(1);
}

admin.initializeApp({ projectId: "demo-gamermatch" });
const db = admin.firestore();

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`  ${ok ? "OK   " : "FALLA"} ${name}${extra ? ` -> ${extra}` : ""}`);
};

const A = "aaaHost";       // juega
const FRIEND = "bbbFriend";
const FAN = "cccFan";      // marcó "Quiero jugar" en la partida de A
const STRANGER = "dddStranger";
const BLOCKED = "eeeBlocked"; // amigo, pero con bloqueo
const POST = "postA";
const HOST_ID = "76561197960287930";
const LOBBY = "109775241047382912";

// Steam simulado: A está en una sala
let steam = { gameid: "730", gameextrainfo: "Counter-Strike 2", lobbysteamid: LOBBY };
let steamCalls = 0;
const getJoinInfo = createGetJoinInfo({
  db: () => db,
  getSummary: async (steamId) => {
    steamCalls += 1;
    return steamId === HOST_ID ? steam : null;
  },
  resolveSteam: async (identifier) => (identifier === "hostvanity" ? HOST_ID : identifier),
  rateLimit: () => {}
});
const ask = (callerUid, postId) => getJoinInfo({ callerUid, targetUid: A, postId });
const pair = (x, y) => [x, y].sort();

(async () => {
  const batch = db.batch();
  batch.set(db.doc(`users/${A}`), { username: "host", links: ["https://steamcommunity.com/id/hostvanity"] });
  batch.set(db.doc(`users/${A}/private/preferences`), { privacy: { allowSteamJoin: true } });
  batch.set(db.doc(`friends/${pair(A, FRIEND).join("_")}`), { users: pair(A, FRIEND) });
  batch.set(db.doc(`friends/${pair(A, BLOCKED).join("_")}`), { users: pair(A, BLOCKED) });
  batch.set(db.doc(`blocks/${A}_${BLOCKED}`), { participants: [A, BLOCKED], blockerId: A, blockedId: BLOCKED });
  batch.set(db.doc(`posts/${POST}`), { userId: A, game: "CS2" });
  batch.set(db.doc(`post_interested/${POST}_${FAN}`), { postId: POST, userId: FAN });
  batch.set(db.doc("posts/otherPost"), { userId: STRANGER, game: "CS2" });
  await batch.commit();

  console.log("\n=== permitido");
  const friend = await ask(FRIEND);
  check("amigo: disponible con el enlace joinlobby", friend.available === true && friend.joinUrl === `steam://joinlobby/730/${LOBBY}/${HOST_ID}`, JSON.stringify(friend));
  check("la respuesta solo trae available, gameName y joinUrl",
    JSON.stringify(Object.keys(friend).sort()) === JSON.stringify(["available", "gameName", "joinUrl"]) && friend.gameName === "Counter-Strike 2");
  check("sin lobbysteamid suelto, steamid ni gameserverip", !/lobbysteamid|gameserverip|"steamid"/i.test(JSON.stringify(friend)));
  const fan = await ask(FAN, POST);
  check("interesado en SU partida (con postId): disponible", fan.available === true);

  console.log("\n=== no permitido (siempre { available: false })");
  const negatives = {
    "interesado sin postId": await ask(FAN),
    "interesado con otra partida (de otra persona)": await ask(FAN, "otherPost"),
    "interesado con una partida que no existe": await ask(FAN, "noExiste"),
    "sin amistad ni interés": await ask(STRANGER, POST),
    "amigo pero bloqueado por A": await ask(BLOCKED),
    "uno mismo": await getJoinInfo({ callerUid: A, targetUid: A })
  };
  // Bloqueo en la otra dirección: el amigo bloquea a A
  await db.doc(`blocks/${FRIEND}_${A}`).set({ participants: [FRIEND, A], blockerId: FRIEND, blockedId: A });
  negatives["amigo que bloqueó a A"] = await ask(FRIEND);
  await db.doc(`blocks/${FRIEND}_${A}`).delete();
  for (const [name, result] of Object.entries(negatives)) {
    check(`${name}`, JSON.stringify(result) === JSON.stringify({ available: false }), JSON.stringify(result));
  }

  console.log("\n=== permiso de quien juega");
  await db.doc(`users/${A}/private/preferences`).set({ privacy: { allowSteamJoin: false } });
  const callsBefore = steamCalls;
  check("apagado: amigo no recibe nada", JSON.stringify(await ask(FRIEND)) === JSON.stringify({ available: false }));
  check("apagado: ni siquiera se consulta a Steam", steamCalls === callsBefore);
  await db.doc(`users/${A}/private/preferences`).delete();
  check("sin documento (por defecto): nada", JSON.stringify(await ask(FRIEND)) === JSON.stringify({ available: false }));
  await db.doc(`users/${A}/private/preferences`).set({ privacy: { allowSteamJoin: true } });

  console.log("\n=== Steam");
  steam = { gameid: "730", gameextrainfo: "Counter-Strike 2", lobbysteamid: null };
  check("en un juego sin sala: nada", JSON.stringify(await ask(FRIEND)) === JSON.stringify({ available: false }));
  steam = { gameid: null, gameextrainfo: null, lobbysteamid: null };
  check("fuera de un juego: nada", JSON.stringify(await ask(FRIEND)) === JSON.stringify({ available: false }));
  steam = { gameid: "730", gameextrainfo: "x", lobbysteamid: "0" };
  check("sala \"0\": nada", JSON.stringify(await ask(FRIEND)) === JSON.stringify({ available: false }));
  await db.doc(`users/${A}`).update({ links: ["https://twitch.tv/host"] });
  steam = { gameid: "730", gameextrainfo: "x", lobbysteamid: LOBBY };
  check("sin enlace de Steam en el perfil: nada", JSON.stringify(await ask(FRIEND)) === JSON.stringify({ available: false }));

  console.log("\n=== límite de uso");
  const limited = createGetJoinInfo({ db: () => db, getSummary: async () => steam, resolveSteam: async () => HOST_ID, rateLimit: createRateLimiter(3, 60000) });
  let rateLimited = false;
  try {
    for (let i = 0; i < 4; i += 1) await limited({ callerUid: STRANGER, targetUid: A });
  } catch (error) {
    rateLimited = error instanceof RateLimitError;
  }
  check("al superar el límite se rechaza (la función responde resource-exhausted)", rateLimited);

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} pruebas OK${failed ? ` (${failed} fallaron)` : ""}`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
