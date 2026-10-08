// Verificación de correo: crear contenido social pide email_verified, salvo
// las cuentas de Steam (custom token). Cada escritura se intenta primero
// sin verificar (falla) y luego verificada (pasa), con los mismos datos, para
// que el único motivo del fallo sea la verificación.
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const {
  doc, collection, setDoc, updateDoc, deleteDoc, writeBatch, runTransaction,
  increment, arrayUnion, serverTimestamp, Timestamp
} = require("firebase/firestore");

const AUTHOR = "aaaAuthor";
const ME = "bbbMe";
const OTHER = "cccOther";
const POST = "post1";

module.exports = async ({ env, test }) => {
  // Tokens como los de Firebase Auth según el método de inicio de sesión
  const as = (uid, kind) => {
    const claims = {
      unverified: { email: `${uid}@x.com`, email_verified: false, firebase: { sign_in_provider: "password" } },
      verified: { email: `${uid}@x.com`, email_verified: true, firebase: { sign_in_provider: "password" } },
      google: { email: `${uid}@gmail.com`, email_verified: true, firebase: { sign_in_provider: "google.com" } },
      steam: { firebase: { sign_in_provider: "custom" } }
    }[kind];
    return env.authenticatedContext(uid, claims).firestore();
  };

  const seed = () => env.withSecurityRulesDisabled(async (ctx) => {
    const f = ctx.firestore();
    await setDoc(doc(f, "posts", POST), { userId: AUTHOR, game: "Valorant", interestedCount: 0, createdAt: Timestamp.now() });
    await setDoc(doc(f, "group_chats", POST), { postId: POST, participants: [AUTHOR, ME], active: true });
    await setDoc(doc(f, "chats", [ME, OTHER].sort().join("_")), { participants: [ME, OTHER].sort(), lastMessage: "" });
    await setDoc(doc(f, "friend_requests", `${OTHER}_${ME}`), { senderId: OTHER, receiverId: ME, status: "pending" });
    await setDoc(doc(f, "friend_requests", `${ME}_${AUTHOR}`), { senderId: ME, receiverId: AUTHOR, status: "rejected" });
  });
  await seed();

  // Igual que postService.createPost
  const createPost = (f, uid, id) => {
    const batch = writeBatch(f);
    batch.set(doc(f, "posts", id), { userId: uid, game: "Tetris", comments: "x", scheduledAt: null, interestedCount: 0, createdAt: serverTimestamp() });
    batch.set(doc(f, "group_chats", id), { postId: id, participants: [uid], active: true });
    batch.set(doc(f, "game_stats", "Tetris"), { game: "Tetris", postCount: increment(1), updatedAt: serverTimestamp(), lastPostId: id }, { merge: true });
    return batch.commit();
  };
  // Igual que interestService.toggleInterested (marcar)
  const markInterest = (f, uid) => runTransaction(f, async (tx) => {
    const ref = doc(f, "post_interested", `${POST}_${uid}`);
    await tx.get(ref);
    tx.set(ref, { postId: POST, userId: uid, createdAt: serverTimestamp() });
    tx.update(doc(f, "posts", POST), { interestedCount: increment(1) });
    tx.update(doc(f, "group_chats", POST), { participants: arrayUnion(uid) });
  });
  const chatId = [ME, OTHER].sort().join("_");

  const pair = async (name, write) => {
    await test(`Sin verificar: no puede ${name}`, () => assertFails(write("unverified")));
    await test(`Verificado: sí puede ${name}`, () => assertSucceeds(write("verified")));
  };

  // ---------- Crear contenido social ----------
  let n = 0;
  await pair("publicar una partida", (kind) => createPost(as(ME, kind), ME, `p${++n}`));
  await pair("comentar", (kind) => setDoc(doc(collection(as(ME, kind), "post_comments")),
    { postId: POST, userId: ME, text: "hola", createdAt: serverTimestamp() }));
  await pair("escribir en el chat de partida", (kind) => setDoc(doc(collection(as(ME, kind), "group_chats", POST, "messages")),
    { senderId: ME, text: "hola", createdAt: serverTimestamp() }));
  await pair("escribir en un chat 1:1 (mensaje y último mensaje)", (kind) => {
    const f = as(ME, kind);
    const batch = writeBatch(f);
    batch.set(doc(collection(f, "chats", chatId, "messages")), { senderId: ME, text: "hola", createdAt: serverTimestamp() });
    batch.update(doc(f, "chats", chatId), { lastMessage: "hola", lastSenderId: ME, lastMessageAt: serverTimestamp() });
    return batch.commit();
  });
  await pair("abrir un chat 1:1 nuevo", (kind) => setDoc(doc(as(ME, kind), "chats", `${ME}_zzz${kind}`),
    { participants: [ME, `zzz${kind}`], lastMessage: "", lastMessageAt: null, createdAt: serverTimestamp() }));
  // Aviso del chat que se acaba de abrir (las notificaciones van ligadas a
  // una relación real: notifications.rules.cjs)
  await pair("mandar una notificación", (kind) => setDoc(doc(collection(as(ME, kind), "notifications")),
    { userId: `zzz${kind}`, senderId: ME, type: "message", read: false, createdAt: serverTimestamp(), relatedId: `${ME}_zzz${kind}` }));
  await pair("enviar una solicitud de amistad", (kind) => setDoc(doc(as(ME, kind), "friend_requests", `${ME}_ddd${kind}`),
    { senderId: ME, receiverId: `ddd${kind}`, status: "pending", createdAt: serverTimestamp() }));
  await pair("escribir una guía", (kind) => setDoc(doc(as(ME, kind), "guides", `g${kind}`), {
    authorId: ME, game: "Valorant", title: "Guía de Jett", type: "original", status: "pending", content: "<p>Hola</p>",
    coverImage: null, youtubeVideoId: null, externalUrl: null, externalPreview: null, reviewNote: null, reviewedAt: null,
    createdAt: serverTimestamp()
  }));

  await test("Sin verificar: no puede reenviar una solicitud rechazada", () =>
    assertFails(updateDoc(doc(as(ME, "unverified"), "friend_requests", `${ME}_${AUTHOR}`), { status: "pending", createdAt: serverTimestamp() })));
  await test("Verificado: sí puede reenviarla", () =>
    assertSucceeds(updateDoc(doc(as(ME, "verified"), "friend_requests", `${ME}_${AUTHOR}`), { status: "pending", createdAt: serverTimestamp() })));

  const accept = (kind) => {
    const f = as(ME, kind);
    const batch = writeBatch(f);
    batch.set(doc(f, "friends", [ME, OTHER].sort().join("_")), { users: [ME, OTHER].sort(), createdAt: serverTimestamp() });
    batch.update(doc(f, "friend_requests", `${OTHER}_${ME}`), { status: "accepted" });
    return batch.commit();
  };
  await test("Sin verificar: no puede aceptar una solicitud (crear la amistad)", () => assertFails(accept("unverified")));
  await test("Sin verificar: sí puede rechazarla", async () => {
    await assertSucceeds(updateDoc(doc(as(ME, "unverified"), "friend_requests", `${OTHER}_${ME}`), { status: "rejected" }));
    await env.withSecurityRulesDisabled((ctx) => updateDoc(doc(ctx.firestore(), "friend_requests", `${OTHER}_${ME}`), { status: "pending" }));
  });
  await test("Verificado: sí puede aceptarla", () => assertSucceeds(accept("verified")));

  await test("Sin verificar: no puede marcar Quiero jugar", () => assertFails(markInterest(as(OTHER, "unverified"), OTHER)));
  await test("Verificado: sí puede marcar Quiero jugar", () => assertSucceeds(markInterest(as(OTHER, "verified"), OTHER)));

  // ---------- Excepciones ----------
  await test("Google (email_verified true) publica", () => createPost(as(ME, "google"), ME, "pGoogle").then(() => true));
  await test("Steam (custom token, sin correo) publica", () => assertSucceeds(createPost(as(ME, "steam"), ME, "pSteam")));
  await test("Steam comenta", () => assertSucceeds(setDoc(doc(collection(as(ME, "steam"), "post_comments")),
    { postId: POST, userId: ME, text: "hola", createdAt: serverTimestamp() })));

  // ---------- Lo que no pide verificación ----------
  const fresh = "eeeFresh";
  await test("Sin verificar: crea y edita su perfil (users y publicProfiles)", async () => {
    const f = as(fresh, "unverified");
    const batch = writeBatch(f);
    batch.set(doc(f, "users", fresh), { username: "Nuevo", usernameLower: "nuevo", region: null, createdAt: serverTimestamp() });
    batch.set(doc(f, "publicProfiles", fresh), { username: "Nuevo", usernameLower: "nuevo", avatar: null, region: null, createdAt: serverTimestamp() });
    // Nombre único (usernames.rules.cjs)
    batch.set(doc(f, "usernames", "nuevo"), { uid: fresh, createdAt: serverTimestamp() });
    await assertSucceeds(batch.commit());
    await assertSucceeds(updateDoc(doc(f, "users", fresh), { description: "hola" }));
  });
  await test("Sin verificar: puede reportar (siempre debe poder)", () =>
    assertSucceeds(setDoc(doc(collection(as(fresh, "unverified"), "reports")),
      { reporterId: fresh, targetType: "user", targetId: OTHER, reason: "spam", note: "", status: "pending", createdAt: serverTimestamp(), reviewedAt: null })));
  await test("Sin verificar: puede bloquear", () =>
    assertSucceeds(setDoc(doc(as(fresh, "unverified"), "blocks", `${fresh}_${OTHER}`),
      { participants: [fresh, OTHER], blockerId: fresh, blockedId: OTHER, createdAt: serverTimestamp() })));
  await test("Sin verificar: puede leer el feed y los comentarios", async () => {
    const f = as(fresh, "unverified");
    const { getDocs, query, limit } = require("firebase/firestore");
    await assertSucceeds(getDocs(query(collection(f, "posts"), limit(5))));
    await assertSucceeds(getDocs(query(collection(f, "post_comments"), limit(5))));
  });
  await test("Sin verificar: puede borrar su propio comentario", async () => {
    let id;
    await env.withSecurityRulesDisabled(async (ctx) => {
      const ref = doc(collection(ctx.firestore(), "post_comments"));
      id = ref.id;
      await setDoc(ref, { postId: POST, userId: fresh, text: "viejo", createdAt: Timestamp.now() });
    });
    await assertSucceeds(deleteDoc(doc(as(fresh, "unverified"), "post_comments", id)));
  });
};
