import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase/config";
import { MAX_MEDIA_BYTES, MAX_MEDIA_MB, getMediaType } from "../../utils/media";

// Sube el adjunto de un mensaje a `${folder}/${senderId}/...` (chats 1:1 y
// de grupo). El senderId va en la ruta para que storage.rules valide al dueño.
export const uploadMessageMedia = async (folder, senderId, file) => {
  if (file.size > MAX_MEDIA_BYTES) {
    throw new Error(`El archivo debe pesar máximo ${MAX_MEDIA_MB} MB.`);
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

// Texto del último mensaje en la lista de chats cuando no trae texto
export const getAttachmentPreview = ({ mediaType, fileName }) => {
  if (mediaType === "image") return "📷 Imagen";
  if (mediaType === "video") return "🎥 Video";
  return `📎 ${fileName}`;
};
