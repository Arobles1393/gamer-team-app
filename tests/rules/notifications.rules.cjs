// Notificaciones: cada una ligada a una relación real entre quien la envía
// y quien la recibe (auditoría A-04). Los batches son los mismos que arman
// chatService, groupChatService, friendService, commentsService e
// interestService.
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const {
  doc, collection, getDocs, setDoc, addDoc, updateDoc, writeBatch, serverTimestamp, Timestamp, query, where
} = require("firebase/firestore");

const A = "aaaUser1";
const B = "bbbUser2";
const C = "steam:76561198000000000";
const CHAT = [A, B].sort().join("_");
// Grupo grande: 15 participantes (autor A + 14)
const MANY = Array.from({ length: 14 }, (_, i) => `grp${String(i).padStart(2, "0")}`);

module.exports = async ({ env, test }) => {
  const db = (uid) => env.authenticatedContext(uid).firestore();
  const notif = (sender, receiver, type, extra = {}) => ({
    userId: receiver, senderId: sender, type, read: false, createdAt: serverTimestamp(), ...extra
  });
  const add = (sender, data) => addDoc(collection(db(sender), "notifications"), data);

  await env.withSecurityRulesDisabled(async (ctx) => {
    const s = ctx.firestore();
    await setDoc(doc(s, "chats", CHAT), { participants: [A, B], lastMessage: "" });
    await setDoc(doc(s, "posts", "postA"), { userId: A, game: "Valorant", interestedCount: 1, createdAt: Timestamp.now() });
    await setDoc(doc(s, "post_interested", `postA_${B}`), { postId: "postA", userId: B });
    await setDoc(doc(s, "group_chats", "postA"), { postId: "postA", participants: [A, B], active: true });
    await setDoc(doc(s, "posts", "postBig"), { userId: A, game: "Dota 2", interestedCount: 14, createdAt: Timestamp.now() });
    await setDoc(doc(s, "group_chats", "postBig"), { postId: "postBig", participants: [A, ...MANY], active: true });
    await setDoc(doc(s, "group_chats", "postOff"), { postId: "postOff", participants: [A, B], active: false });
  });

  // ---------- Lo que hace la app ----------
  await test("mensaje 1:1: batch de chatService.sendMessage", () => {
    const s = db(A);
    const batch = writeBatch(s);
    batch.set(doc(collection(s, "chats", CHAT, "messages")), { text: "hola", senderId: A, createdAt: serverTimestamp() });
    batch.set(doc(collection(s, "notifications")), notif(A, B, "message", { relatedId: CHAT }));
    batch.update(doc(s, "chats", CHAT), { lastMessage: "hola", lastSenderId: A, lastMessageAt: serverTimestamp() });
    return assertSucceeds(batch.commit());
  });

  await test("mensaje de grupo: batch de groupChatService.sendMessage", () => {
    const s = db(B);
    const batch = writeBatch(s);
    batch.set(doc(collection(s, "group_chats", "postA", "messages")), { text: "voy", senderId: B, createdAt: serverTimestamp() });
    batch.set(doc(collection(s, "notifications")), notif(B, A, "group_message", { relatedId: "postA" }));
    batch.update(doc(s, "group_chats", "postA"), { lastMessage: "voy", lastSenderId: B, lastMessageAt: serverTimestamp() });
    return assertSucceeds(batch.commit());
  });

  await test("mensaje de grupo de 15 personas (14 notificaciones en un batch)", () => {
    const s = db(A);
    const batch = writeBatch(s);
    batch.set(doc(collection(s, "group_chats", "postBig", "messages")), { text: "a jugar", senderId: A, createdAt: serverTimestamp() });
    MANY.forEach((uid) => batch.set(doc(collection(s, "notifications")), notif(A, uid, "group_message", { relatedId: "postBig" })));
    batch.update(doc(s, "group_chats", "postBig"), { lastMessage: "a jugar", lastSenderId: A, lastMessageAt: serverTimestamp() });
    return assertSucceeds(batch.commit());
  });

  await test("comentario: aviso al autor de la partida", () =>
    assertSucceeds(add(B, notif(B, A, "comment", { relatedId: "postA" }))));

  await test("Quiero jugar: aviso al autor con el interés ya creado", () =>
    assertSucceeds(add(B, notif(B, A, "interested", { relatedId: "postA" }))));

  await test("solicitud de amistad: con la solicitud pendiente", async () => {
    await assertSucceeds(setDoc(doc(db(C), "friend_requests", `${C}_${A}`), { senderId: C, receiverId: A, status: "pending", createdAt: serverTimestamp() }));
    await assertSucceeds(add(C, notif(C, A, "friend_request", { status: "pending" })));
  });

  await test("amistad aceptada: batch de acceptFriendRequest", () => {
    const s = db(A);
    const pair = [A, C].sort();
    const batch = writeBatch(s);
    batch.set(doc(s, "friends", pair.join("_")), { users: pair, createdAt: serverTimestamp() });
    batch.update(doc(s, "friend_requests", `${C}_${A}`), { status: "accepted" });
    batch.set(doc(collection(s, "notifications")), notif(A, C, "friend_accepted"));
    return assertSucceeds(batch.commit());
  });

  // ---------- Abusos que antes pasaban ----------
  await test("C (sin relación) no puede avisar a B de un 'mensaje' en un chat ajeno", () =>
    assertFails(add(C, notif(C, B, "message", { relatedId: CHAT }))));

  await test("C no puede avisar a B con un chat inventado", () =>
    assertFails(add(C, notif(C, B, "message", { relatedId: "noexiste" }))));

  await test("C no puede avisar a B de un comentario en una partida que no es de B", () =>
    assertFails(add(C, notif(C, B, "comment", { relatedId: "postA" }))));

  await test("C no puede avisar de 'Quiero jugar' sin haberse interesado", () =>
    assertFails(add(C, notif(C, A, "interested", { relatedId: "postA" }))));

  await test("C no puede mandar una solicitud de amistad a B sin crearla", () =>
    assertFails(add(C, notif(C, B, "friend_request", { status: "pending" }))));

  await test("C no puede avisar 'amistad aceptada' a B sin ser amigos", () =>
    assertFails(add(C, notif(C, B, "friend_accepted"))));

  await test("no se puede avisar a un grupo inactivo", () =>
    assertFails(add(B, notif(B, A, "group_message", { relatedId: "postOff" }))));

  await test("tipo inventado: rechazado", () =>
    assertFails(add(B, notif(B, A, "promo", { relatedId: "postA" }))));

  await test("campos extra o basura: rechazado", () =>
    assertFails(add(B, notif(B, A, "comment", { relatedId: "postA", basura: "x".repeat(1000) }))));

  await test("relatedId enorme: rechazado", () =>
    assertFails(add(B, notif(B, A, "comment", { relatedId: "p".repeat(300) }))));

  await test("ya leída al crearla: rechazado", () =>
    assertFails(add(B, { ...notif(B, A, "comment", { relatedId: "postA" }), read: true })));

  await test("fecha del cliente: rechazado", () =>
    assertFails(add(B, { ...notif(B, A, "comment", { relatedId: "postA" }), createdAt: Timestamp.fromDate(new Date("2099-01-01")) })));

  await test("a nombre de otro (senderId ajeno): rechazado", () =>
    assertFails(add(B, notif(C, A, "comment", { relatedId: "postA" }))));

  await test("a uno mismo: rechazado", () =>
    assertFails(add(A, notif(A, A, "comment", { relatedId: "postA" }))));

  await test("status en una notificación que no es solicitud: rechazado", () =>
    assertFails(add(B, notif(B, A, "comment", { relatedId: "postA", status: "accepted" }))));

  // ---------- Bloqueos ----------
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "blocks", `${A}_${B}`), { blockerId: A, blockedId: B, participants: [A, B] });
  });

  await test("bloqueado por A, B no puede avisarle de un mensaje", () =>
    assertFails(add(B, notif(B, A, "message", { relatedId: CHAT }))));

  await test("bloqueado por A, B no puede avisarle de un comentario", () =>
    assertFails(add(B, notif(B, A, "comment", { relatedId: "postA" }))));

  await env.withSecurityRulesDisabled(async (ctx) => {
    const { deleteDoc } = require("firebase/firestore");
    await deleteDoc(doc(ctx.firestore(), "blocks", `${A}_${B}`));
  });

  // ---------- Actualizar: solo leída / respuesta ----------
  const mine = await getDocs(query(collection(db(A), "notifications"), where("userId", "==", A)));
  const anyId = mine.docs[0].id;
  const requestId = mine.docs.find((d) => d.data().type === "friend_request").id;

  await test("A marca su notificación como leída", () =>
    assertSucceeds(updateDoc(doc(db(A), "notifications", anyId), { read: true })));

  await test("A responde la solicitud (status accepted + leída)", () =>
    assertSucceeds(updateDoc(doc(db(A), "notifications", requestId), { status: "accepted", read: true })));

  await test("A no puede cambiar el remitente ni el tipo de su notificación", () =>
    assertFails(updateDoc(doc(db(A), "notifications", anyId), { senderId: C, type: "promo" })));

  await test("A no puede meter campos nuevos al actualizar", () =>
    assertFails(updateDoc(doc(db(A), "notifications", anyId), { read: true, extra: "x" })));

  await test("B no puede marcar como leída una notificación de A", () =>
    assertFails(updateDoc(doc(db(B), "notifications", anyId), { read: true })));
};
