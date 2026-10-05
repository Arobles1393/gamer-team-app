// Crea 4 usuarios de prueba (qa_*) en producción con perfiles y datos que
// imitan lo que escribe la app. El 5.º (qa_eva) se registra desde la UI.
// Guarda credenciales y uids en tests/e2e/.qa-users.json (ignorado por git).
// Uso: npm run qa:setup (una sola vez; para volver al estado inicial usa
// npm run qa:reset, y para borrarlo todo npm run qa:cleanup -- --write)
const fs = require("fs");
const crypto = require("crypto");
const r = require("module").createRequire(require("path").join(__dirname, "../../functions/index.js"));
const admin = r("firebase-admin");
const { FieldValue, Timestamp } = r("firebase-admin/firestore");

admin.initializeApp({ projectId: "gamerteam-4ed20" });
const db = admin.firestore();
const OUT = `${__dirname}/.qa-users.json`;

const password = () => `Qa-${crypto.randomBytes(6).toString("base64url")}9`;
const RAWG = "https://media.rawg.io/media/games";
const GAMES = {
  valorant: { id: 766, name: "Valorant", image: `${RAWG}/b11/b11127b9ee3c3701bd15b9af3286d20e.jpg` },
  fortnite: { id: 47137, name: "Fortnite Battle Royale", image: `${RAWG}/dcb/dcbb67f371a9a28ea38ffd73ee0f53f3.jpg` },
  tombraider: { id: 5286, name: "Tomb Raider", image: `${RAWG}/021/021c4e21a1824d2526f925eff6324653.jpg` },
  eldenring: { id: 5679, name: "Elden Ring: Shadow of the Erdtree", image: null }
};

const USERS = [
  {
    key: "ana", email: "qa.ana@example.com", username: "qa_ana", region: "México", language: "es",
    description: "Cuenta de prueba (QA). Juego shooters por las noches.",
    games: [GAMES.valorant, GAMES.fortnite], links: ["https://www.twitch.tv/qa_ana_test", "https://x.com/qa_ana_test"]
  },
  {
    key: "bruno", email: "qa.bruno@example.com", username: "qa_bruno", region: "Argentina", language: "en",
    description: "QA test account. Casual player.", games: [GAMES.fortnite], links: []
  },
  {
    key: "carla", email: "qa.carla@example.com", username: "qa_carla", region: "España", language: "pt",
    description: "", games: [GAMES.tombraider], links: []
  },
  {
    key: "diego", email: "qa.diego@example.com", username: "qa_diego", region: "Chile", language: null,
    description: "Cuenta QA para probar bloqueos.", games: [], links: []
  }
];

const PUBLIC_FIELDS = ["username", "usernameLower", "avatar", "banner", "region", "description", "games", "links", "lastSeen", "createdAt"];
const pick = (data) => Object.fromEntries(PUBLIC_FIELDS.filter((f) => data[f] !== undefined).map((f) => [f, data[f]]));

const ensureAuthUser = async ({ email, username }, pwd) => {
  try {
    const existing = await admin.auth().getUserByEmail(email);
    // Verificadas: firestore.rules pide el correo verificado para publicar
    await admin.auth().updateUser(existing.uid, { password: pwd, emailVerified: true });
    return existing.uid;
  } catch (error) {
    if (error.code !== "auth/user-not-found") throw error;
    return (await admin.auth().createUser({ email, password: pwd, displayName: username, emailVerified: true })).uid;
  }
};

// Igual que postService.createPost: post + group_chats + game_stats
const createPost = async (batch, id, uid, region, game, extra = {}) => {
  const now = Timestamp.now();
  batch.set(db.collection("posts").doc(id), {
    userId: uid, game: game.name, platform: "pc", platforms: ["PC"], multiplatform: false, playersNeeded: 3,
    comments: `Partida de prueba QA de ${game.name}`, image: game.image, logo: null, clip: null, portada: null,
    scheduledAt: null, requiresMic: true, skillLevel: "casual", language: "es", authorRegion: region,
    interestedCount: 0, createdAt: now, ...extra
  });
  batch.set(db.collection("group_chats").doc(id), {
    postId: id, participants: [uid], active: true, lastMessage: "", lastMessageAt: null, lastSenderId: null, createdAt: now
  });
  batch.set(db.collection("game_stats").doc(encodeURIComponent(game.name)),
    { game: game.name, postCount: FieldValue.increment(1), updatedAt: now, lastPostId: id }, { merge: true });
};

