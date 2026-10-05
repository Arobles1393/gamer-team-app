// Contenido de los documentos legales en español. SOLO un esqueleto: los
// títulos son neutros y cada cuerpo dice "[PENDIENTE: ...]" hasta que se
// redacte el texto real. No es texto legal.
// Cada documento: { updatedAt: "AAAA-MM-DD" | null, sections: [{ id, title, body: [párrafos] }] }
const PENDING = ["[PENDIENTE: redactar esta sección]"];

const section = (id, title) => ({ id, title, body: PENDING });

export const privacy = {
  updatedAt: null,
  sections: [
    section("datos", "Qué datos recopilamos"),
    section("uso", "Para qué los usamos"),
    section("terceros", "Con quién se comparten (proveedores externos)"),
    section("conservacion", "Cuánto tiempo se conservan"),
    section("derechos", "Tus derechos y cómo eliminar tu cuenta"),
    section("menores", "Menores de edad"),
    section("contacto", "Contacto"),
    section("cambios", "Cambios a esta política")
  ]
};

export const terms = {
  updatedAt: null,
  sections: [
    section("quien", "Quién puede usar GamerMatch"),
    section("cuenta", "Tu cuenta"),
    section("contenido", "Contenido que publicas"),
    section("conductas", "Conductas no permitidas"),
    section("moderacion", "Moderación, reportes y bloqueos"),
    section("terceros", "Enlaces y servicios de terceros"),
    section("responsabilidad", "Limitación de responsabilidad"),
    section("eliminacion", "Eliminación de cuentas"),
    section("cambios", "Cambios a estos términos"),
    section("contacto", "Contacto")
  ]
};
