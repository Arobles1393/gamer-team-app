import { db } from "../../firebase/config";
import { doc, getDoc, runTransaction, serverTimestamp, updateDoc, writeBatch } from "firebase/firestore";
import { USERNAME_MAX } from "../../constants";
import { publicProfileRef, pickPublicFields } from "./publicProfileService";
import { buildMatchProfile, matchProfileRef } from "../matching/matchService";

const userProfileExists = async (userId) => {
  const snapshot = await getDoc(doc(db, "users", userId));
  return snapshot.exists();
};

// users, publicProfiles y matchProfiles se escriben juntos para que no se
// desincronicen. profileData.matchPreferences: undefined = no tocar
// matchProfiles (todavía no se cargaron); sin ningún dato = se borra.
const updateUserProfile = async (userId, profileData) => {
  const userRef = doc(db, "users", userId);

  // usernameLower tiene que ser exactamente username en minúsculas (firestore.rules)
  const username = profileData.username.trim();
  const data = {
    username,
    usernameLower: username.toLowerCase(),
    links: profileData.links,
    description: profileData.description,
    games: profileData.games,
    region: profileData.region
  };

  const batch = writeBatch(db);
  batch.update(userRef, data);
  batch.set(publicProfileRef(userId), pickPublicFields(data), { merge: true });

  if (profileData.matchPreferences !== undefined) {
    const matchProfile = buildMatchProfile({
      preferences: profileData.matchPreferences,
      games: data.games,
      region: data.region
    });

    if (matchProfile) {
      batch.set(matchProfileRef(userId), matchProfile);
    } else {
      batch.delete(matchProfileRef(userId));
    }
  }

  await batch.commit();
};

// Idioma de la interfaz elegido en Mi perfil. Solo vive en users (no es público)
const updateUserLanguage = (userId, language) =>
  updateDoc(doc(db, "users", userId), { language });

// users/{uid} no guarda correo ni teléfono: el correo vive solo en Firebase
// Auth (user.email) y el teléfono ya no se pide. firestore.rules rechaza
// esos campos.
// users y publicProfiles de un perfil nuevo. Nombre recortado al límite de
// firestore.rules (Google puede traer uno largo); createdAt con la hora del
// servidor (las reglas lo exigen)
// eslint-disable-next-line no-unused-vars
const buildNewProfile = ({ email, phone, ...profileData }) => {
  const username = profileData.username.trim().slice(0, USERNAME_MAX);

  const userData = {
    ...profileData,
    username,
    usernameLower: username.toLowerCase(),
    createdAt: serverTimestamp()
  };

  return {
    userData,
    publicData: pickPublicFields({ avatar: null, region: null, ...userData })
  };
};

const createUserProfile = async (userId, profileData) => {
  const { userData, publicData } = buildNewProfile(profileData);
  const batch = writeBatch(db);
  batch.set(doc(db, "users", userId), userData);
  batch.set(publicProfileRef(userId), publicData);
  await batch.commit();
};

// Nombre para un perfil que hay que rehacer: el de la cuenta, la parte del
// correo antes de la @, o "jugador_xxxxxx"
const fallbackUsername = (user) =>
  (user.displayName || user.email?.split("@")[0] || "").trim() || `jugador_${user.uid.slice(-6)}`;

// Si la cuenta quedó sin perfil (el registro falló a medias), lo crea con lo
// básico. En una transacción que solo crea si no existe: nunca pisa un perfil
// que se haya escrito mientras tanto (auditoría M-13). true si lo creó.
const ensureUserProfile = (user) =>
  runTransaction(db, async (transaction) => {
    const userRef = doc(db, "users", user.uid);
    if ((await transaction.get(userRef)).exists()) return false;

    const { userData, publicData } = buildNewProfile({
      username: fallbackUsername(user),
      avatar: user.photoURL || null,
      region: null
    });
    transaction.set(userRef, userData);
    transaction.set(publicProfileRef(user.uid), publicData);
    return true;
  });

export const profileService = {
  userProfileExists,
  updateUserProfile,
  updateUserLanguage,
  createUserProfile,
  ensureUserProfile
};
