import { doc } from "firebase/firestore";
import { db } from "../../firebase/config";

// publicProfiles/{uid}: todo lo del perfil que pueden ver los demás (con o
// sin sesión). users/{uid} además guarda correo, teléfono e idioma, que solo
// ve su dueño. Misma lista en firestore.rules (publicProfiles) y en
// functions/scripts/backfillPublicProfiles.js.
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
