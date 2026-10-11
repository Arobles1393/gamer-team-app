import { db } from "../../firebase/config";
import { doc, getDoc, runTransaction, serverTimestamp, updateDoc, writeBatch } from "firebase/firestore";
import { USERNAME_MAX } from "../../constants";
import { publicProfileRef, pickPublicFields } from "./publicProfileService";
import { buildMatchProfile, matchProfileRef } from "../matching/matchService";
import { allowedMediaUrl } from "../../utils/mediaUrls";
import { preferencesService } from "../preferences";

const userProfileExists = async (userId) => {
  const snapshot = await getDoc(doc(db, "users", userId));
  return snapshot.exists();
};

// ---------- Nombres únicos (auditoría M-08) ----------
// usernames/{nombre en minúsculas} = { createdAt }: reserva del nombre. Las
// reglas solo dejan crearla si no existe y en la misma operación en que el
// perfil toma ese nombre, así que dos cuentas nunca terminan con el mismo.
// No guarda el uid (se consulta sin sesión): de quién es lo dice el perfil
// (users/{uid}.usernameLower).

const usernameRef = (usernameLower) => doc(db, "usernames", usernameLower);

const cleanUsername = (username) => String(username ?? "").trim().slice(0, USERNAME_MAX);

// El nombre está en uso por otra cuenta (texto en auth:errors)
const usernameTakenError = () =>
  Object.assign(new Error("auth/username-taken"), { code: "auth/username-taken" });

// true si el nombre está libre. Funciona sin sesión: el registro avisa
// antes de crear la cuenta
const isUsernameAvailable = async (username) => {
  const lower = cleanUsername(username).toLowerCase();
  if (!lower) return false;
  return !(await getDoc(usernameRef(lower))).exists();
};

// Apodo genérico para empezar (Google y perfiles rehechos): el nombre de la
// cuenta de Google suele ser el nombre real, así que no se usa. La persona
// elige el suyo al entrar (AgeGateProvider, "Elige tu apodo")
export const genericUsername = () => `jugador_${Math.floor(100000 + Math.random() * 900000)}`;

// Para Google, Steam y perfiles rehechos: el nombre que traen, o el mismo con
// un número al final si ya está en uso
const suffixedCandidates = (username) => {
  const base = cleanUsername(username) || "jugador";
  const short = base.slice(0, USERNAME_MAX - 5);
  return [base, ...Array.from({ length: 6 }, () => `${short}_${Math.floor(1000 + Math.random() * 9000)}`)];
};

// Si el nombre cambia: reserva el nuevo (si ya está reservado, es de otra
// cuenta) y libera el anterior, que era de esta cuenta (lo dice su perfil)
const addRenameToBatch = async (batch, userRef, usernameLower) => {
  const previousLower = (await getDoc(userRef)).data()?.usernameLower ?? null;
  if (usernameLower === previousLower) return;
  if ((await getDoc(usernameRef(usernameLower))).exists()) throw usernameTakenError();
  batch.set(usernameRef(usernameLower), { createdAt: serverTimestamp() });
  if (previousLower && (await getDoc(usernameRef(previousLower))).exists()) {
    batch.delete(usernameRef(previousLower));
  }
};

// Solo el apodo ("Elige tu apodo" del primer inicio). Devuelve el guardado
const renameUser = async (userId, newUsername) => {
  const username = cleanUsername(newUsername);
  if (!username) throw Object.assign(new Error("profile/username-required"), { code: "profile/username-required" });
  const usernameLower = username.toLowerCase();
  const userRef = doc(db, "users", userId);
  const batch = writeBatch(db);
  await addRenameToBatch(batch, userRef, usernameLower);
  batch.update(userRef, { username, usernameLower });
  batch.set(publicProfileRef(userId), { username, usernameLower }, { merge: true });
  await batch.commit();
  return username;
};

