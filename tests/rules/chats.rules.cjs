// Chats 1:1: participantes fijos y último mensaje firmado
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { doc, collection, getDoc, getDocs, setDoc, updateDoc, writeBatch, serverTimestamp } = require("firebase/firestore");

const A = "aaaUser1";
const B = "bbbUser2";
const C = "cccUser3";
const CHAT = [A, B].sort().join("_");

module.exports = async ({ env, test, expect }) => {
  const db = (uid) => env.authenticatedContext(uid).firestore();
  const chatRef = (fs_) => doc(fs_, "chats", CHAT);

  // Igual que chatService.sendMessage
  const sendMessage = (sender, receiver, text) => {
    const fs_ = db(sender);
    const batch = writeBatch(fs_);
    batch.set(doc(collection(fs_, "chats", CHAT, "messages")), { text, senderId: sender, createdAt: serverTimestamp() });
    batch.set(doc(collection(fs_, "notifications")), {
      userId: receiver, senderId: sender, type: "message", read: false, createdAt: serverTimestamp(), relatedId: CHAT
    });
    batch.update(chatRef(fs_), { lastMessage: text, lastSenderId: sender, lastMessageAt: serverTimestamp() });
    return batch.commit();
  };

  // Igual que chatService.createOrGetChat
  await test("A crea el chat con B", () =>
    assertSucceeds(setDoc(chatRef(db(A)), {
      participants: [A, B], lastMessage: "", lastMessageAt: null, createdAt: serverTimestamp()
    })));

  await test("A envía un mensaje (batch completo de sendMessage)", () =>
    assertSucceeds(sendMessage(A, B, "hola")));

  await test("B responde (batch completo de sendMessage)", () =>
    assertSucceeds(sendMessage(B, A, "qué tal")));

  // ---------- El hueco de R1 ----------
  await test("A no puede cambiar los participantes (meter a C)", () =>
    assertFails(updateDoc(chatRef(db(A)), { participants: [A, C] })));

  await test("A no puede agregar a C como tercer participante", () =>
    assertFails(updateDoc(chatRef(db(A)), { participants: [A, B, C] })));

  await test("Tras el intento, C sigue sin poder leer el historial", () =>
    assertFails(getDocs(collection(db(C), "chats", CHAT, "messages"))));

  await test("A no puede agregar campos nuevos al chat", () =>
    assertFails(updateDoc(chatRef(db(A)), { pinned: true })));

  await test("A no puede tocar createdAt", () =>
    assertFails(updateDoc(chatRef(db(A)), { createdAt: serverTimestamp() })));

  await test("A no puede firmar el último mensaje como si fuera B", () =>
    assertFails(updateDoc(chatRef(db(A)), { lastMessage: "x", lastSenderId: B, lastMessageAt: serverTimestamp() })));

  await test("C (no participante) no puede actualizar el último mensaje", () =>
    assertFails(updateDoc(chatRef(db(C)), { lastMessage: "x", lastSenderId: C, lastMessageAt: serverTimestamp() })));

  await test("A y B leen el chat; C no", async () => {
    await assertSucceeds(getDoc(chatRef(db(A))));
    await assertSucceeds(getDoc(chatRef(db(B))));
    await assertFails(getDoc(chatRef(db(C))));
  });

  // ---------- Bloqueo ----------
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "blocks", `${A}_${B}`), { blockerId: A, blockedId: B, participants: [A, B] });
  });

  await test("Con bloqueo, B ya no puede enviar mensajes", () =>
    assertFails(sendMessage(B, A, "sigo aquí")));
};
