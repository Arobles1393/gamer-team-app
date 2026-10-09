import { db } from "../../firebase/config";
import { doc, getDoc, runTransaction, serverTimestamp, updateDoc, writeBatch } from "firebase/firestore";
import { USERNAME_MAX } from "../../constants";
import { publicProfileRef, pickPublicFields } from "./publicProfileService";
import { buildMatchProfile, matchProfileRef } from "../matching/matchService";
import { allowedMediaUrl } from "../../utils/mediaUrls";

const userProfileExists = async (userId) => {
  const snapshot = await getDoc(doc(db, "users", userId));
  return snapshot.exists();
};

// ---------- Nombres únicos (auditoría M-08) ----------
// usernames/{nombre en minúsculas} = { uid }: reserva del nombre. Las reglas
// solo dejan crearla si no existe y en la misma operación en que el perfil
// toma ese nombre, así que dos cuentas nunca terminan con el mismo.

const usernameRef = (usernameLower) => doc(db, "usernames", usernameLower);

const cleanUsername = (username) => String(username ?? "").trim().slice(0, USERNAME_MAX);

// El nombre está en uso por otra cuenta (texto en auth:errors)
const usernameTakenError = () =>
  Object.assign(new Error("auth/username-taken"), { code: "auth/username-taken" });

// true si el nombre está libre o ya es de esta cuenta. Funciona sin sesión:
// el registro avisa antes de crear la cuenta
const isUsernameAvailable = async (username, userId = null) => {
  const lower = cleanUsername(username).toLowerCase();
  if (!lower) return false;
  const snap = await getDoc(usernameRef(lower));
  return !snap.exists() || snap.data().uid === userId;
};

// Para Google, Steam y perfiles rehechos: el nombre que traen, o el mismo con
// un número al final si ya está en uso
const suffixedCandidates = (username) => {
  const base = cleanUsername(username) || "jugador";
  const short = base.slice(0, USERNAME_MAX - 5);
  return [base, ...Array.from({ length: 6 }, () => `${short}_${Math.floor(1000 + Math.random() * 9000)}`)];
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

  const previousLower = (await getDoc(userRef)).data()?.usernameLower ?? null;
  if (usernameLower !== previousLower) {
    const reserved = await getDoc(usernameRef(usernameLower));
    if (reserved.exists() && reserved.data().uid !== userId) throw usernameTakenError();
    if (!reserved.exists()) {
      batch.set(usernameRef(usernameLower), { uid: userId, createdAt: serverTimestamp() });
    }
    if (previousLower) {
      const previous = await getDoc(usernameRef(previousLower));
      if (previous.exists() && previous.data().uid === userId) batch.delete(usernameRef(previousLower));
    }
  }

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
      const reserved = await transaction.get(usernameRef(candidate.toLowerCase()));
      if (!reserved.exists() || reserved.data().uid === userId) {
        username = candidate;
        break;
      }
    }
    if (!username) throw usernameTakenError();

    const { userData, publicData } = buildNewProfile(profileData, username);
    transaction.set(doc(db, "users", userId), userData);
    transaction.set(publicProfileRef(userId), publicData);
    transaction.set(usernameRef(userData.usernameLower), { uid: userId, createdAt: serverTimestamp() });
  });

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

    let username = null;
    for (const candidate of suffixedCandidates(fallbackUsername(user))) {
      const reserved = await transaction.get(usernameRef(candidate.toLowerCase()));
      if (!reserved.exists() || reserved.data().uid === user.uid) {
        username = candidate;
        break;
      }
    }
    if (!username) return false;

    const { userData, publicData } = buildNewProfile({ avatar: user.photoURL || null, region: null }, username);
    transaction.set(userRef, userData);
    transaction.set(publicProfileRef(user.uid), publicData);
    transaction.set(usernameRef(userData.usernameLower), { uid: user.uid, createdAt: serverTimestamp() });
    return true;
  });

export const profileService = {
  userProfileExists,
  isUsernameAvailable,
  updateUserProfile,
  updateUserLanguage,
  createUserProfile,
  ensureUserProfile
};