// users, publicProfiles y matchProfiles se escriben juntos para que no se
// desincronicen. profileData.matchPreferences: undefined = no tocar
// matchProfiles (todavía no se cargaron); sin ningún dato = se borra.
// Si cambia el nombre, se reserva el nuevo y se libera el anterior.
const updateUserProfile = async (userId, profileData) => {
  const userRef = doc(db, "users", userId);

  // usernameLower tiene que ser exactamente username en minúsculas (firestore.rules)
  const username = cleanUsername(profileData.username);
  const usernameLower = username.toLowerCase();
  const data = {
    username,
    usernameLower,
    links: profileData.links,
    description: profileData.description,
    games: profileData.games,
    region: profileData.region
  };

  const batch = writeBatch(db);
  await addRenameToBatch(batch, userRef, usernameLower);

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
// users y publicProfiles de un perfil nuevo. createdAt con la hora del
// servidor (las reglas lo exigen)
// eslint-disable-next-line no-unused-vars
const buildNewProfile = ({ email, phone, ...profileData }, username) => {
  const userData = {
    ...profileData,
    // Foto de Google o Steam: si viene de otro dominio, sin avatar (las
    // reglas la rechazarían y el registro fallaría; auditoría B-23)
    ...("avatar" in profileData && { avatar: allowedMediaUrl("avatar", profileData.avatar) }),
    username,
    usernameLower: username.toLowerCase(),
    createdAt: serverTimestamp()
  };

  return {
    userData,
    publicData: pickPublicFields({ avatar: null, region: null, ...userData })
  };
};

// Crea el perfil y reserva su nombre en una transacción.
// autoSuffix false (registro): si el nombre está en uso, error.
// autoSuffix true (Google, Steam): prueba el nombre y luego con un número.
const createUserProfile = (userId, profileData, { autoSuffix = false } = {}) =>
  runTransaction(db, async (transaction) => {
    const candidates = autoSuffix ? suffixedCandidates(profileData.username) : [cleanUsername(profileData.username)];

    let username = null;
    for (const candidate of candidates) {
      if (!(await transaction.get(usernameRef(candidate.toLowerCase()))).exists()) {
        username = candidate;
        break;
      }
    }
    if (!username) throw usernameTakenError();

    const { userData, publicData } = buildNewProfile(profileData, username);
    transaction.set(doc(db, "users", userId), userData);
    transaction.set(publicProfileRef(userId), publicData);
    transaction.set(usernameRef(userData.usernameLower), { createdAt: serverTimestamp() });
  });

// Si la cuenta quedó sin perfil (el registro falló a medias), lo crea con lo
// básico y un apodo genérico (ni el nombre de la cuenta ni el correo, que
// suelen ser datos reales): al entrar se pide elegir uno. En una transacción
// que solo crea si no existe: nunca pisa un perfil que se haya escrito
// mientras tanto (auditoría M-13). true si lo creó.
const ensureUserProfile = async (user) => {
  // Antes del perfil, para que "Elige tu apodo" lo vea al leer las preferencias
  await preferencesService.setChooseUsername(user.uid, true).catch(() => {});
  const created = await createMissingProfile(user);
  if (!created) await preferencesService.setChooseUsername(user.uid, false).catch(() => {});
  return created;
};

const createMissingProfile = (user) =>
  runTransaction(db, async (transaction) => {
    const userRef = doc(db, "users", user.uid);
    if ((await transaction.get(userRef)).exists()) return false;

    let username = null;
    for (const candidate of suffixedCandidates(genericUsername())) {
      if (!(await transaction.get(usernameRef(candidate.toLowerCase()))).exists()) {
        username = candidate;
        break;
      }
    }
    if (!username) return false;

    const { userData, publicData } = buildNewProfile({ avatar: user.photoURL || null, region: null }, username);
    transaction.set(userRef, userData);
    transaction.set(publicProfileRef(user.uid), publicData);
    transaction.set(usernameRef(userData.usernameLower), { createdAt: serverTimestamp() });
    return true;
  });

export const profileService = {
  userProfileExists,
  isUsernameAvailable,
  updateUserProfile,
  renameUser,
  updateUserLanguage,
  createUserProfile,
  ensureUserProfile
};
