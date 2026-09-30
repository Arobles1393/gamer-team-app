import { doc } from "firebase/firestore";
import { db } from "../../firebase/config";

// publicProfiles/{uid}: lo único del perfil que ven los visitantes sin sesión.
// users/{uid} también guarda correo y teléfono, que no deben ser públicos.
export const PUBLIC_PROFILE_FIELDS = ["username", "avatar", "region"];

export const publicProfileRef = (userId) =>
  doc(db, "publicProfiles", userId);

// Toma solo los campos públicos presentes en `data`
export const pickPublicFields = (data) =>
  Object.fromEntries(
    PUBLIC_PROFILE_FIELDS
      .filter((field) => data[field] !== undefined)
      .map((field) => [field, data[field] ?? null])
  );
