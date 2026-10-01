// Contadores atados a su acción y createdAt del servidor
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const {
  doc, collection, getDoc, setDoc, updateDoc, deleteDoc, writeBatch, runTransaction,
  increment, arrayUnion, arrayRemove, serverTimestamp, Timestamp
} = require("firebase/firestore");

const AUTHOR = "aaaAuthor";
const FRIEND = "bbbFriend";
const OTHER = "cccOther";
const POST = "post1";
const statsId = (game) => encodeURIComponent(game);

module.exports = async ({ env, test, expect }) => {
  const db = (uid) => env.authenticatedContext(uid).firestore();

  await env.withSecurityRulesDisabled(async (ctx) => {
    const f = ctx.firestore();
    await setDoc(doc(f, "posts", POST), { userId: AUTHOR, game: "Valorant", interestedCount: 0, createdAt: Timestamp.now() });
    await setDoc(doc(f, "group_chats", POST), { postId: POST, participants: [AUTHOR], active: true });
    // Documento viejo, sin lastPostId
    await setDoc(doc(f, "game_stats", statsId("Valorant")), { game: "Valorant", postCount: 1 });
  });

  const count = async () => {
    let value;
    await env.withSecurityRulesDisabled(async (ctx) => {
      value = (await getDoc(doc(ctx.firestore(), "posts", POST))).data().interestedCount;
    });
    return value;
  };

  // Igual que interestService.toggleInterested
  const markInterest = (uid) => {
    const f = db(uid);
    return runTransaction(f, async (tx) => {
      const ref = doc(f, "post_interested", `${POST}_${uid}`);
      await tx.get(ref);
      tx.set(ref, { postId: POST, userId: uid, createdAt: serverTimestamp() });
      tx.update(doc(f, "posts", POST), { interestedCount: increment(1) });
      if (uid !== AUTHOR) tx.update(doc(f, "group_chats", POST), { participants: arrayUnion(uid) });
    });
  };
  const unmarkInterest = (uid) => {
    const f = db(uid);
    return runTransaction(f, async (tx) => {
      const ref = doc(f, "post_interested", `${POST}_${uid}`);
      const group = doc(f, "group_chats", POST);
      await Promise.all([tx.get(ref), tx.get(group)]);
      tx.delete(ref);
      tx.update(doc(f, "posts", POST), { interestedCount: increment(-1) });
      if (uid !== AUTHOR) tx.update(group, { participants: arrayRemove(uid) });
    });
  };

  // Igual que postService.createPost
  const createPost = (uid, id, game, extra = {}) => {
    const f = db(uid);
    const batch = writeBatch(f);
    batch.set(doc(f, "posts", id), {
      userId: uid, game, comments: "x", scheduledAt: null, interestedCount: 0, createdAt: serverTimestamp(), ...extra
    });
    batch.set(doc(f, "group_chats", id), { postId: id, participants: [uid], active: true });
    batch.set(doc(f, "game_stats", statsId(game)),
      { game, postCount: increment(1), updatedAt: serverTimestamp(), lastPostId: id }, { merge: true });
    return batch.commit();
  };

  // Igual que postService.deletePost
  const deletePost = (uid, id, game) => {
    const f = db(uid);
    const batch = writeBatch(f);
    batch.update(doc(f, "group_chats", id), { active: false });
    batch.set(doc(f, "game_stats", statsId(game)),
      { game, postCount: increment(-1), updatedAt: serverTimestamp(), lastPostId: id }, { merge: true });
    batch.delete(doc(f, "posts", id));
    return batch.commit();
  };

  // ================= R2: interestedCount =================
  await test("Marcar Me interesa (transacción completa) sube el contador a 1", async () => {
    await assertSucceeds(markInterest(FRIEND));
    if (await count() !== 1) throw new Error(`contador ${await count()}`);
  });

  await test("No se puede marcar dos veces (el interés ya existe)", () => assertFails(markInterest(FRIEND)));

  await test("No se puede subir el contador sin crear el interés", () =>
    assertFails(updateDoc(doc(db(OTHER), "posts", POST), { interestedCount: increment(1) })));

  await test("No se puede bajar el contador sin borrar el interés", () =>
    assertFails(updateDoc(doc(db(OTHER), "posts", POST), { interestedCount: increment(-1) })));

  await test("No se puede crear el interés sin mover el contador", () =>
    assertFails(setDoc(doc(db(OTHER), "post_interested", `${POST}_${OTHER}`), { postId: POST, userId: OTHER })));

  await test("No se puede crear el interés con un id aleatorio (aunque mueva el contador)", () => {
    const f = db(OTHER);
    return assertFails(runTransaction(f, async (tx) => {
      tx.set(doc(f, "post_interested", "aleatorio123"), { postId: POST, userId: OTHER });
      tx.update(doc(f, "posts", POST), { interestedCount: increment(1) });
    }));
  });

  await test("No se puede crear el interés a nombre de otro usuario", () => {
    const f = db(OTHER);
    return assertFails(runTransaction(f, async (tx) => {
      tx.set(doc(f, "post_interested", `${POST}_${AUTHOR}`), { postId: POST, userId: AUTHOR });
      tx.update(doc(f, "posts", POST), { interestedCount: increment(1) });
    }));
  });

  await test("No se puede subir el contador de 2 en 2", () => {
    const f = db(OTHER);
    return assertFails(runTransaction(f, async (tx) => {
      tx.set(doc(f, "post_interested", `${POST}_${OTHER}`), { postId: POST, userId: OTHER });
      tx.update(doc(f, "posts", POST), { interestedCount: increment(2) });
    }));
  });

  await test("El autor marca su propio post (sin entrar al grupo, ya está)", async () => {
    await assertSucceeds(markInterest(AUTHOR));
    if (await count() !== 2) throw new Error(`contador ${await count()}`);
  });

  await test("Quitar Me interesa (transacción completa) baja el contador", async () => {
    await assertSucceeds(unmarkInterest(FRIEND));
    if (await count() !== 1) throw new Error(`contador ${await count()}`);
  });

  await test("El dueño no puede tocar interestedCount al editar", () =>
    assertFails(updateDoc(doc(db(AUTHOR), "posts", POST), { interestedCount: 50 })));

  // ================= R3: createdAt =================
  await test("Publicar con createdAt del servidor + grupo + game_stats (juego existente)", () =>
    assertSucceeds(createPost(FRIEND, "post2", "Valorant")));

  await test("Publicar el primer post de un juego nuevo crea su game_stats", () =>
    assertSucceeds(createPost(FRIEND, "post3", "Juego Nuevo/Raro")));

  await test("No se puede publicar con createdAt del cliente en el futuro", () =>
    assertFails(createPost(OTHER, "post4", "Valorant", { createdAt: Timestamp.fromMillis(Date.now() + 86400000) })));

  await test("No se puede publicar sin createdAt", () => {
    const f = db(OTHER);
    const batch = writeBatch(f);
    batch.set(doc(f, "posts", "post5"), { userId: OTHER, game: "Valorant", interestedCount: 0 });
    batch.set(doc(f, "group_chats", "post5"), { postId: "post5", participants: [OTHER], active: true });
    return assertFails(batch.commit());
  });

  await test("El dueño no puede cambiar createdAt al editar", () =>
    assertFails(updateDoc(doc(db(FRIEND), "posts", "post2"), { createdAt: Timestamp.fromMillis(Date.now() + 86400000) })));

  await test("El dueño no puede cambiar el juego al editar", () =>
    assertFails(updateDoc(doc(db(FRIEND), "posts", "post2"), { game: "Otro juego" })));

  await test("El dueño sí puede editar la descripción", () =>
    assertSucceeds(updateDoc(doc(db(FRIEND), "posts", "post2"), { comments: "editado" })));

  // ================= R2: game_stats =================
  await test("No se puede subir postCount sin publicar un post", () =>
    assertFails(setDoc(doc(db(OTHER), "game_stats", statsId("Valorant")),
      { postCount: increment(1), updatedAt: serverTimestamp(), lastPostId: "noExiste" }, { merge: true })));

  await test("No se puede subir postCount citando un post existente", () =>
    assertFails(setDoc(doc(db(FRIEND), "game_stats", statsId("Valorant")),
      { postCount: increment(1), updatedAt: serverTimestamp(), lastPostId: "post2" }, { merge: true })));

  await test("No se puede crear un juego inventado en game_stats", () =>
    assertFails(setDoc(doc(db(OTHER), "game_stats", statsId("Inventado")),
      { game: "Inventado", postCount: 1, updatedAt: serverTimestamp(), lastPostId: "x" })));

  await test("No se puede sumar a otro juego al publicar (game no coincide)", () => {
    const f = db(OTHER);
    const batch = writeBatch(f);
    batch.set(doc(f, "posts", "post6"), { userId: OTHER, game: "Valorant", interestedCount: 0, createdAt: serverTimestamp() });
    batch.set(doc(f, "group_chats", "post6"), { postId: "post6", participants: [OTHER], active: true });
    batch.set(doc(f, "game_stats", statsId("Juego Nuevo/Raro")),
      { postCount: increment(1), updatedAt: serverTimestamp(), lastPostId: "post6" }, { merge: true });
    return assertFails(batch.commit());
  });

  await test("No se puede bajar postCount sin borrar un post", () =>
    assertFails(setDoc(doc(db(FRIEND), "game_stats", statsId("Valorant")),
      { postCount: increment(-1), updatedAt: serverTimestamp(), lastPostId: "post2" }, { merge: true })));

  await test("Otro usuario no puede borrar el post ajeno con su -1", () =>
    assertFails(deletePost(OTHER, "post2", "Valorant")));

  await test("Borrar un post propio (grupo inactivo + -1 + borrado)", () =>
    assertSucceeds(deletePost(FRIEND, "post2", "Valorant")));

  await test("postCount de Valorant quedó en 1 (1 inicial +1 -1)", async () => {
    let value;
    await env.withSecurityRulesDisabled(async (ctx) => {
      value = (await getDoc(doc(ctx.firestore(), "game_stats", statsId("Valorant")))).data().postCount;
    });
    if (value !== 1) throw new Error(`postCount ${value}`);
  });

  // ================= Interés de un post borrado =================
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "post_interested", `gone_${FRIEND}`), { postId: "gone", userId: FRIEND });
  });
  await test("Se puede quitar un interés de un post que ya no existe", () =>
    assertSucceeds(deleteDoc(doc(db(FRIEND), "post_interested", `gone_${FRIEND}`))));
};
