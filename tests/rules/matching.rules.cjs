// matchProfiles: preferencias de juego para "Compatibles contigo".
// Solo con sesión se leen, solo el dueño las escribe y solo con valores de
// las listas fijas (nada de texto libre).
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const {
  doc, collection, getDoc, getDocs, setDoc, deleteDoc, query, where, limit, serverTimestamp, Timestamp
} = require("firebase/firestore");

const OWNER = "aaaOwner";
const OTHER = "bbbOther";

const preferences = (overrides = {}) => ({
  schedule: ["evening"],
  platforms: ["pc"],
  requiresMic: true,
  groupSize: "squad",
  skillLevel: "competitive",
  languages: ["es"],
  values: ["no_rage", "team_player"],
  ...overrides
});

const profile = (overrides = {}) => ({
  preferences: preferences(),
  gameIds: ["3498", "4200"],
  region: "MX",
  updatedAt: serverTimestamp(),
  ...overrides
});

module.exports = async ({ env, test }) => {
  const owner = env.authenticatedContext(OWNER).firestore();
  const other = env.authenticatedContext(OTHER).firestore();
  const guest = env.unauthenticatedContext().firestore();
  const ownerRef = (db) => doc(db, "matchProfiles", OWNER);

  // ---------- Escribir ----------
  await test("El dueño guarda sus preferencias", () =>
    assertSucceeds(setDoc(ownerRef(owner), profile())));

  await test("Sin preferencia de micrófono, grupo ni nivel (null)", () =>
    assertSucceeds(setDoc(ownerRef(owner), profile({
      preferences: preferences({ requiresMic: null, groupSize: null, skillLevel: null })
    }))));

  await test("Otro usuario no puede escribir las preferencias de alguien más", () =>
    assertFails(setDoc(ownerRef(other), profile())));

  await test("Sin sesión no se puede escribir", () =>
    assertFails(setDoc(ownerRef(guest), profile())));

  await test("No se acepta un valor libre en lo que valoras (texto inventado)", () =>
    assertFails(setDoc(ownerRef(owner), profile({ preferences: preferences({ values: ["es un tóxico"] }) }))));

  await test("No se acepta un horario fuera de la lista", () =>
    assertFails(setDoc(ownerRef(owner), profile({ preferences: preferences({ schedule: ["siempre"] }) }))));

  await test("No se acepta una plataforma fuera de la lista", () =>
    assertFails(setDoc(ownerRef(owner), profile({ preferences: preferences({ platforms: ["atari"] }) }))));

  await test("No se acepta un tamaño de grupo inventado", () =>
    assertFails(setDoc(ownerRef(owner), profile({ preferences: preferences({ groupSize: "raid" }) }))));

  await test("No se acepta un nivel inventado", () =>
    assertFails(setDoc(ownerRef(owner), profile({ preferences: preferences({ skillLevel: "pro" }) }))));

  await test("requiresMic solo true, false o null", () =>
    assertFails(setDoc(ownerRef(owner), profile({ preferences: preferences({ requiresMic: "sí" }) }))));

  await test("Máximo 5 idiomas", () =>
    assertFails(setDoc(ownerRef(owner), profile({ preferences: preferences({ languages: ["es", "en", "pt", "fr", "de", "it"] }) }))));

  await test("No se agregan campos extra a las preferencias (p. ej. una nota)", () =>
    assertFails(setDoc(ownerRef(owner), profile({ preferences: { ...preferences(), note: "texto libre" } }))));

  await test("No falta ningún campo de las preferencias", () => {
    const { values, ...incomplete } = preferences();
    return assertFails(setDoc(ownerRef(owner), profile({ preferences: incomplete })));
  });

  await test("No se agregan campos extra al documento", () =>
    assertFails(setDoc(ownerRef(owner), profile({ rating: 5 }))));

  await test("No se puede inventar la fecha", () =>
    assertFails(setDoc(ownerRef(owner), profile({ updatedAt: Timestamp.fromMillis(Date.now() - 86400000) }))));

  // ---------- Leer ----------
  await assertSucceeds(setDoc(ownerRef(owner), profile()));

  await test("Otro usuario con sesión puede leerlas (para calcular la compatibilidad)", () =>
    assertSucceeds(getDoc(ownerRef(other))));

  await test("Sin sesión no se pueden leer", () =>
    assertFails(getDoc(ownerRef(guest))));

  await test("Consulta por juegos en común (array-contains-any) con sesión", () =>
    assertSucceeds(getDocs(query(
      collection(other, "matchProfiles"),
      where("gameIds", "array-contains-any", ["3498"]),
      limit(50)
    ))));

  await test("Sin sesión no se puede consultar", () =>
    assertFails(getDocs(query(collection(guest, "matchProfiles"), where("gameIds", "array-contains-any", ["3498"])))));

  // ---------- Borrar ----------
  await test("Otro usuario no puede borrar las preferencias de alguien", () =>
    assertFails(deleteDoc(ownerRef(other))));

  await test("El dueño las borra (quitar todas = salir de las sugerencias)", () =>
    assertSucceeds(deleteDoc(ownerRef(owner))));
};
