// Qué se lee sin sesión (auditoría M-11): partidas y guías sí; perfiles uno
// por uno (nombre y avatar de las tarjetas) sí, pero no listarlos;
// comentarios e interesados no
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const {
  doc, collection, getDoc, getDocs, setDoc, query, where, orderBy, startAt, endAt, limit, Timestamp
} = require("firebase/firestore");

const A = "aaaHost";
const B = "bbbPlayer";
const POST = "guestPost";

module.exports = async ({ env, test }) => {
  const guest = env.unauthenticatedContext().firestore();
  const signed = env.authenticatedContext(B).firestore();

  await env.withSecurityRulesDisabled(async (ctx) => {
    const s = ctx.firestore();
    await setDoc(doc(s, "publicProfiles", A), { username: "Host", usernameLower: "host", avatar: null, createdAt: Timestamp.now() });
    await setDoc(doc(s, "posts", POST), { userId: A, game: "Valorant", interestedCount: 1, createdAt: Timestamp.now() });
    await setDoc(doc(s, "post_comments", "c1"), { postId: POST, userId: B, text: "hola", createdAt: Timestamp.now() });
    await setDoc(doc(s, "post_interested", `${POST}_${B}`), { postId: POST, userId: B, createdAt: Timestamp.now() });
    await setDoc(doc(s, "guides", "g1"), { authorId: A, game: "Valorant", title: "Guía", status: "approved", createdAt: Timestamp.now() });
  });

  // ---------- Sin sesión ----------
  await test("sin sesión: ve el feed de partidas", () =>
    assertSucceeds(getDocs(query(collection(guest, "posts"), limit(10)))));

  await test("sin sesión: abre una partida por su link", () => assertSucceeds(getDoc(doc(guest, "posts", POST))));

  await test("sin sesión: ve las guías aprobadas", () =>
    assertSucceeds(getDocs(query(collection(guest, "guides"), where("status", "==", "approved")))));

  await test("sin sesión: lee el perfil del autor de una tarjeta (nombre y avatar)", () =>
    assertSucceeds(getDoc(doc(guest, "publicProfiles", A))));

  await test("sin sesión: no puede listar los perfiles", () =>
    assertFails(getDocs(query(collection(guest, "publicProfiles"), limit(50)))));

  await test("sin sesión: no puede buscar jugadores por nombre", () =>
    assertFails(getDocs(query(collection(guest, "publicProfiles"), orderBy("usernameLower"), startAt("h"), endAt("h"), limit(20)))));

  await test("sin sesión: no lee los comentarios de una partida", () =>
    assertFails(getDocs(query(collection(guest, "post_comments"), where("postId", "==", POST)))));

  await test("sin sesión: no lee un comentario por su id", () => assertFails(getDoc(doc(guest, "post_comments", "c1"))));

  await test("sin sesión: no ve quién se interesó en una partida", () =>
    assertFails(getDocs(query(collection(guest, "post_interested"), where("postId", "==", POST)))));

  await test("sin sesión: no ve el interés de alguien por su id", () =>
    assertFails(getDoc(doc(guest, "post_interested", `${POST}_${B}`))));

  // ---------- Con sesión, todo sigue igual ----------
  await test("con sesión: busca jugadores por nombre", () =>
    assertSucceeds(getDocs(query(collection(signed, "publicProfiles"), orderBy("usernameLower"), startAt("h"), endAt("h"), limit(20)))));

  await test("con sesión: lee los comentarios", () =>
    assertSucceeds(getDocs(query(collection(signed, "post_comments"), where("postId", "==", POST)))));

  await test("con sesión: ve quién se interesó", () =>
    assertSucceeds(getDocs(query(collection(signed, "post_interested"), where("postId", "==", POST)))));
};
