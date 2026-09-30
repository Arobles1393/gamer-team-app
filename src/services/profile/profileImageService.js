import { db, storage } from "../../firebase/config";
import { doc, writeBatch } from "firebase/firestore";
import { publicProfileRef, pickPublicFields } from "./publicProfileService";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";

const uploadProfileImage = async (userId, file, type) => {
  const storageRef = ref(
    storage,
    `${type}s/${userId}`
  );

  await uploadBytes(storageRef, file);

  const url = await getDownloadURL(storageRef);

  const data = { [type]: url };

  // El avatar también es público; el banner no
  const publicData = pickPublicFields(data);

  const batch = writeBatch(db);
  batch.update(doc(db, "users", userId), data);

  if (Object.keys(publicData).length) {
    batch.set(publicProfileRef(userId), publicData, { merge: true });
  }

  await batch.commit();

  return url;
};

export const profileImageService = {
  uploadProfileImage
};