import { db } from "../../firebase/config";
import { doc, updateDoc, setDoc } from "firebase/firestore";

const updateUserProfile = async (userId, profileData) => {
  const userRef = doc(db, "users", userId);

  await updateDoc(userRef, {
    username: profileData.username,
    usernameLower: profileData.username.trim().toLowerCase(),
    phone: profileData.phone,
    links: profileData.links,
    description: profileData.description,
    games: profileData.games,
    region: profileData.region
  });
};

const createUserProfile = async (
  userId,
  profileData
) => {
  await setDoc(
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
};

export const profileService = {
  updateUserProfile,
  createUserProfile
};