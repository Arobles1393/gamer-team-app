// Bloquear saca del chat de partida (auditoría M-07): el autor saca a quien
// bloqueó (blockService.blockUser), y nadie puede usar esto para otra cosa
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const {
  doc, collection, getDocs, setDoc, deleteDoc, writeBatch, increment, arrayRemove, Timestamp
} = require("firebase/firestore");

const A = "aaaAuthor";
const B = "bbbBlocked";
const C = "cccOther";
const D = "dddStranger";
const POST = "postA";

module.exports = async ({ env, test }) => {
  const db = (uid) => env.authenticatedContext(uid).firestore();

  const seed = () => env.withSecurityRulesDisabled(async (ctx) => {
    const s = ctx.firestore();
    await setDoc(doc(s, "posts", POST), { userId: A, game: "Valorant", interestedCount: 2, createdAt: Timestamp.now() });
    await setDoc(doc(s, "group_chats", POST), { postId: POST, participants: [A, B, C], active: true });
    await setDoc(doc(s, "post_interested", `${POST}_${B}`), { postId: POST, userId: B });
    await setDoc(doc(s, "post_interested", `${POST}_${C}`), { postId: POST, userId: C });
    await setDoc(doc(s, "group_chats", POST, "messages", "m1"), { senderId: A, text: "hola", createdAt: Timestamp.now() });
  });
  const block = (by, target) => env.withSecurityRulesDisabled((ctx) =>
    setDoc(doc(ctx.firestore(), "blocks", `${by}_${target}`), { blockerId: by, blockedId: target, participants: [by, target] }));

  // Lo que hace blockService.separateFromGroups
  const removeFromGroup = (by, target, { deleteInterest = true, decrement = true, alsoRemove = null } = {}) => {
    const s = db(by);
    const batch = writeBatch(s);
    if (deleteInterest) batch.delete(doc(s, "post_interested", `${POST}_${target}`));
    if (decrement) batch.update(doc(s, "posts", POST), { interestedCount: increment(-1) });
    batch.update(doc(s, "group_chats", POST), { participants: alsoRemove ? arrayRemove(target, alsoRemove) : arrayRemove(target) });
    return batch.commit();
  };

  await seed();

  await test("sin bloqueo, el autor no puede sacar a nadie", () => assertFails(removeFromGroup(A, B)));

  await block(A, B);

  await test("un tercero que bloqueó a B no puede sacarlo de una partida ajena", async () => {
    await block(D, B);
    await assertFails(removeFromGroup(D, B));
  });

  await test("el autor no puede sacar a otro participante que no bloqueó", () => assertFails(removeFromGroup(A, C)));

  await test("el autor no puede sacar a dos a la vez (B bloqueado + C)", () => assertFails(removeFromGroup(A, B, { alsoRemove: C })));

  await test("sacarlo sin borrar su 'Quiero jugar': rechazado", () => assertFails(removeFromGroup(A, B, { deleteInterest: false })));

  await test("sacarlo sin bajar el contador: rechazado", () => assertFails(removeFromGroup(A, B, { decrement: false })));

  await test("bajar el contador sin sacar a nadie: rechazado", () => {
    const s = db(A);
    const batch = writeBatch(s);
    batch.update(doc(s, "posts", POST), { interestedCount: increment(-1) });
    return assertFails(batch.commit());
  });

  await test("el autor saca a quien bloqueó (interés, -1 y grupo en un batch)", () => assertSucceeds(removeFromGroup(A, B)));

  await test("B ya no puede leer los mensajes del grupo", () =>
    assertFails(getDocs(collection(db(B), "group_chats", POST, "messages"))));

  await test("B no puede volver a marcar 'Quiero jugar'", () => {
    const s = db(B);
    const batch = writeBatch(s);
    batch.set(doc(s, "post_interested", `${POST}_${B}`), { postId: POST, userId: B, createdAt: Timestamp.now() });
    batch.update(doc(s, "posts", POST), { interestedCount: increment(1) });
    return assertFails(batch.commit());
  });

  await test("C sigue en el grupo y lee los mensajes", () =>
    assertSucceeds(getDocs(collection(db(C), "group_chats", POST, "messages"))));

  // Al revés: quien bloquea está en la partida de quien bloqueó (se sale solo)
  await test("quien bloqueó se sale del grupo de la otra persona (quitar su interés)", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const s = ctx.firestore();
      await setDoc(doc(s, "posts", "postB"), { userId: B, game: "Dota 2", interestedCount: 1, createdAt: Timestamp.now() });
      await setDoc(doc(s, "group_chats", "postB"), { postId: "postB", participants: [B, A], active: true });
      await setDoc(doc(s, "post_interested", `postB_${A}`), { postId: "postB", userId: A });
    });
    const s = db(A);
    const batch = writeBatch(s);
    batch.delete(doc(s, "post_interested", `postB_${A}`));
    batch.update(doc(s, "posts", "postB"), { interestedCount: increment(-1) });
    batch.update(doc(s, "group_chats", "postB"), { participants: arrayRemove(A) });
    await assertSucceeds(batch.commit());
  });

  await test("limpieza", () => env.withSecurityRulesDisabled((ctx) => deleteDoc(doc(ctx.firestore(), "blocks", `${D}_${B}`))));
};
