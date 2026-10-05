// users: solo lo lee su dueño y no guarda correo ni teléfono
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const {
  doc, collection, getDoc, getDocs, setDoc, updateDoc, writeBatch, query, where, orderBy, startAt, endAt, limit, serverTimestamp
} = require("firebase/firestore");

const ME = "aaaMe";
const OTHER = "bbbOther";
const NEW = "cccNew";

module.exports = async ({ env, test, expect }) => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const f = ctx.firestore();
    for (const [uid, name] of [[ME, "Alfa"], [OTHER, "Alberto"]]) {
      await setDoc(doc(f, "users", uid), { username: name, usernameLower: name.toLowerCase(), language: "es" });
      await setDoc(doc(f, "publicProfiles", uid), { username: name, usernameLower: name.toLowerCase(), avatar: null, region: "México" });
    }
  });
  const me = env.authenticatedContext(ME).firestore();
  const guest = env.unauthenticatedContext().firestore();

  // ---------- El hueco de C1, cerrado ----------
  await test("Con sesión no puedo leer el users de otro (idioma y demás datos privados)", () =>
    assertFails(getDoc(doc(me, "users", OTHER))));
  await test("Con sesión no puedo listar toda la colección users", () =>
    assertFails(getDocs(collection(me, "users"))));
  await test("Tampoco buscando por usernameLower en users", () =>
    assertFails(getDocs(query(collection(me, "users"), orderBy("usernameLower"), startAt("al"), endAt("al\uf8ff"), limit(20)))));
  await test("Tampoco filtrando users por idioma", () =>
    assertFails(getDocs(query(collection(me, "users"), where("language", "==", "es")))));
  await test("Sin sesión no se lee users", () =>
    assertFails(getDoc(doc(guest, "users", ME))));

  // ---------- Lo que la app sí hace ----------
  await test("Mi propio users (useAuth / Mi perfil)", () => assertSucceeds(getDoc(doc(me, "users", ME))));
  await test("Buscar jugadores en publicProfiles", () =>
    assertSucceeds(getDocs(query(collection(me, "publicProfiles"), orderBy("usernameLower"), startAt("al"), endAt("al\uf8ff"), limit(20)))));
  await test("Perfil público de otro, con y sin sesión", async () => {
    await assertSucceeds(getDoc(doc(me, "publicProfiles", OTHER)));
    await assertSucceeds(getDoc(doc(guest, "publicProfiles", OTHER)));
  });

  // Login con Google/Steam: comprueba si existe users/{uid} y lo crea
  await test("Primer login: comprobar mi users (no existe) y crearlo", async () => {
    const f = env.authenticatedContext(NEW).firestore();
    await assertSucceeds(getDoc(doc(f, "users", NEW)));
    const batch = writeBatch(f);
    batch.set(doc(f, "users", NEW), { username: "Nuevo", usernameLower: "nuevo", avatar: null, region: null, createdAt: new Date() });
    batch.set(doc(f, "publicProfiles", NEW), { username: "Nuevo", usernameLower: "nuevo", avatar: null, region: null, createdAt: new Date() });
    await assertSucceeds(batch.commit());
  });

  await test("Guardar idioma y presencia en mi users", async () => {
    await assertSucceeds(updateDoc(doc(me, "users", ME), { language: "en" }));
    const batch = writeBatch(me);
    batch.update(doc(me, "users", ME), { lastSeen: serverTimestamp() });
    batch.set(doc(me, "publicProfiles", ME), { lastSeen: serverTimestamp() }, { merge: true });
    await assertSucceeds(batch.commit());
  });

  await test("No puedo escribir el users de otro", () =>
    assertFails(updateDoc(doc(me, "users", OTHER), { language: "en" })));

  // ---------- Sin correo ni teléfono en users ----------
  await test("Crear mi users con correo: no (el correo vive en Firebase Auth)", () => {
    const f = env.authenticatedContext("dddMail").firestore();
    return assertFails(setDoc(doc(f, "users", "dddMail"), { username: "Correo", usernameLower: "correo", email: "c@x.com" }));
  });
  await test("Crear mi users con teléfono: no", () => {
    const f = env.authenticatedContext("eeePhone").firestore();
    return assertFails(setDoc(doc(f, "users", "eeePhone"), { username: "Tel", usernameLower: "tel", phone: "555" }));
  });
  await test("Agregar correo o teléfono a mi users: no", async () => {
    await assertFails(updateDoc(doc(me, "users", ME), { email: "nuevo@x.com" }));
    await assertFails(updateDoc(doc(me, "users", ME), { phone: "555" }));
  });
  await test("Un users viejo que aún tiene correo no se puede editar (por eso el script va antes)", async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      setDoc(doc(ctx.firestore(), "users", "fffOld"), { username: "Viejo", usernameLower: "viejo", email: "v@x.com" }));
    const f = env.authenticatedContext("fffOld").firestore();
    await assertFails(updateDoc(doc(f, "users", "fffOld"), { language: "es" }));
  });
};
