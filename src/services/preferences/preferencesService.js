import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { LEGAL_VERSIONS } from "../../legal/legalConfig";

// users/{uid}/private/preferences: preferencias privadas de la cuenta
// (solo las lee y escribe su dueño, ver firestore.rules). Campos:
// - onboarding: { completed, showAgain, completedVersion } (guía de bienvenida)
// - legalConsent: { termsVersion, privacyVersion, acceptedAt }
const preferencesRef = (uid) => doc(db, "users", uid, "private", "preferences");

// Una sola lectura (sin listener). null si todavía no existe el documento
const getPreferences = async (uid) => {
  const snapshot = await getDoc(preferencesRef(uid));
  return snapshot.exists() ? snapshot.data() : null;
};

// Escribe solo lo que se pasa; el resto del documento se conserva
const updatePreferences = (uid, partial) =>
  setDoc(preferencesRef(uid), partial, { merge: true });

// Aceptación de Términos y Privacidad con las versiones vigentes
const saveLegalConsent = (uid) =>
  updatePreferences(uid, {
    legalConsent: {
      termsVersion: LEGAL_VERSIONS.terms,
      privacyVersion: LEGAL_VERSIONS.privacy,
      acceptedAt: serverTimestamp()
    }
  });

export const preferencesService = {
  getPreferences,
  updatePreferences,
  saveLegalConsent
};
