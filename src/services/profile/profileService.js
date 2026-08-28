import { db } from "../../firebase/config";
import { doc, updateDoc } from "firebase/firestore";

const updateUserProfile = async (userId, profileData) => {
  const userRef = doc(db, "users", userId);

  await updateDoc(userRef, {
    username: profileData.username,
    phone: profileData.phone,
    links: profileData.links,
    description: profileData.description,
    games: profileData.games,
    region: profileData.region
  });
};

export const profileService = {
  updateUserProfile
};