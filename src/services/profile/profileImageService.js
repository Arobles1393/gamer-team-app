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

  // contentType del recorte (WebP o JPEG)
  await uploadBytes(storageRef, file, { contentType: file.type });

  // Misma ruta al reemplazar: Storage conserva el token y la URL no cambia,
  // así que el navegador mostraría la imagen vieja de su caché. La versión
  // (v=<timestamp>) hace que cada imagen nueva tenga su propia URL.
  const downloadUrl = new URL(await getDownloadURL(storageRef));
  downloadUrl.searchParams.set("v", String(Date.now()));
  const url = downloadUrl.toString();

  const data = { [type]: url };

  // Avatar y portada son públicos: también van a publicProfiles
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