// Versión de cada documento: se guarda con el consentimiento (legalConsent)
// para saber qué versión aceptó cada usuario
export const LEGAL_VERSIONS = { terms: "provisional-4", privacy: "provisional-6" };

// Casilla "He leído y acepto..." en el registro. Se pondrá en true cuando
// el contenido real exista
export const REQUIRE_LEGAL_CONSENT = false;

// Texto que marca una sección sin redactar (activa el aviso de borrador)
export const PENDING_MARK = "[PENDIENTE";

// Único idioma con contenido por ahora; los demás caen a este
export const LEGAL_FALLBACK_LANGUAGE = "es";

// Edad mínima para usar el servicio (Términos: "Quién puede usar el
// servicio"). Se confirma en el registro y, en Google y Steam, en el primer
// inicio (AgeGate); se guarda en users/{uid}/private/preferences.ageConfirmation.
// La misma edad está en firestore.rules (validAgeConfirmation)
export const MIN_AGE = 18;
