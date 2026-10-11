// Guías: moderación previa, lectura según estado y validación por tipo
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const {
  doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, query, where, orderBy, serverTimestamp, Timestamp
} = require("firebase/firestore");

const AUTHOR = "aaaAuthor";
const OTHER = "bbbOther";
const ADMIN = "cccAdmin";

const original = (overrides = {}) => ({
  authorId: AUTHOR,
  game: "Valorant",
  title: "Guía de Jett",
  type: "original",
  status: "pending",
  content: "<p>Hola</p>",
  coverImage: null,
  youtubeVideoId: "dQw4w9WgXcQ",
  externalUrl: null,
  externalPreview: null,
  reviewNote: null,
  reviewedAt: null,
  createdAt: serverTimestamp(),
  ...overrides
});

const external = (overrides = {}) => original({
  type: "external",
  content: null,
  youtubeVideoId: null,
  externalUrl: "https://www.ign.com/wikis/valorant",
  externalPreview: { title: "Valorant Wiki", description: "Guía", image: "https://img.example.com/a.jpg" },
  ...overrides
});

module.exports = async ({ env, test }) => {
  const author = env.authenticatedContext(AUTHOR).firestore();
  const other = env.authenticatedContext(OTHER).firestore();
  const admin = env.authenticatedContext(ADMIN, { admin: true }).firestore();
  const guest = env.unauthenticatedContext().firestore();

  // ---------- Crear ----------
  await test("El autor crea una guía escrita pendiente", () =>
    assertSucceeds(setDoc(doc(author, "guides", "g1"), original())));

  await test("El autor crea una guía de link externo pendiente", () =>
    assertSucceeds(setDoc(doc(author, "guides", "g2"), external())));

  await test("No se puede crear ya aprobada", () =>
    assertFails(setDoc(doc(author, "guides", "x1"), original({ status: "approved" }))));

  await test("No se puede crear a nombre de otro", () =>
    assertFails(setDoc(doc(other, "guides", "x2"), original())));

  await test("Sin sesión no se puede crear", () =>
    assertFails(setDoc(doc(guest, "guides", "x3"), original())));

  await test("No se puede inventar la fecha", () =>
    assertFails(setDoc(doc(author, "guides", "x4"), original({ createdAt: Timestamp.fromMillis(Date.now() + 86400000) }))));

  await test("No se pueden agregar campos extra", () =>
    assertFails(setDoc(doc(author, "guides", "x5"), original({ likes: 999 }))));

  await test("Una escrita no puede traer link externo", () =>
    assertFails(setDoc(doc(author, "guides", "x6"), original({ externalUrl: "https://x.com" }))));

  await test("Una externa no puede traer contenido", () =>
    assertFails(setDoc(doc(author, "guides", "x7"), external({ content: "<p>x</p>" }))));

  await test("Id de YouTube con formato inválido", () =>
    assertFails(setDoc(doc(author, "guides", "x8"), original({ youtubeVideoId: "<script>" }))));

  await test("Portada que no es https", () =>
    assertFails(setDoc(doc(author, "guides", "x9"), original({ coverImage: "javascript:alert(1)" }))));

  await test("Link externo que no es http(s)", () =>
    assertFails(setDoc(doc(author, "guides", "x10"), external({ externalUrl: "javascript:alert(1)" }))));

  await test("Vista previa con imagen que no es https", () =>
    assertFails(setDoc(doc(author, "guides", "x11"), external({ externalPreview: { title: "a", description: null, image: "http://x.com/a.jpg" } }))));

  await test("Vista previa con campos extra", () =>
    assertFails(setDoc(doc(author, "guides", "x12"), external({ externalPreview: { title: "a", description: null, image: null, html: "<b>" } }))));

  await test("Título demasiado corto o demasiado largo", async () => {
    await assertFails(setDoc(doc(author, "guides", "x13"), original({ title: "ab" })));
    await assertFails(setDoc(doc(author, "guides", "x14"), original({ title: "x".repeat(151) })));
  });

  await test("Contenido vacío o de más de 100 000 caracteres", async () => {
    await assertFails(setDoc(doc(author, "guides", "x15"), original({ content: "" })));
    await assertFails(setDoc(doc(author, "guides", "x16"), original({ content: "x".repeat(100001) })));
  });

  // ---------- Leer ----------
  await test("Pendiente: la lee su autor", () => assertSucceeds(getDoc(doc(author, "guides", "g1"))));
  await test("Pendiente: la lee el admin", () => assertSucceeds(getDoc(doc(admin, "guides", "g1"))));
  await test("Pendiente: otro usuario no la lee", () => assertFails(getDoc(doc(other, "guides", "g1"))));
  await test("Pendiente: sin sesión no se lee", () => assertFails(getDoc(doc(guest, "guides", "g1"))));
  await test("Una guía que no existe se puede consultar (no es error de permisos)", () =>
    assertSucceeds(getDoc(doc(other, "guides", "noExiste"))));

  await test("Lista de aprobadas: cualquiera, incluso sin sesión", async () => {
    await assertSucceeds(getDocs(query(collection(guest, "guides"), where("status", "==", "approved"), orderBy("createdAt", "desc"))));
    await assertSucceeds(getDocs(query(collection(other, "guides"), where("status", "==", "approved"), where("game", "==", "Valorant"), orderBy("createdAt", "desc"))));
  });
  await test("Lista de pendientes: solo el admin", async () => {
    await assertSucceeds(getDocs(query(collection(admin, "guides"), where("status", "==", "pending"), orderBy("createdAt", "asc"))));
    await assertFails(getDocs(query(collection(other, "guides"), where("status", "==", "pending"), orderBy("createdAt", "asc"))));
  });
  await test("Mis guías: el autor lista las suyas en cualquier estado", () =>
    assertSucceeds(getDocs(query(collection(author, "guides"), where("authorId", "==", AUTHOR), orderBy("createdAt", "desc")))));
  await test("Nadie lista las guías de otro autor", () =>
    assertFails(getDocs(query(collection(other, "guides"), where("authorId", "==", AUTHOR)))));

  // ---------- Moderar ----------
  await test("El autor no puede aprobar su propia guía", () =>
    assertFails(updateDoc(doc(author, "guides", "g1"), { status: "approved", reviewedAt: serverTimestamp() })));

  await test("El autor no puede editarla (ni siquiera el título)", () =>
    assertFails(updateDoc(doc(author, "guides", "g1"), { title: "Otra cosa" })));

  await test("El admin no puede cambiar el contenido", () =>
    assertFails(updateDoc(doc(admin, "guides", "g1"), { content: "<p>cambiado</p>" })));

  await test("El admin no puede dejarla en un estado inválido", () =>
    assertFails(updateDoc(doc(admin, "guides", "g1"), { status: "featured", reviewedAt: serverTimestamp() })));

  await test("El admin la aprueba con nota", () =>
    assertSucceeds(updateDoc(doc(admin, "guides", "g1"), { status: "approved", reviewNote: "¡Muy buena!", reviewedAt: serverTimestamp() })));

  await test("Aprobada: ya la ven todos, incluso sin sesión", async () => {
    await assertSucceeds(getDoc(doc(other, "guides", "g1")));
    await assertSucceeds(getDoc(doc(guest, "guides", "g1")));
  });

  await test("El admin rechaza la otra; queda oculta para los demás", async () => {
    await assertSucceeds(updateDoc(doc(admin, "guides", "g2"), { status: "rejected", reviewNote: null, reviewedAt: serverTimestamp() }));
    await assertFails(getDoc(doc(other, "guides", "g2")));
    await assertSucceeds(getDoc(doc(author, "guides", "g2")));
  });

  await test("Nadie puede borrar guías (ni el admin)", async () => {
    await assertFails(deleteDoc(doc(author, "guides", "g1")));
    await assertFails(deleteDoc(doc(admin, "guides", "g1")));
  });

  await test("Con addDoc (id automático) también funciona", () =>
    assertSucceeds(addDoc(collection(author, "guides"), original())));
};
