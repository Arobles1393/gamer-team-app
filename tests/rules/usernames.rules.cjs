// Nombres de usuario únicos (auditoría M-08): usernames/{usernameLower}
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const {
  doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, Timestamp
} = require("firebase/firestore");

const A = "aaaAna";
const B = "bbbBea";
const S = "steam:76561198000000001";

module.exports = async ({ env, test }) => {
  const db = (uid) => env.authenticatedContext(uid).firestore();
  const anon = env.unauthenticatedContext().firestore();

  // profileService.createUserProfile: perfil + reserva en una operación
  const register = (uid, username, { reserve = true, reserveAs = null } = {}) => {
    const s = db(uid);
    const batch = writeBatch(s);
    const lower = username.toLowerCase();
    const profile = { username, usernameLower: lower, region: null, createdAt: serverTimestamp() };
    batch.set(doc(s, "users", uid), profile);
    batch.set(doc(s, "publicProfiles", uid), { ...profile, avatar: null });
    if (reserve) batch.set(doc(s, "usernames", reserveAs ?? lower), { uid, createdAt: serverTimestamp() });
    return batch.commit();
  };

  // profileService.updateUserProfile con cambio de nombre
  const rename = (uid, from, to, { release = true, reserve = true } = {}) => {
    const s = db(uid);
    const batch = writeBatch(s);
    if (reserve) batch.set(doc(s, "usernames", to.toLowerCase()), { uid, createdAt: serverTimestamp() });
    if (release) batch.delete(doc(s, "usernames", from.toLowerCase()));
    const data = { username: to, usernameLower: to.toLowerCase() };
    batch.update(doc(s, "users", uid), data);
    batch.set(doc(s, "publicProfiles", uid), data, { merge: true });
    return batch.commit();
  };

  await test("registrarse reserva el nombre", () => assertSucceeds(register(A, "Ana")));

  await test("otra cuenta no puede registrarse con el mismo nombre (aunque cambien mayúsculas)", () =>
    assertFails(register(B, "ANA")));

  await test("no se puede tomar un nombre sin reservarlo", () =>
    assertFails(register(B, "Bea", { reserve: false })));

  await test("no se puede reservar un nombre distinto del que usa el perfil", () =>
    assertFails(register(B, "Bea", { reserveAs: "otro" })));

  await test("no se puede reservar un nombre a nombre de otra cuenta", () =>
    assertFails(setDoc(doc(db(B), "usernames", "fantasma"), { uid: A, createdAt: serverTimestamp() })));

  await test("cuenta de Steam con su nombre", () => assertSucceeds(register(S, "Steamer")));

  await test("Bea se registra con su propio nombre", () => assertSucceeds(register(B, "Bea")));

  await test("cambiar de nombre sin reservar el nuevo: rechazado", () =>
    assertFails(rename(A, "Ana", "AnaGamer", { reserve: false })));

  await test("cambiar al nombre de otra cuenta: rechazado", () => assertFails(rename(A, "Ana", "bea")));

  await test("cambiar de nombre reserva el nuevo y libera el anterior", () => assertSucceeds(rename(A, "Ana", "AnaGamer")));

  await test("el nombre anterior queda libre para otra cuenta", async () => {
    await assertSucceeds(env.withSecurityRulesDisabled((ctx) => deleteDoc(doc(ctx.firestore(), "usernames", "bea"))));
    await assertSucceeds(rename(B, "Bea", "Ana", { release: false }));
  });

  await test("no se puede borrar la reserva de otra cuenta", () =>
    assertFails(deleteDoc(doc(db(B), "usernames", "anagamer"))));

  await test("no se puede borrar la propia reserva mientras se usa", () =>
    assertFails(deleteDoc(doc(db(A), "usernames", "anagamer"))));

  await test("no se puede modificar una reserva", () =>
    assertFails(updateDoc(doc(db(A), "usernames", "anagamer"), { uid: B })));

  await test("sin sesión se puede consultar un nombre (el registro avisa antes)", () =>
    assertSucceeds(getDoc(doc(anon, "usernames", "anagamer"))));

  await test("pero no listar todos los nombres", () =>
    assertFails(getDocs(collection(anon, "usernames"))));

  await test("un perfil viejo sin reserva puede editar su descripción", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const s = ctx.firestore();
      await setDoc(doc(s, "users", "vvvViejo"), { username: "Viejo", usernameLower: "viejo", createdAt: Timestamp.now() });
      await setDoc(doc(s, "publicProfiles", "vvvViejo"), { username: "Viejo", usernameLower: "viejo", createdAt: Timestamp.now() });
    });
    const s = db("vvvViejo");
    const batch = writeBatch(s);
    batch.update(doc(s, "users", "vvvViejo"), { description: "hola" });
    batch.set(doc(s, "publicProfiles", "vvvViejo"), { description: "hola" }, { merge: true });
    await assertSucceeds(batch.commit());
  });
};
