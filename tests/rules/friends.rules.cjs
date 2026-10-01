// Amistad con consentimiento (friends y friend_requests)
const {
  assertSucceeds,
  assertFails
} = require("@firebase/rules-unit-testing");
const {
  doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp
} = require("firebase/firestore");

// Uids como los reales: Firebase (alfanuméricos) y Steam ("steam:...")
const A = "aaaUser1";
const B = "bbbUser2";
const C = "steam:76561198000000000";

const pair = (x, y) => [x, y].sort();
const pairId = (x, y) => pair(x, y).join("_");

module.exports = async ({ env, test, expect }) => {

  const db = (uid) => env.authenticatedContext(uid).firestore();
  const reqRef = (fs_, s, r) => doc(fs_, "friend_requests", `${s}_${r}`);
  const friendRef = (fs_, x, y) => doc(fs_, "friends", pairId(x, y));
  const pending = (s, r) => ({ senderId: s, receiverId: r, status: "pending", createdAt: serverTimestamp() });

  // Acepta como `me` la solicitud de `sender`: friends + request en un batch
  const accept = (me, sender) => {
    const fs_ = db(me);
    const batch = writeBatch(fs_);
    batch.set(friendRef(fs_, me, sender), { users: pair(me, sender), createdAt: serverTimestamp() });
    batch.update(reqRef(fs_, sender, me), { status: "accepted" });
    return batch.commit();
  };

  // ---------- El hueco de C2 ----------
  await test("A no puede crear una amistad con B sin solicitud", () =>
    assertFails(setDoc(friendRef(db(A), A, B), { users: pair(A, B), createdAt: serverTimestamp() })));

  // ---------- Solicitudes ----------
  await test("B lee una solicitud que no existe (comprobar pendiente)", () =>
    assertSucceeds(getDoc(reqRef(db(B), C, B))));

  await test("A no puede crear una solicitud con id ajeno", () =>
    assertFails(setDoc(doc(db(A), "friend_requests", "cualquierId"), pending(A, B))));

  await test("A no puede crear una solicitud ya aceptada", () =>
    assertFails(setDoc(reqRef(db(A), A, B), { ...pending(A, B), status: "accepted" })));

  await test("A no puede enviarse una solicitud a sí mismo", () =>
    assertFails(setDoc(reqRef(db(A), A, A), pending(A, A))));

  await test("A envía una solicitud a B", () =>
    assertSucceeds(setDoc(reqRef(db(A), A, B), pending(A, B))));

  await test("A (quien envía) no puede aceptar su propia solicitud", () =>
    assertFails(updateDoc(reqRef(db(A), A, B), { status: "accepted" })));

  await test("A no puede crear la amistad aceptando su propia solicitud en batch", () => {
    const fs_ = db(A);
    const batch = writeBatch(fs_);
    batch.set(friendRef(fs_, A, B), { users: pair(A, B), createdAt: serverTimestamp() });
    batch.update(reqRef(fs_, A, B), { status: "accepted" });
    return assertFails(batch.commit());
  });

  await test("C (ajeno) no puede crear la amistad A-B", () =>
    assertFails(setDoc(friendRef(db(C), A, B), { users: pair(A, B), createdAt: serverTimestamp() })));

  await test("B no puede crear la amistad sin aceptar la solicitud en el mismo batch", () =>
    assertFails(setDoc(friendRef(db(B), A, B), { users: pair(A, B), createdAt: serverTimestamp() })));

  await test("B no puede crear la amistad con el par desordenado", () => {
    const fs_ = db(B);
    const [lo, hi] = pair(A, B);
    const batch = writeBatch(fs_);
    batch.set(doc(fs_, "friends", `${hi}_${lo}`), { users: [hi, lo], createdAt: serverTimestamp() });
    batch.update(reqRef(fs_, A, B), { status: "accepted" });
    return assertFails(batch.commit());
  });

  await test("B no puede tocar otros campos al aceptar", () =>
    assertFails(updateDoc(reqRef(db(B), A, B), { status: "accepted", senderId: C })));

  await test("B acepta: amistad + solicitud aceptada en un batch", () =>
    assertSucceeds(accept(B, A)));

  await test("B no puede volver a crear la misma amistad (ya existe)", () =>
    assertFails(accept(B, A)));

  await test("A y B leen la amistad; C no", async () => {
    await assertSucceeds(getDoc(friendRef(db(A), A, B)));
    await assertSucceeds(getDoc(friendRef(db(B), A, B)));
    await assertFails(getDoc(friendRef(db(C), A, B)));
  });

  // ---------- Terminar y volver a ser amigos ----------
  await test("A termina la amistad", () =>
    assertSucceeds(deleteDoc(friendRef(db(A), A, B))));

  await test("A vuelve a enviar la solicitud (aceptada -> pendiente)", () =>
    assertSucceeds(setDoc(reqRef(db(A), A, B), pending(A, B))));

  await test("B (quien recibe) no puede reabrir la solicitud de A", async () => {
    await assertSucceeds(updateDoc(reqRef(db(B), A, B), { status: "rejected" }));
    await assertFails(updateDoc(reqRef(db(B), A, B), { status: "pending" }));
  });

  await test("A reenvía tras el rechazo y B acepta otra vez", async () => {
    await assertSucceeds(setDoc(reqRef(db(A), A, B), pending(A, B)));
    await assertSucceeds(accept(B, A));
  });

  await test("B no puede aceptar dos veces (ya no está pendiente)", () =>
    assertFails(updateDoc(reqRef(db(B), A, B), { status: "accepted" })));

  // ---------- Bloqueos ----------
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "blocks", `${A}_${C}`), {
      blockerId: A, blockedId: C, participants: [A, C]
    });
  });

  await test("C (bloqueado por A) no puede enviarle solicitud a A", () =>
    assertFails(setDoc(reqRef(db(C), C, A), pending(C, A))));

  await test("Con bloqueo, A no puede aceptar una solicitud vieja de C", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(reqRef(ctx.firestore(), C, A), { senderId: C, receiverId: A, status: "pending" });
    });
    await assertFails(accept(A, C));
  });
};
