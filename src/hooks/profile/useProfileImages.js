import { useCallback, useEffect, useState } from "react";
import { profileImageService } from "../../services/profile";
import { MAX_MEGAPIXELS, MAX_ORIGINAL_MB, isTooLarge, readImageSize, validatePickedFile } from "../../utils/cropImage";
import i18n from "../../i18n";

// Claves de profile:images.* por tipo de imagen
const MESSAGES = {
  avatar: { success: "avatarUpdated", error: "avatarError" },
  banner: { success: "bannerUpdated", error: "bannerError" }
};

// Avatar y portada: al elegir un archivo se valida y se abre el recorte
// (cropRequest); solo se sube la imagen ya recortada (confirmCrop). No
// dependen del botón Guardar del formulario.
export const useProfileImages = (user, onError, onSuccess) => {
  const [preview, setPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [uploading, setUploading] = useState({ avatar: false, banner: false });
  // { file, type } mientras el diálogo de recorte está abierto
  const [cropRequest, setCropRequest] = useState(null);

  const setPreviewFor = (type, url) => {
    if (type === "avatar") setPreview(url);
    if (type === "banner") setBannerPreview(url);
  };

  const handleImageChange = async (e, type) => {
    const file = e.target.files[0];

    // Permite volver a elegir el mismo archivo después
    e.target.value = "";

    if (!file) return;

    const problem = validatePickedFile(file);
    if (problem === "type") {
      onError?.(i18n.t("profile:images.onlyImages"));
      return;
    }
    if (problem === "size") {
      onError?.(i18n.t("profile:images.maxSize", { mb: MAX_ORIGINAL_MB }));
      return;
    }

    // Protección de memoria: imágenes de más de 40 megapíxeles
    try {
      const { width, height } = await readImageSize(file);
      if (isTooLarge(width, height)) {
        onError?.(i18n.t("profile:images.tooManyPixels", { mp: MAX_MEGAPIXELS }));
        return;
      }
    } catch {
      onError?.(i18n.t("profile:images.unreadable"));
      return;
    }

    setCropRequest({ file, type });
  };

  const cancelCrop = useCallback(() => setCropRequest(null), []);

  // blob: la imagen recortada. Si la subida falla, vuelve a la guardada
  const confirmCrop = async (blob) => {
    if (!cropRequest || !user) return;
    const { type } = cropRequest;
    setCropRequest(null);

    const file = new File([blob], type, { type: blob.type });
    setPreviewFor(type, URL.createObjectURL(blob));
    setUploading((prev) => ({ ...prev, [type]: true }));

    try {
      await profileImageService.uploadProfileImage(user.uid, file, type);
      onSuccess?.(i18n.t(`profile:images.${MESSAGES[type].success}`));
    } catch (error) {
      console.error(`Error subiendo ${type}:`, error.code || error.message);
      // Sin vista previa de algo que no se guardó
      setPreviewFor(type, null);
      onError?.(i18n.t(`profile:images.${MESSAGES[type].error}`));
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  // Revoca la URL anterior al cambiar o al desmontar
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);
  useEffect(() => () => {
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
  }, [bannerPreview]);

  return {
    preview,
    bannerPreview,
    uploading,
    handleImageChange,
    cropRequest,
    confirmCrop,
    cancelCrop
  };
};
