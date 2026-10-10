import { doc } from "firebase/firestore";
import { db } from "../../firebase/config";

// publicProfiles/{uid}: todo lo del perfil que pueden ver los demás (sin
// sesión, uno por su id; listar o buscar pide sesión). users/{uid} además
// guarda el idioma, que solo ve su dueño; el correo vive solo en Firebase
// Auth y el teléfono ya no se pide. Misma lista en firestore.rules
// (publicProfiles) y en functions/scripts/backfillPublicProfiles.js.
export const PUBLIC_PROFILE_FIELDS = [
  "username",
  "usernameLower",
  "avatar",
  "banner",
  "region",
  "description",
  "games",
  "links",
  "lastSeen",
  "createdAt"
];

export const publicProfileRef = (userId) =>
  doc(db, "publicProfiles", userId);

// Toma solo los campos públicos presentes en `data`
export const pickPublicFields = (data) =>
  Object.fromEntries(
    PUBLIC_PROFILE_FIELDS
      .filter((field) => data[field] !== undefined)
      .map((field) => [field, data[field] ?? null])
  );
