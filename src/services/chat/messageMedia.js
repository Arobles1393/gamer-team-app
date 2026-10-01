import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase/config";
import { MAX_MEDIA_BYTES, MAX_MEDIA_MB, getMediaType } from "../../utils/media";
import i18n from "../../i18n";

// Sube el adjunto de un mensaje a `${folder}/${senderId}/...` (chats 1:1 y
// de grupo). El senderId va en la ruta para que storage.rules valide al dueño.
export const uploadMessageMedia = async (folder, senderId, file) => {
  if (file.size > MAX_MEDIA_BYTES) {
    throw new Error(i18n.t("chat:composer.tooBig", { mb: MAX_MEDIA_MB }));
  }

  const fileRef = ref(storage, `${folder}/${senderId}/${Date.now()}_${file.name}`);

  await uploadBytes(fileRef, file, { contentType: file.type || undefined });

  return {
    mediaUrl: await getDownloadURL(fileRef),
    mediaType: getMediaType(file.type),
    fileName: file.name,
    fileSize: file.size
  };
};

// Texto del último mensaje en la lista de chats cuando no trae texto. Se
// guarda en el idioma de quien envía (lastMessage es un texto, como el resto)
export const getAttachmentPreview = ({ mediaType, fileName }) => {
  if (mediaType === "image") return i18n.t("chat:preview.image");
  if (mediaType === "video") return i18n.t("chat:preview.video");
  return i18n.t("chat:preview.file", { fileName });
};
