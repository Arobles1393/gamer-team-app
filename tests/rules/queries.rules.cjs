// Consultas con límite: mensajes y no leídas
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const {
  doc, collection, query, where, orderBy, limit, limitToLast, getDocs, setDoc, Timestamp
} = require("firebase/firestore");

const A = "aaaUser1";
const B = "bbbUser2";
const C = "cccUser3";
const CHAT = `${A}_${B}`;

module.exports = async ({ env, test, expect }) => {
  const db = (uid) => env.authenticatedContext(uid).firestore();

  await env.withSecurityRulesDisabled(async (ctx) => {
    const f = ctx.firestore();
    await setDoc(doc(f, "chats", CHAT), { participants: [A, B] });
    await setDoc(doc(f, "group_chats", "post1"), { postId: "post1", participants: [A, B], active: true });
    const writes = [];
    for (let i = 0; i < 120; i++) {
      const data = { text: `m${i}`, senderId: i % 2 ? A : B, createdAt: Timestamp.fromMillis(1_000_000 + i * 1000) };
      writes.push(setDoc(doc(f, "chats", CHAT, "messages", `m${i}`), data));
      writes.push(setDoc(doc(f, "group_chats", "post1", "messages", `m${i}`), data));
      writes.push(setDoc(doc(f, "notifications", `n${i}`), {
        userId: A, senderId: B, type: "message", read: i >= 10, createdAt: Timestamp.fromMillis(2_000_000 + i * 1000)
      }));
    }
    for (let i = 0; i < 130; i++) {
      writes.push(setDoc(doc(f, "notifications", `u${i}`), {
        userId: B, senderId: A, type: "message", read: false, createdAt: Timestamp.fromMillis(3_000_000 + i * 1000)
      }));
    }
    await Promise.all(writes);
  });

  // Igual que chatService / groupChatService.subscribeToMessages
  const lastMessages = (uid, path, n) =>
    getDocs(query(collection(db(uid), ...path), orderBy("createdAt"), limitToLast(n)));

  for (const [label, path] of [["chat 1:1", ["chats", CHAT, "messages"]], ["chat de grupo", ["group_chats", "post1", "messages"]]]) {
    await test(`${label}: los últimos 50, del más viejo al más nuevo`, async () => {
      const snap = await assertSucceeds(lastMessages(A, path, 50));
      const texts = snap.docs.map((d) => d.data().text);
      expect(texts.length === 50, `llegaron ${texts.length}`);
      expect(texts[0] === "m70" && texts[49] === "m119", `${texts[0]}..${texts[49]}`);
    });

    await test(`${label}: al ampliar a 100 llegan los anteriores`, async () => {
      const snap = await assertSucceeds(lastMessages(A, path, 100));
      const texts = snap.docs.map((d) => d.data().text);
      expect(texts.length === 100 && texts[0] === "m20" && texts[99] === "m119", `${texts.length} ${texts[0]}..${texts[99]}`);
    });

    await test(`${label}: con 150 llegan los 120 (no hay más atrás)`, async () => {
      const snap = await assertSucceeds(lastMessages(A, path, 150));
      expect(snap.size === 120, `llegaron ${snap.size}`);
    });

    await test(`${label}: un no participante no puede leer`, () => assertFails(lastMessages(C, path, 50)));
  }

  // Igual que notificationService.subscribeToUnreadNotifications
  const unread = (uid) => getDocs(query(
    collection(db(uid), "notifications"),
    where("userId", "==", uid), where("read", "==", false), orderBy("createdAt", "desc"), limit(100)
  ));

  await test("No leídas: solo las sin leer, de la más nueva a la más vieja", async () => {
    const snap = await assertSucceeds(unread(A));
    expect(snap.size === 10, `llegaron ${snap.size}`);
    expect(snap.docs[0].id === "n9", `primera ${snap.docs[0].id}`);
  });

  await test("No leídas: con más de 100 se cortan en las 100 más recientes", async () => {
    const snap = await assertSucceeds(unread(B));
    expect(snap.size === 100 && snap.docs[0].id === "u129" && snap.docs[99].id === "u30", `${snap.size} ${snap.docs[0].id}..${snap.docs[99].id}`);
  });

  await test("No leídas: nadie puede consultar las de otro", () =>
    assertFails(getDocs(query(collection(db(C), "notifications"), where("userId", "==", A), where("read", "==", false), orderBy("createdAt", "desc"), limit(100)))));
};
