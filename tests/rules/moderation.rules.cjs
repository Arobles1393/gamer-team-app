// Moderación: motivo de reporte "parece menor de edad" y moderation_log
// (lo escribe solo la función moderate con Admin SDK; lo lee el admin).
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { addDoc, collection, doc, getDoc, getDocs, setDoc, deleteDoc, serverTimestamp } = require("firebase/firestore");

const ADMIN = "aaaAdmin";
const USER = "bbbUser";
const OTHER = "cccOther";

module.exports = async ({ env, test }) => {
  const verified = { email: "x@x.com", email_verified: true, firebase: { sign_in_provider: "password" } };
  const admin = env.authenticatedContext(ADMIN, { ...verified, admin: true }).firestore();
  const user = env.authenticatedContext(USER, verified).firestore();
  const guest = env.unauthenticatedContext().firestore();

  const report = (reason) => ({ reporterId: USER, targetType: "user", targetId: OTHER, reason, note: "", status: "pending", createdAt: serverTimestamp(), reviewedAt: null });

  await test("Reportar a alguien que parece menor de edad (underage)", () =>
    assertSucceeds(addDoc(collection(user, "reports"), report("underage"))));
  await test("Un motivo que no existe: no", () =>
    assertFails(addDoc(collection(user, "reports"), report("minor"))));

  await env.withSecurityRulesDisabled((ctx) =>
    setDoc(doc(ctx.firestore(), "moderation_log", "log1"), { adminId: ADMIN, action: "deletePost", targetType: "post", targetId: "p1", authorId: OTHER, reportId: null, done: true, createdAt: new Date() }));

  await test("El admin lee el registro de moderación", async () => {
    await assertSucceeds(getDoc(doc(admin, "moderation_log", "log1")));
    await assertSucceeds(getDocs(collection(admin, "moderation_log")));
  });
  await test("Un usuario no lo lee", () => assertFails(getDoc(doc(user, "moderation_log", "log1"))));
  await test("Sin sesión no se lee", () => assertFails(getDoc(doc(guest, "moderation_log", "log1"))));
  await test("Nadie lo escribe desde la app, tampoco el admin", async () => {
    await assertFails(addDoc(collection(admin, "moderation_log"), { adminId: ADMIN, action: "deletePost" }));
    await assertFails(setDoc(doc(admin, "moderation_log", "log1"), { done: false }, { merge: true }));
    await assertFails(deleteDoc(doc(admin, "moderation_log", "log1")));
  });
};
