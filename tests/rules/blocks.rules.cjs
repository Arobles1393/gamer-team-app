// Bloqueos: comentar, Me interesa y chat del grupo
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const {
  doc, collection, setDoc, deleteDoc, addDoc, runTransaction, increment, arrayUnion, arrayRemove, serverTimestamp
} = require("firebase/firestore");

const AUTHOR = "aaaAuthor";
const FRIEND = "bbbFriend";
const BLOCKED = "cccBlocked";
const POST = "post1";

module.exports = async ({ env, test, expect }) => {
  const db = (uid) => env.authenticatedContext(uid).firestore();

  await env.withSecurityRulesDisabled(async (ctx) => {
    const f = ctx.firestore();
    await setDoc(doc(f, "posts", POST), { userId: AUTHOR, game: "Valorant", interestedCount: 0 });
    await setDoc(doc(f, "group_chats", POST), { postId: POST, participants: [AUTHOR], active: true });
    // El autor bloqueó a BLOCKED
    await setDoc(doc(f, "blocks", `${AUTHOR}_${BLOCKED}`), {
      blockerId: AUTHOR, blockedId: BLOCKED, participants: [AUTHOR, BLOCKED]
    });
  });

  // Igual que interestService.toggleInterested (marcar)
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

  // Igual que commentsService.addComment
  const comment = (uid) => addDoc(collection(db(uid), "post_comments"), {
    postId: POST, text: "hola", userId: uid, mediaUrl: "", mediaType: "", mediaPath: "", createdAt: serverTimestamp()
  });

  // ---------- Sin bloqueo: todo sigue igual ----------
  await test("Un usuario sin bloqueo comenta", () => assertSucceeds(comment(FRIEND)));
  await test("Un usuario sin bloqueo marca Me interesa y entra al grupo", () => assertSucceeds(markInterest(FRIEND)));
  await test("El autor comenta su propio post", () => assertSucceeds(comment(AUTHOR)));

  // ---------- Con bloqueo ----------
  await test("El bloqueado no puede comentar el post del autor", () => assertFails(comment(BLOCKED)));
  await test("El bloqueado no puede marcar Me interesa (transacción completa)", () => assertFails(markInterest(BLOCKED)));

  await test("El bloqueado no puede crear el interés suelto", () =>
    assertFails(setDoc(doc(db(BLOCKED), "post_interested", `${POST}_${BLOCKED}`), {
      postId: POST, userId: BLOCKED, createdAt: serverTimestamp()
    })));

  await test("El bloqueado no puede entrar al grupo sin interés", () => {
    const f = db(BLOCKED);
    return assertFails(runTransaction(f, async (tx) => {
      tx.update(doc(f, "group_chats", POST), { participants: arrayUnion(BLOCKED) });
    }));
  });

  await test("Un comentario a un post que no existe se rechaza", () =>
    assertFails(addDoc(collection(db(FRIEND), "post_comments"), {
      postId: "noExiste", text: "x", userId: FRIEND, createdAt: serverTimestamp()
    })));

  // ---------- Quitar el interés sigue permitido aunque haya bloqueo ----------
  await env.withSecurityRulesDisabled(async (ctx) => {
    const f = ctx.firestore();
    // Interés de antes del bloqueo
    await setDoc(doc(f, "post_interested", `${POST}_${BLOCKED}`), { postId: POST, userId: BLOCKED });
    await setDoc(doc(f, "group_chats", POST), { postId: POST, participants: [AUTHOR, FRIEND, BLOCKED], active: true });
  });

  await test("El bloqueado puede quitar un interés previo y salir del grupo", () => {
    const f = db(BLOCKED);
    return assertSucceeds(runTransaction(f, async (tx) => {
      const ref = doc(f, "post_interested", `${POST}_${BLOCKED}`);
      const group = doc(f, "group_chats", POST);
      await Promise.all([tx.get(ref), tx.get(group)]);
      tx.delete(ref);
      tx.update(doc(f, "posts", POST), { interestedCount: increment(-1) });
      tx.update(group, { participants: arrayRemove(BLOCKED) });
    }));
  });

  await test("El bloqueado puede borrar sus propios comentarios", async () => {
    let ref;
    await env.withSecurityRulesDisabled(async (ctx) => {
      ref = await addDoc(collection(ctx.firestore(), "post_comments"), { postId: POST, userId: BLOCKED, text: "viejo" });
    });
    await assertSucceeds(deleteDoc(doc(db(BLOCKED), "post_comments", ref.id)));
  });
};
