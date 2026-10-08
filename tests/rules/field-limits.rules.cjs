// Tamaños y campos permitidos (auditoría A-03): perfiles, posts,
// comentarios, chats, mensajes y reportes. Las formas válidas son las que
// escriben los servicios del cliente.
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const {
  doc, collection, setDoc, addDoc, updateDoc, writeBatch, serverTimestamp, Timestamp, increment
} = require("firebase/firestore");

const A = "aaaUser1";
const B = "bbbUser2";
const S = "steam:76561198000000000";
const CHAT = [A, B].sort().join("_");
const longText = (n) => "x".repeat(n);
const game = (i) => ({ id: i, name: `Juego ${i}`, image: "https://media.rawg.io/x.jpg" });
const future = () => Timestamp.fromDate(new Date("2099-01-01"));

module.exports = async ({ env, test }) => {
  const db = (uid) => env.authenticatedContext(uid).firestore();
  // profileService.createUserProfile: users + publicProfiles en un batch
  const createProfile = (uid, data) => {
    const s = db(uid);
    const batch = writeBatch(s);
    const user = { ...data, usernameLower: data.username.toLowerCase(), createdAt: serverTimestamp() };
    batch.set(doc(s, "users", uid), user);
    batch.set(doc(s, "publicProfiles", uid), { avatar: null, region: null, ...user });
    return batch.commit();
  };

  // ---------- users / publicProfiles ----------
  await test("registro con correo (username + región)", () =>
    assertSucceeds(createProfile(A, { username: "ana", region: "México" })));

  await test("primer login con Steam (avatar + link de Steam)", () =>
    assertSucceeds(createProfile(S, {
      username: "steamer", avatar: "https://avatars.steamstatic.com/a.jpg", region: null,
      links: ["https://steamcommunity.com/profiles/76561198000000000"]
    })));

  await test("perfil con createdAt del cliente: rechazado", () => {
    const s = db(B);
    return assertFails(setDoc(doc(s, "users", B), { username: "bea", usernameLower: "bea", createdAt: Timestamp.now() }));
  });

  await test("perfil con campos extra: rechazado", () => {
    const s = db(B);
    return assertFails(setDoc(doc(s, "users", B), { username: "bea", usernameLower: "bea", createdAt: serverTimestamp(), rol: "admin" }));
  });

  await test("username de 41 caracteres: rechazado", () =>
    assertFails(createProfile(B, { username: longText(41) })));

  // updateUserProfile: batch.update(users) + set(publicProfiles, merge)
  const updateProfile = (uid, data) => {
    const s = db(uid);
    const batch = writeBatch(s);
    batch.update(doc(s, "users", uid), data);
    batch.set(doc(s, "publicProfiles", uid), data, { merge: true });
    return batch.commit();
  };
  const editable = { username: "ana", usernameLower: "ana", links: [], description: "hola", games: [], region: "México" };

  await test("editar perfil con 12 juegos y 10 redes", () =>
    assertSucceeds(updateProfile(A, {
      ...editable,
      games: Array.from({ length: 12 }, (_, i) => game(i)),
      links: Array.from({ length: 10 }, (_, i) => `https://x.com/u${i}`)
    })));

  // El peor caso real: updateUserProfile con preferencias de compatibilidad
  // (users + publicProfiles + matchProfiles en un batch; límite de 1000
  // expresiones por operación)
  await test("guardar perfil completo: 12 juegos, 10 redes y preferencias", () => {
    const s = db(A);
    const batch = writeBatch(s);
    const data = {
      ...editable,
      games: Array.from({ length: 12 }, (_, i) => game(i + 50)),
      links: Array.from({ length: 10 }, (_, i) => `https://x.com/z${i}`)
    };
    batch.update(doc(s, "users", A), data);
    batch.set(doc(s, "publicProfiles", A), data, { merge: true });
    batch.set(doc(s, "matchProfiles", A), {
      preferences: {
        schedule: ["evening"], platforms: ["pc"], requiresMic: true, groupSize: "squad",
        skillLevel: "competitive", languages: ["es", "en"], values: ["no_rage"]
      },
      gameIds: data.games.map((g) => g.id), region: "MX", updatedAt: serverTimestamp()
    });
    return assertSucceeds(batch.commit());
  });

  await test("13 juegos: rechazado", () =>
    assertFails(updateProfile(A, { ...editable, games: Array.from({ length: 13 }, (_, i) => game(i)) })));

  await test("juego con campos extra: rechazado", () =>
    assertFails(updateProfile(A, { ...editable, games: [{ ...game(1), basura: longText(100) }] })));

  await test("juego con nombre de 2500 caracteres: rechazado", () =>
    assertFails(updateProfile(A, { ...editable, games: [{ ...game(1), name: longText(2500) }] })));

  await test("juego con un mapa anidado: rechazado", () =>
    assertFails(updateProfile(A, { ...editable, games: [{ ...game(1), name: { a: 1 } }] })));

  await test("11 redes: rechazado", () =>
    assertFails(updateProfile(A, { ...editable, links: Array.from({ length: 11 }, (_, i) => `https://x.com/u${i}`) })));

  await test("redes que suman más de 3000 caracteres: rechazado", () =>
    assertFails(updateProfile(A, { ...editable, links: [`https://x.com/${longText(1600)}`, `https://x.com/${longText(1600)}`] })));

  await test("red que no es texto: rechazado", () =>
    assertFails(updateProfile(A, { ...editable, links: ["https://x.com/a", { url: "x" }] })));

  await test("descripción de 501: rechazado", () =>
    assertFails(updateProfile(A, { ...editable, description: longText(501) })));

  await test("presencia: lastSeen con la hora del servidor en users y publicProfiles", () => {
    const s = db(A);
    const batch = writeBatch(s);
    batch.update(doc(s, "users", A), { lastSeen: serverTimestamp() });
    batch.update(doc(s, "publicProfiles", A), { lastSeen: serverTimestamp() });
    return assertSucceeds(batch.commit());
  });

  await test("idioma de la interfaz (solo users)", () =>
    assertSucceeds(updateDoc(doc(db(A), "users", A), { language: "pt" })));

  await test("avatar nuevo (profileImageService)", () =>
    assertSucceeds(updateProfile(A, { avatar: "https://firebasestorage.googleapis.com/v0/b/x/o/avatars%2Fa?alt=media&v=1" })));

  await test("avatar de 3000 caracteres: rechazado", () =>
    assertFails(updateProfile(A, { avatar: `https://x.com/${longText(3000)}` })));

  await test("no se puede cambiar createdAt de users", () =>
    assertFails(updateDoc(doc(db(A), "users", A), { createdAt: Timestamp.now() })));

  // Documento antiguo con un campo que ya no se usa: se sigue pudiendo editar
  await env.withSecurityRulesDisabled(async (ctx) => {
    const s = ctx.firestore();
    await setDoc(doc(s, "users", B), { username: "bea", usernameLower: "bea", createdAt: Timestamp.now(), campoViejo: "x" });
    await setDoc(doc(s, "publicProfiles", B), { username: "bea", usernameLower: "bea", createdAt: Timestamp.now() });
  });
  await test("documento antiguo con un campo viejo: se puede editar", () =>
    assertSucceeds(updateProfile(B, { ...editable, username: "bea", usernameLower: "bea" })));

  // ---------- posts ----------
  const postData = {
    game: "Valorant", platform: "PC", playersNeeded: 3, comments: "Ranked", image: "https://media.rawg.io/v.jpg",
    logo: null, clip: null, portada: null, platforms: ["PC", "PlayStation 5"], multiplatform: false,
    scheduledAt: null, requiresMic: true, skillLevel: "competitive", language: "es"
  };
  // postService.createPost: post + grupo + game_stats en un batch
  const createPost = (uid, id, data) => {
    const s = db(uid);
    const batch = writeBatch(s);
    batch.set(doc(s, "posts", id), { ...data, userId: uid, interestedCount: 0, createdAt: serverTimestamp() });
    batch.set(doc(s, "group_chats", id), { postId: id, participants: [uid], active: true, lastMessage: "", lastMessageAt: null, lastSenderId: null, createdAt: serverTimestamp() });
    return batch.commit();
  };

  await test("publicar (forma de useCreatePost) con la región del perfil", () =>
    assertSucceeds(createPost(A, "p1", { ...postData, authorRegion: "México" })));

  await test("publicar con una región que no es la del perfil: rechazado", () =>
    assertFails(createPost(A, "p2", { ...postData, authorRegion: "Japón" })));

  await test("publicar con campos extra: rechazado", () =>
    assertFails(createPost(A, "p3", { ...postData, authorRegion: "México", username: "otro" })));

  await test("juego de 201 caracteres: rechazado", () =>
    assertFails(createPost(A, "p4", { ...postData, authorRegion: "México", game: longText(201) })));

  await test("21 jugadores: rechazado", () =>
    assertFails(createPost(A, "p5", { ...postData, authorRegion: "México", playersNeeded: 21 })));

  await test("11 plataformas: rechazado", () =>
    assertFails(createPost(A, "p6", { ...postData, authorRegion: "México", platforms: Array(11).fill("PC") })));

  await test("editar el post (forma de updatePost)", () =>
    assertSucceeds(updateDoc(doc(db(A), "posts", "p1"), { ...postData, comments: "Casual", playersNeeded: 2 })));

  await test("editar authorRegion: rechazado", () =>
    assertFails(updateDoc(doc(db(A), "posts", "p1"), { authorRegion: "Japón" })));

  await test("editar agregando un campo nuevo: rechazado", () =>
    assertFails(updateDoc(doc(db(A), "posts", "p1"), { spam: longText(1000) })));

  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "posts", "viejo"), { userId: A, game: "Dota 2", interestedCount: 0, createdAt: Timestamp.now(), region: "México" });
  });
  await test("post antiguo con un campo viejo: se puede editar", () =>
    assertSucceeds(updateDoc(doc(db(A), "posts", "viejo"), { comments: "nuevo texto" })));

  // ---------- comentarios ----------
  const comment = { postId: "p1", text: "Me apunto", userId: B, mediaUrl: "", mediaType: "", mediaPath: "", createdAt: serverTimestamp() };

  await test("comentar (forma de commentsService)", () =>
    assertSucceeds(addDoc(collection(db(B), "post_comments"), comment)));

  await test("comentario con imagen", () =>
    assertSucceeds(addDoc(collection(db(B), "post_comments"), {
      ...comment, mediaUrl: "https://firebasestorage.googleapis.com/x", mediaType: "image", mediaPath: `comments/${B}/1_a.png`
    })));

  // mediaPath: lo borran cleanupCommentMedia y deleteAccount (auditoría C-02)
  for (const [name, mediaPath] of [
    ["el avatar de otro", `avatars/${A}`],
    ["un adjunto de un chat ajeno", `chats/${CHAT}/${A}/1_factura.pdf`],
    ["la carpeta de comentarios de otro", `comments/${A}/1_foto.png`],
    ["una subcarpeta propia", `comments/${B}/x/1_foto.png`],
    ["toda su carpeta (sin archivo)", `comments/${B}/`],
    ["un prefijo engañoso", `comments/${B}x/1_foto.png`]
  ]) {
    await test(`comentario con mediaPath hacia ${name}: rechazado`, () =>
      assertFails(addDoc(collection(db(B), "post_comments"), { ...comment, mediaUrl: "https://x", mediaType: "image", mediaPath })));
  }

  await test("comentario de una cuenta de Steam con su propio archivo", () =>
    assertSucceeds(addDoc(collection(db(S), "post_comments"), {
      ...comment, userId: S, mediaUrl: "https://x", mediaType: "video", mediaPath: `comments/${S}/1700000000_clip.mp4`
    })));

  await test("comentario con campos extra: rechazado", () =>
    assertFails(addDoc(collection(db(B), "post_comments"), { ...comment, extra: "x" })));

  await test("comentario con tipo de medio inventado: rechazado", () =>
    assertFails(addDoc(collection(db(B), "post_comments"), { ...comment, mediaType: "exe" })));

  await test("comentario con fecha del cliente: rechazado", () =>
    assertFails(addDoc(collection(db(B), "post_comments"), { ...comment, createdAt: future() })));

  // ---------- chats y mensajes ----------
  await test("abrir un chat (forma de createOrGetChat)", () =>
    assertSucceeds(setDoc(doc(db(A), "chats", CHAT), { participants: [A, B], lastMessage: "", lastMessageAt: null, createdAt: serverTimestamp() })));

  await test("abrir un chat con campos extra: rechazado", () =>
    assertFails(setDoc(doc(db(A), "chats", `${A}_x`), { participants: [A, "x"], lastMessage: "", extra: longText(100) })));

  const send = (sender, message, lastMessageAt = serverTimestamp()) => {
    const s = db(sender);
    const batch = writeBatch(s);
    batch.set(doc(collection(s, "chats", CHAT, "messages")), message);
    batch.update(doc(s, "chats", CHAT), { lastMessage: message.text || "📷 Imagen", lastSenderId: sender, lastMessageAt });
    return batch.commit();
  };

  await test("mensaje de texto", () =>
    assertSucceeds(send(A, { text: "hola", senderId: A, createdAt: serverTimestamp() })));

  await test("mensaje con adjunto (forma de messageMedia)", () =>
    assertSucceeds(send(B, {
      text: "", senderId: B, createdAt: serverTimestamp(),
      mediaUrl: "https://firebasestorage.googleapis.com/x", mediaType: "file", fileName: "partida.pdf", fileSize: 12345
    })));

  await test("mensaje con fecha del cliente (2099): rechazado", () =>
    assertFails(send(A, { text: "arriba", senderId: A, createdAt: future() })));

  await test("mensaje con campos extra: rechazado", () =>
    assertFails(send(A, { text: "hola", senderId: A, createdAt: serverTimestamp(), extra: "x" })));

  await test("mensaje con fileSize de texto: rechazado", () =>
    assertFails(send(A, { text: "", senderId: A, createdAt: serverTimestamp(), mediaUrl: "https://x", mediaType: "file", fileName: "a", fileSize: "grande" })));

  await test("lastMessageAt del cliente: rechazado", () =>
    assertFails(send(A, { text: "hola", senderId: A, createdAt: serverTimestamp() }, future())));

  await test("mensaje en el chat de la partida", () => {
    const s = db(A);
    const batch = writeBatch(s);
    batch.set(doc(collection(s, "group_chats", "p1", "messages")), { text: "a jugar", senderId: A, createdAt: serverTimestamp() });
    batch.update(doc(s, "group_chats", "p1"), { lastMessage: "a jugar", lastSenderId: A, lastMessageAt: serverTimestamp() });
    return assertSucceeds(batch.commit());
  });

  await test("mensaje de partida con fecha del cliente: rechazado", () =>
    assertFails(addDoc(collection(db(A), "group_chats", "p1", "messages"), { text: "x", senderId: A, createdAt: future() })));

  await test("último mensaje del grupo firmado por otro: rechazado", () =>
    assertFails(updateDoc(doc(db(A), "group_chats", "p1"), { lastMessage: "x", lastSenderId: B, lastMessageAt: serverTimestamp() })));

  // ---------- Quiero jugar (se lee sin sesión) ----------
  const interest = (uid, postId, extra = {}) => {
    const s2 = db(uid);
    const batch = writeBatch(s2);
    batch.set(doc(s2, "post_interested", `${postId}_${uid}`), { postId, userId: uid, createdAt: serverTimestamp(), ...extra });
    batch.update(doc(s2, "posts", postId), { interestedCount: increment(1) });
    return batch.commit();
  };

  await test("Quiero jugar (forma de interestService)", () => assertSucceeds(interest(B, "p1")));

  await test("Quiero jugar con campos extra: rechazado", () =>
    assertFails(interest(S, "p1", { basura: longText(1000) })));

  await test("Quiero jugar con fecha del cliente: rechazado", () =>
    assertFails(interest(S, "p1", { createdAt: Timestamp.now() })));

  // ---------- solicitudes de amistad ----------
  const request = (from, to, extra = {}) =>
    setDoc(doc(db(from), "friend_requests", `${from}_${to}`), { senderId: from, receiverId: to, status: "pending", createdAt: serverTimestamp(), ...extra });

  await test("solicitud de amistad (forma de friendService)", () => assertSucceeds(request(B, S)));

  await test("solicitud con campos extra: rechazado", () =>
    assertFails(request(S, A, { mensaje: longText(1000) })));

  await test("solicitud con fecha del cliente: rechazado", () =>
    assertFails(request(S, A, { createdAt: future() })));

  await test("reenvío tras un rechazo con la fecha del cliente: rechazado", async () => {
    await assertSucceeds(updateDoc(doc(db(S), "friend_requests", `${B}_${S}`), { status: "rejected" }));
    // Pasadas las 24 h de espera (auditoría M-12)
    await env.withSecurityRulesDisabled((ctx) =>
      updateDoc(doc(ctx.firestore(), "friend_requests", `${B}_${S}`), { createdAt: Timestamp.fromMillis(Date.now() - 25 * 3600 * 1000) }));
    await assertFails(request(B, S, { createdAt: future() }));
    await assertSucceeds(request(B, S));
  });

  await test("tras terminar una amistad (aceptada) se puede reenviar en seguida", async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      updateDoc(doc(ctx.firestore(), "friend_requests", `${B}_${S}`), { status: "accepted", createdAt: Timestamp.now() }));
    await assertSucceeds(request(B, S));
  });

  await test("tras un rechazo reciente (hace 23 h): rechazado", async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      updateDoc(doc(ctx.firestore(), "friend_requests", `${B}_${S}`), { status: "rejected", createdAt: Timestamp.fromMillis(Date.now() - 23 * 3600 * 1000) }));
    await assertFails(request(B, S));
  });

  // ---------- bloqueos ----------
  const block = (by, target, extra = {}) =>
    setDoc(doc(db(by), "blocks", `${by}_${target}`), { participants: [by, target], blockerId: by, blockedId: target, createdAt: serverTimestamp(), ...extra });

  await test("bloquear (forma de blockService)", () => assertSucceeds(block(S, "zzz1")));

  await test("bloqueo con campos extra: rechazado", () =>
    assertFails(block(S, "zzz2", { motivo: longText(1000) })));

  await test("bloqueo con fecha del cliente: rechazado", () =>
    assertFails(block(S, "zzz3", { createdAt: Timestamp.now() })));

  // ---------- chat de la partida al publicar ----------
  await test("grupo con campos extra al publicar: rechazado", () => {
    const s2 = db(A);
    const batch = writeBatch(s2);
    batch.set(doc(s2, "posts", "p9"), { ...postData, authorRegion: "México", userId: A, interestedCount: 0, createdAt: serverTimestamp() });
    batch.set(doc(s2, "group_chats", "p9"), { postId: "p9", participants: [A], active: true, lastMessage: "", lastMessageAt: null, lastSenderId: null, createdAt: serverTimestamp(), extra: longText(1000) });
    return assertFails(batch.commit());
  });

  await test("grupo con un último mensaje inventado al publicar: rechazado", () => {
    const s2 = db(A);
    const batch = writeBatch(s2);
    batch.set(doc(s2, "posts", "p10"), { ...postData, authorRegion: "México", userId: A, interestedCount: 0, createdAt: serverTimestamp() });
    batch.set(doc(s2, "group_chats", "p10"), { postId: "p10", participants: [A], active: true, lastMessage: "hola", lastMessageAt: null, lastSenderId: B, createdAt: serverTimestamp() });
    return assertFails(batch.commit());
  });

  // ---------- usernameLower (búsqueda) ----------
  await test("usernameLower que no corresponde al nombre: rechazado", () =>
    assertFails(updateProfile(A, { username: "ana", usernameLower: "admin" })));

  await test("cambiar el nombre con su usernameLower correcto", () =>
    assertSucceeds(updateProfile(A, { username: "AnaGamer", usernameLower: "anagamer" })));

  // ---------- reportes ----------
  const report = { reporterId: B, targetType: "user", targetId: A, reason: "spam", note: "", status: "pending", createdAt: serverTimestamp(), reviewedAt: null };

  await test("reportar (forma de reportService)", () =>
    assertSucceeds(addDoc(collection(db(B), "reports"), report)));

  await test("reporte con campos extra: rechazado", () =>
    assertFails(addDoc(collection(db(B), "reports"), { ...report, extra: longText(1000) })));

  await test("reporte con fecha del cliente: rechazado", () =>
    assertFails(addDoc(collection(db(B), "reports"), { ...report, createdAt: Timestamp.now() })));

  await test("reporte ya revisado: rechazado", () =>
    assertFails(addDoc(collection(db(B), "reports"), { ...report, reviewedAt: Timestamp.now() })));
};
