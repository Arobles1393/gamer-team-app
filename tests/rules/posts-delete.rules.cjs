// Borrar un post sin dejar huérfanos
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const {
  doc, collection, query, where, getDoc, getDocs, setDoc, deleteDoc, writeBatch, increment, serverTimestamp, Timestamp
} = require("firebase/firestore");

const AUTHOR = "aaaAuthor";
const OTHER = "bbbOther";
const POST = "post1";
const KEEP = "post2";
const USERS = Array.from({ length: 25 }, (_, i) => `user${String(i).padStart(2, "0")}`);

module.exports = async ({ env, test, expect }) => {
  const db = (uid) => env.authenticatedContext(uid).firestore();
  const admin = async (fn) => {
    let out;
    await env.withSecurityRulesDisabled(async (ctx) => { out = await fn(ctx.firestore()); });
    return out;
  };

  await admin(async (f) => {
    const writes = [];
    for (const [id, owner] of [[POST, AUTHOR], [KEEP, OTHER]]) {
      writes.push(setDoc(doc(f, "posts", id), { userId: owner, game: "Valorant", interestedCount: id === POST ? 25 : 0, createdAt: Timestamp.now() }));
      writes.push(setDoc(doc(f, "group_chats", id), { postId: id, participants: [owner], active: true }));
    }
    writes.push(setDoc(doc(f, "game_stats", "Valorant"), { game: "Valorant", postCount: 2 }));
    for (let i = 0; i < 30; i++) {
      writes.push(setDoc(doc(f, "post_comments", `c${i}`), { postId: POST, userId: USERS[i % 25], text: `c${i}` }));
    }
    writes.push(setDoc(doc(f, "post_comments", "keep1"), { postId: KEEP, userId: USERS[0], text: "otro post" }));
    USERS.forEach((uid) => writes.push(setDoc(doc(f, "post_interested", `${POST}_${uid}`), { postId: POST, userId: uid })));
    writes.push(setDoc(doc(f, "post_interested", `${KEEP}_${USERS[1]}`), { postId: KEEP, userId: USERS[1] }));
    for (let i = 0; i < 5; i++) {
      writes.push(setDoc(doc(f, "notifications", `na${i}`), { userId: AUTHOR, senderId: USERS[i], type: i % 2 ? "comment" : "interested", relatedId: POST, read: false }));
    }
    writes.push(setDoc(doc(f, "notifications", "naKeep"), { userId: AUTHOR, senderId: OTHER, type: "message", relatedId: "chatX", read: false }));
    writes.push(setDoc(doc(f, "notifications", "nOther"), { userId: USERS[3], senderId: AUTHOR, type: "group_message", relatedId: POST, read: false }));
    await Promise.all(writes);
  });

  // ---------- Permisos ----------
  await test("Un tercero no puede borrar comentarios ajenos", () =>
    assertFails(deleteDoc(doc(db(OTHER), "post_comments", "c0"))));

  await test("El autor del post no puede borrar comentarios de un post ajeno", () =>
    assertFails(deleteDoc(doc(db(AUTHOR), "post_comments", "keep1"))));

  await test("El autor no puede quitar interesados sin borrar el post", () =>
    assertFails(deleteDoc(doc(db(AUTHOR), "post_interested", `${POST}_${USERS[0]}`))));

  await test("Un tercero no puede quitar interesados aunque el post se borre", () => {
    const f = db(OTHER);
    const batch = writeBatch(f);
    batch.delete(doc(f, "post_interested", `${KEEP}_${USERS[1]}`));
    return assertFails(batch.commit());
  });

  // ---------- El flujo de postService.deletePost ----------
  await test("El autor borra su post con 30 comentarios, 25 interesados y sus notificaciones", async () => {
    const f = db(AUTHOR);
    const [postSnap, groupSnap, commentsSnap, interestsSnap] = await Promise.all([
      getDoc(doc(f, "posts", POST)),
      getDoc(doc(f, "group_chats", POST)),
      getDocs(query(collection(f, "post_comments"), where("postId", "==", POST))),
      getDocs(query(collection(f, "post_interested"), where("postId", "==", POST)))
    ]);
    const statsSnap = await getDoc(doc(f, "game_stats", "Valorant"));

    const cBatch = writeBatch(f);
    commentsSnap.docs.forEach((d) => cBatch.delete(d.ref));
    await assertSucceeds(cBatch.commit());

    const batch = writeBatch(f);
    if (groupSnap.exists()) batch.update(doc(f, "group_chats", POST), { active: false });
    if (statsSnap.exists()) {
      batch.set(doc(f, "game_stats", "Valorant"), { game: "Valorant", postCount: increment(-1), updatedAt: serverTimestamp(), lastPostId: POST }, { merge: true });
    }
    interestsSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(f, "posts", POST));
    await assertSucceeds(batch.commit());

    const notifs = await getDocs(query(collection(f, "notifications"), where("userId", "==", postSnap.data().userId), where("relatedId", "==", POST)));
    const nBatch = writeBatch(f);
    notifs.docs.forEach((d) => nBatch.delete(d.ref));
    await assertSucceeds(nBatch.commit());
  });

  await test("No quedan comentarios ni interesados del post borrado", () => admin(async (f) => {
    const c = await getDocs(query(collection(f, "post_comments"), where("postId", "==", POST)));
    const i = await getDocs(query(collection(f, "post_interested"), where("postId", "==", POST)));
    expect(c.size === 0 && i.size === 0, `comentarios ${c.size}, interesados ${i.size}`);
  }));

  await test("Lo de otros posts sigue intacto", () => admin(async (f) => {
    expect((await getDoc(doc(f, "post_comments", "keep1"))).exists(), "se borró un comentario ajeno");
    expect((await getDoc(doc(f, "post_interested", `${KEEP}_${USERS[1]}`))).exists(), "se borró un interés ajeno");
    expect((await getDoc(doc(f, "posts", KEEP))).exists(), "se borró otro post");
  }));

  await test("Notificaciones: se borraron las del autor sobre el post; quedan las demás", () => admin(async (f) => {
    const mine = await getDocs(query(collection(f, "notifications"), where("userId", "==", AUTHOR)));
    expect(mine.size === 1 && mine.docs[0].id === "naKeep", `quedan ${mine.docs.map((d) => d.id)}`);
    expect((await getDoc(doc(f, "notifications", "nOther"))).exists(), "se borró una notificación de otro usuario");
  }));

  await test("Chat del grupo inactivo y postCount 2 -> 1", () => admin(async (f) => {
    expect((await getDoc(doc(f, "group_chats", POST))).data().active === false, "grupo sigue activo");
    expect((await getDoc(doc(f, "game_stats", "Valorant"))).data().postCount === 1, "postCount mal");
  }));
};
