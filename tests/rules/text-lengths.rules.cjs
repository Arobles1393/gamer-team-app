// Límites de longitud de los textos
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { doc, collection, setDoc, updateDoc, addDoc, writeBatch, increment, serverTimestamp, Timestamp } = require("firebase/firestore");

const A = "aaaUser1";
const B = "bbbUser2";
const POST = "post1";
const CHAT = `${A}_${B}`;
const txt = (n) => "x".repeat(n);

module.exports = async ({ env, test, expect }) => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const f = ctx.firestore();
    await setDoc(doc(f, "users", A), { username: "Alfa", usernameLower: "alfa" });
    await setDoc(doc(f, "publicProfiles", A), { username: "Alfa", usernameLower: "alfa" });
    await setDoc(doc(f, "posts", POST), { userId: A, game: "Valorant", interestedCount: 0, comments: "x", createdAt: Timestamp.now() });
    await setDoc(doc(f, "chats", CHAT), { participants: [A, B] });
    await setDoc(doc(f, "group_chats", POST), { postId: POST, participants: [A, B], active: true });
  });
  const a = env.authenticatedContext(A).firestore();
  const b = env.authenticatedContext(B).firestore();

  const comment = (f, uid, text) => addDoc(collection(f, "post_comments"), { postId: POST, userId: uid, text, createdAt: serverTimestamp() });
  const message = (f, uid, path, text) => addDoc(collection(f, ...path, "messages"), { text, senderId: uid, createdAt: serverTimestamp() });
  const profile = (f, description) => {
    const batch = writeBatch(f);
    batch.update(doc(f, "users", A), { description });
    batch.set(doc(f, "publicProfiles", A), { description }, { merge: true });
    return batch.commit();
  };
  const report = (f, note) => addDoc(collection(f, "reports"), {
    reporterId: B, targetType: "post", targetId: POST, reason: "spam", note, status: "pending", createdAt: serverTimestamp(), reviewedAt: null
  });
  const newPost = (f, id, comments) => {
    const batch = writeBatch(f);
    batch.set(doc(f, "posts", id), { userId: B, game: "Valorant", comments, interestedCount: 0, scheduledAt: null, createdAt: serverTimestamp() });
    batch.set(doc(f, "group_chats", id), { postId: id, participants: [B], active: true });
    return batch.commit();
  };

  await test("Comentario de 500 caracteres: sí", () => assertSucceeds(comment(b, B, txt(500))));
  await test("Comentario de 501 caracteres: no", () => assertFails(comment(b, B, txt(501))));
  await test("Comentario solo con imagen (texto vacío): sí", () => assertSucceeds(comment(b, B, "")));

  await test("Mensaje 1:1 de 1000 caracteres: sí", () => assertSucceeds(message(a, A, ["chats", CHAT], txt(1000))));
  await test("Mensaje 1:1 de 1001 caracteres: no", () => assertFails(message(a, A, ["chats", CHAT], txt(1001))));
  await test("Mensaje de grupo de 1000: sí; de 1001: no", async () => {
    await assertSucceeds(message(a, A, ["group_chats", POST], txt(1000)));
    await assertFails(message(a, A, ["group_chats", POST], txt(1001)));
  });

  await test("Descripción del perfil de 500: sí", () => assertSucceeds(profile(a, txt(500))));
  await test("Descripción del perfil de 501: no", () => assertFails(profile(a, txt(501))));
  await test("Descripción de 501 solo en users (sin pasar por publicProfiles): no", () =>
    assertFails(updateDoc(doc(a, "users", A), { description: txt(501) })));
  await test("Editar el perfil sin descripción sigue funcionando", () =>
    assertSucceeds(updateDoc(doc(a, "users", A), { phone: "555" })));

  await test("Nota de reporte de 500: sí; de 501: no", async () => {
    await assertSucceeds(report(b, txt(500)));
    await assertFails(report(b, txt(501)));
  });

  await test("Descripción de partida de 300: sí; de 301: no", async () => {
    await assertSucceeds(newPost(b, "post2", txt(300)));
    await assertFails(newPost(b, "post3", txt(301)));
  });
  await test("Editar la partida con 301 caracteres: no", () =>
    assertFails(updateDoc(doc(a, "posts", POST), { comments: txt(301) })));
};
