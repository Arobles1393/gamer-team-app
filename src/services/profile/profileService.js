import { db } from "../../firebase/config";
import { doc, getDoc, updateDoc, writeBatch } from "firebase/firestore";
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

  const data = {
    username: profileData.username,
    usernameLower: profileData.username.trim().toLowerCase(),
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
const createUserProfile = async (
  userId,
  // eslint-disable-next-line no-unused-vars
  { email, phone, ...profileData }
) => {
  const batch = writeBatch(db);

  const userData = {
    ...profileData,
    usernameLower:
      profileData.username
        .trim()
        .toLowerCase(),
    createdAt: new Date()
  };

  batch.set(
    doc(db, "users", userId),
    userData
  );

  batch.set(
    publicProfileRef(userId),
    pickPublicFields({
      avatar: null,
      region: null,
      ...userData
    })
  );

  await batch.commit();
};

export const profileService = {
  userProfileExists,
  updateUserProfile,
  updateUserLanguage,
  createUserProfile
};
