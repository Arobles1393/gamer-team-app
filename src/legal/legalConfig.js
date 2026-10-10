// Versión de cada documento: se guarda con el consentimiento (legalConsent)
// para saber qué versión aceptó cada usuario
export const LEGAL_VERSIONS = { terms: "provisional-1", privacy: "provisional-1" };

// Casilla "He leído y acepto..." en el registro. Se pondrá en true cuando
// el contenido real exista
export const REQUIRE_LEGAL_CONSENT = false;

// Texto que marca una sección sin redactar (activa el aviso de borrador)
export const PENDING_MARK = "[PENDIENTE";

// Único idioma con contenido por ahora; los demás caen a este
export const LEGAL_FALLBACK_LANGUAGE = "es";
