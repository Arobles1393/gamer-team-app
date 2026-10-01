// publicProfiles: campos públicos, presencia y fecha de alta
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { doc, getDoc, setDoc, writeBatch, serverTimestamp, Timestamp } = require("firebase/firestore");

const A = "aaaUser1";
const B = "bbbUser2";
const PUBLIC_FIELDS = ["username", "usernameLower", "avatar", "banner", "region", "description", "games", "links", "lastSeen", "createdAt"];
const pick = (data) => Object.fromEntries(PUBLIC_FIELDS.filter((f) => data[f] !== undefined).map((f) => [f, data[f] ?? null]));

module.exports = async ({ env, test, expect }) => {
  const db = (uid) => env.authenticatedContext(uid).firestore();
  const pub = (f, uid) => doc(f, "publicProfiles", uid);

  // Igual que profileService.createUserProfile
  await test("Crear perfil: users + publicProfiles con los campos públicos", () => {
    const f = db(A);
    const userData = { email: "a@b.com", username: "Alfa", avatar: null, region: "México", usernameLower: "alfa", createdAt: new Date() };
    const batch = writeBatch(f);
    batch.set(doc(f, "users", A), userData);
    batch.set(pub(f, A), pick({ avatar: null, region: null, ...userData }));
    return assertSucceeds(batch.commit());
  });

  // Igual que profileService.updateUserProfile
  await test("Editar perfil: los campos públicos nuevos se copian", () => {
    const f = db(A);
    const data = { username: "Alfa", usernameLower: "alfa", phone: "555", links: ["https://x.com/a"], description: "hola", games: [{ id: 1, name: "Valorant" }], region: "Chile" };
    const batch = writeBatch(f);
    batch.update(doc(f, "users", A), data);
    batch.set(pub(f, A), pick(data), { merge: true });
    return assertSucceeds(batch.commit());
  });

  // Igual que profileImageService.uploadProfileImage
  await test("Avatar y portada: ambos públicos", async () => {
    for (const type of ["avatar", "banner"]) {
      const f = db(A);
      const data = { [type]: `https://img/${type}` };
      const batch = writeBatch(f);
      batch.update(doc(f, "users", A), data);
      batch.set(pub(f, A), pick(data), { merge: true });
      await assertSucceeds(batch.commit());
    }
  });

  // Igual que userService.updateUserPresence
  await test("Presencia: lastSeen del servidor en users y publicProfiles", () => {
    const f = db(A);
    const data = { lastSeen: serverTimestamp() };
    const batch = writeBatch(f);
    batch.update(doc(f, "users", A), data);
    batch.set(pub(f, A), data, { merge: true });
    return assertSucceeds(batch.commit());
  });

  await test("El perfil público tiene todo lo público y nada privado", () => env.withSecurityRulesDisabled(async (ctx) => {
    const data = (await getDoc(pub(ctx.firestore(), A))).data();
    const keys = Object.keys(data).sort();
    expect(!("email" in data) && !("phone" in data) && !("language" in data), `privados: ${keys}`);
    expect(["avatar", "banner", "createdAt", "description", "games", "lastSeen", "links", "region", "username", "usernameLower"].every((k) => keys.includes(k)), `faltan: ${keys}`);
  }));

  await test("No se puede publicar el correo en publicProfiles", () =>
    assertFails(setDoc(pub(db(A), A), { email: "a@b.com" }, { merge: true })));

  await test("No se puede publicar el teléfono ni el idioma", async () => {
    await assertFails(setDoc(pub(db(A), A), { phone: "555" }, { merge: true }));
    await assertFails(setDoc(pub(db(A), A), { language: "en" }, { merge: true }));
  });

  await test("No se puede inventar un lastSeen (siempre en línea)", () =>
    assertFails(setDoc(pub(db(A), A), { lastSeen: Timestamp.fromMillis(Date.now() + 365 * 86400000) }, { merge: true })));

  await test("No se puede cambiar 'Miembro desde' (createdAt)", () =>
    assertFails(setDoc(pub(db(A), A), { createdAt: Timestamp.fromMillis(0) }, { merge: true })));

  await test("Otro usuario no puede escribir mi perfil público", () =>
    assertFails(setDoc(pub(db(B), A), { description: "hackeado" }, { merge: true })));

  await test("Cualquiera (incluso sin sesión) lee los perfiles públicos", async () => {
    await assertSucceeds(getDoc(pub(env.unauthenticatedContext().firestore(), A)));
    await assertSucceeds(getDoc(pub(db(B), A)));
  });
};
