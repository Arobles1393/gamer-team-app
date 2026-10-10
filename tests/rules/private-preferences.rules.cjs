// users/{uid}/private/preferences: guía de bienvenida, consentimiento legal,
// "Unirme en Steam" y confirmación de edad. Solo el dueño, solo el documento
// "preferences", solo esos campos, y sin pedir el correo verificado.
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { doc, getDoc, setDoc, deleteDoc, serverTimestamp } = require("firebase/firestore");

const ME = "aaaMe";
const OTHER = "bbbOther";

module.exports = async ({ env, test }) => {
  const unverified = env.authenticatedContext(ME, { email: "me@x.com", email_verified: false, firebase: { sign_in_provider: "password" } }).firestore();
  const other = env.authenticatedContext(OTHER).firestore();
  const guest = env.unauthenticatedContext().firestore();
  const prefs = (db, uid = ME) => doc(db, "users", uid, "private", "preferences");
  const onboarding = { completed: true, showAgain: false, completedVersion: 1 };

  await test("Leer mis preferencias aunque el documento no exista todavía", () =>
    assertSucceeds(getDoc(prefs(unverified))));

  await test("Sin verificar el correo: guardo la respuesta de la guía (merge)", () =>
    assertSucceeds(setDoc(prefs(unverified), { onboarding }, { merge: true })));

  await test("Actualizo la respuesta", () =>
    assertSucceeds(setDoc(prefs(unverified), { onboarding: { ...onboarding, showAgain: true } }, { merge: true })));

  await test("Guardo el consentimiento legal junto a la guía", () =>
    assertSucceeds(setDoc(prefs(unverified), {
      legalConsent: { termsVersion: "borrador-0", privacyVersion: "borrador-0", acceptedAt: serverTimestamp() }
    }, { merge: true })));

  await test("Leo mis preferencias", () => assertSucceeds(getDoc(prefs(unverified))));

  await test("Otro usuario no puede leerlas", () => assertFails(getDoc(prefs(other, ME))));
  await test("Sin sesión no se pueden leer", () => assertFails(getDoc(prefs(guest, ME))));
  await test("Otro usuario no puede escribirlas", () =>
    assertFails(setDoc(prefs(other, ME), { onboarding }, { merge: true })));

  await test("No se aceptan otros campos", () =>
    assertFails(setDoc(prefs(unverified), { theme: "light" }, { merge: true })));

  await test("Solo el documento preferences (no otros en private)", () =>
    assertFails(setDoc(doc(unverified, "users", ME, "private", "otro"), { onboarding })));

  await test("No se pueden borrar", () => assertFails(deleteDoc(prefs(unverified))));

  // ---------- privacy.allowSteamJoin ("Unirme en Steam") ----------
  await test("Sin verificar el correo: activo y desactivo Unirme en Steam", async () => {
    await assertSucceeds(setDoc(prefs(unverified), { privacy: { allowSteamJoin: true } }, { merge: true }));
    await assertSucceeds(setDoc(prefs(unverified), { privacy: { allowSteamJoin: false } }, { merge: true }));
  });
  await test("allowSteamJoin solo booleano", () =>
    assertFails(setDoc(prefs(unverified), { privacy: { allowSteamJoin: "sí" } }, { merge: true })));
  await test("privacy no acepta otros campos", () =>
    assertFails(setDoc(prefs(unverified), { privacy: { allowSteamJoin: true, shareIp: true } }, { merge: true })));
  await test("Otro usuario no puede activarlo por mí", () =>
    assertFails(setDoc(prefs(other, ME), { privacy: { allowSteamJoin: true } }, { merge: true })));

  // ---------- ageConfirmation ("Tengo 18 años o más") ----------
  const NEW = "cccNew";
  const fresh = env.authenticatedContext(NEW, { email: "n@x.com", email_verified: false, firebase: { sign_in_provider: "password" } }).firestore();
  await test("Sin verificar y sin documento previo (registro): confirmo la edad", () =>
    assertSucceeds(setDoc(prefs(fresh, NEW), { ageConfirmation: { minAge: 18, confirmedAt: serverTimestamp() } }, { merge: true })));
  await test("Después guardo otras preferencias y la confirmación se conserva", async () => {
    await assertSucceeds(setDoc(prefs(fresh, NEW), { onboarding }, { merge: true }));
    const data = (await getDoc(prefs(fresh, NEW))).data();
    if (data?.ageConfirmation?.minAge !== 18) throw new Error("se perdió ageConfirmation");
  });
  await test("Confirmo la edad sobre preferencias que ya existen", () =>
    assertSucceeds(setDoc(prefs(unverified), { ageConfirmation: { minAge: 18, confirmedAt: serverTimestamp() } }, { merge: true })));
  await test("Edad mínima distinta de 18: no", () =>
    assertFails(setDoc(prefs(unverified), { ageConfirmation: { minAge: 13, confirmedAt: serverTimestamp() } }, { merge: true })));
  await test("Fecha inventada (no la del servidor): no", () =>
    assertFails(setDoc(prefs(unverified), { ageConfirmation: { minAge: 18, confirmedAt: new Date("2020-01-01") } }, { merge: true })));
  // Con un usuario sin confirmación previa: con merge, la fecha guardada se
  // conservaría y el resultado sería igual al anterior (permitido)
  const LATE = "dddLate";
  const late = env.authenticatedContext(LATE).firestore();
  await test("Sin fecha: no", () =>
    assertFails(setDoc(prefs(late, LATE), { ageConfirmation: { minAge: 18 } }, { merge: true })));
  await test("Campos extra (fecha de nacimiento): no", () =>
    assertFails(setDoc(prefs(unverified), { ageConfirmation: { minAge: 18, confirmedAt: serverTimestamp(), birthDate: "2000-01-01" } }, { merge: true })));
  await test("No es un mapa: no", () =>
    assertFails(setDoc(prefs(unverified), { ageConfirmation: true }, { merge: true })));
  await test("Otro usuario no puede confirmarla por mí", () =>
    assertFails(setDoc(prefs(other, ME), { ageConfirmation: { minAge: 18, confirmedAt: serverTimestamp() } }, { merge: true })));
};
