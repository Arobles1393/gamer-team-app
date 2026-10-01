import { db } from "../../firebase/config";
import { doc, getDoc, updateDoc, writeBatch } from "firebase/firestore";
import { publicProfileRef, pickPublicFields } from "./publicProfileService";

const userProfileExists = async (userId) => {
  const snapshot = await getDoc(doc(db, "users", userId));
  return snapshot.exists();
};

// users y publicProfiles se escriben juntos para que no se desincronicen
const updateUserProfile = async (userId, profileData) => {
  const userRef = doc(db, "users", userId);

  const data = {
    username: profileData.username,
    usernameLower: profileData.username.trim().toLowerCase(),
    phone: profileData.phone,
    links: profileData.links,
    description: profileData.description,
    games: profileData.games,
    region: profileData.region
  };

  const batch = writeBatch(db);
  batch.update(userRef, data);
  batch.set(publicProfileRef(userId), pickPublicFields(data), { merge: true });
  await batch.commit();
};

// Idioma de la interfaz elegido en Mi perfil. Solo vive en users (no es público)
const updateUserLanguage = (userId, language) =>
  updateDoc(doc(db, "users", userId), { language });

// Correo de la cuenta: se copia de Firebase Auth, que es la fuente de verdad
const updateUserEmail = (userId, email) =>
  updateDoc(doc(db, "users", userId), { email });

const createUserProfile = async (
  userId,
  profileData
) => {
  const batch = writeBatch(db);

  batch.set(
    doc(db, "users", userId),
    {
      ...profileData,
      usernameLower:
        profileData.username
          .trim()
          .toLowerCase(),
      createdAt: new Date()
    }
  );

  batch.set(
    publicProfileRef(userId),
    pickPublicFields({
      avatar: null,
      region: null,
      ...profileData
    })
  );

  await batch.commit();
};

export const profileService = {
  userProfileExists,
  updateUserProfile,
  updateUserLanguage,
  updateUserEmail,
  createUserProfile
};
