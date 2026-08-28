import { db, storage } from "../../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
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

  await updateDoc(doc(db, "users", userId), {
    [type]: url
  });

  return url;
};

export const profileImageService = {
  uploadProfileImage
};