(async () => {
  // Correrlo dos veces sumaría otra vez las tendencias y perdería la
  // contraseña de qa_eva (que se registra desde la UI)
  if (fs.existsSync(OUT)) {
    console.error("Las cuentas de prueba ya existen (tests/e2e/.qa-users.json). Usa `npm run qa:reset` o `npm run qa:cleanup -- --write`.");
    process.exit(1);
  }

  const out = {};
  for (const u of USERS) {
    const pwd = password();
    const uid = await ensureAuthUser(u, pwd);
    const userData = {
      // Sin correo ni teléfono, como la app (el correo vive en Firebase Auth)
      username: u.username, usernameLower: u.username.toLowerCase(),
      region: u.region, avatar: null, description: u.description, games: u.games, links: u.links,
      createdAt: new Date(), lastSeen: Timestamp.now(), ...(u.language ? { language: u.language } : {})
    };
    await db.collection("users").doc(uid).set(userData);
    await db.collection("publicProfiles").doc(uid).set(pick(userData));
    // Guía de bienvenida ya vista: si no, se abre sola y tapa las pruebas
    await db.doc(`users/${uid}/private/preferences`).set({ onboarding: { completed: true, showAgain: false, completedVersion: 1 } });
    out[u.key] = { uid, email: u.email, password: pwd, username: u.username };
    console.log(`usuario ${u.username}: ${uid}`);
  }

  const { ana, bruno, carla, diego } = Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.uid]));
  const now = Timestamp.now();
  const batch = db.batch();

  // Ana y Bruno: amigos (solicitud aceptada + amistad con id ordenado)
  batch.set(db.collection("friend_requests").doc(`${ana}_${bruno}`), { senderId: ana, receiverId: bruno, status: "accepted", createdAt: now });
  batch.set(db.collection("friends").doc([ana, bruno].sort().join("_")), { users: [ana, bruno].sort(), createdAt: now });

  // Carla -> Ana: solicitud pendiente con su notificación
  batch.set(db.collection("friend_requests").doc(`${carla}_${ana}`), { senderId: carla, receiverId: ana, status: "pending", createdAt: now });
  batch.set(db.collection("notifications").doc(), { userId: ana, senderId: carla, type: "friend_request", status: "pending", read: false, createdAt: now });

  // Posts de prueba
  await createPost(batch, "qa_post_ana", ana, "México", GAMES.valorant);
  await createPost(batch, "qa_post_bruno", bruno, "Argentina", GAMES.fortnite);
  await createPost(batch, "qa_post_carla", carla, "España", GAMES.tombraider,
    { scheduledAt: Timestamp.fromMillis(Date.now() + 3 * 86400000), comments: "Partida QA programada para dentro de 3 días" });
  await batch.commit();

  // Bruno: Me interesa en el post de Ana (+ contador, grupo, notificación) y un comentario
  const b2 = db.batch();
  b2.set(db.collection("post_interested").doc(`qa_post_ana_${bruno}`), { postId: "qa_post_ana", userId: bruno, createdAt: now });
  b2.update(db.collection("posts").doc("qa_post_ana"), { interestedCount: FieldValue.increment(1) });
  b2.update(db.collection("group_chats").doc("qa_post_ana"), { participants: FieldValue.arrayUnion(bruno) });
  b2.set(db.collection("notifications").doc(), { userId: ana, senderId: bruno, type: "interested", read: false, createdAt: now, relatedId: "qa_post_ana" });
  b2.set(db.collection("post_comments").doc(), {
    postId: "qa_post_ana", text: "¡Me apunto! (comentario QA)", userId: bruno, mediaUrl: "", mediaType: "", mediaPath: "", createdAt: now
  });
  b2.set(db.collection("notifications").doc(), { userId: ana, senderId: bruno, type: "comment", read: false, createdAt: now, relatedId: "qa_post_ana" });
  await b2.commit();

  // Chat Ana-Bruno con 60 mensajes (para "Ver mensajes anteriores")
  const chatId = [ana, bruno].sort().join("_");
  const b3 = db.batch();
  b3.set(db.collection("chats").doc(chatId), { participants: [ana, bruno], lastMessage: "Mensaje QA 60", lastSenderId: bruno, lastMessageAt: now, createdAt: now });
  for (let i = 1; i <= 60; i++) {
    b3.set(db.collection("chats").doc(chatId).collection("messages").doc(`qa${String(i).padStart(2, "0")}`), {
      text: `Mensaje QA ${i}`, senderId: i % 2 ? ana : bruno, createdAt: Timestamp.fromMillis(Date.now() - (61 - i) * 60000)
    });
  }
  await b3.commit();

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`\nListo. Credenciales en ${OUT}`);
  console.log(`ana=${ana} bruno=${bruno} carla=${carla} diego=${diego}`);
})().catch((e) => { console.error("Error:", e.message); process.exit(1); });
