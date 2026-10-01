import { useEffect, useState } from "react";
import { profileImageService } from "../../services/profile";
import i18n from "../../i18n";

const MAX_IMAGE_MB = 5;

// Claves de profile:images.* por tipo de imagen
const MESSAGES = {
  avatar: { success: "avatarUpdated", error: "avatarError" },
  banner: { success: "bannerUpdated", error: "bannerError" }
};

// Las imágenes se suben en cuanto se eligen (no dependen de Guardar del formulario)
export const useProfileImages = (user, onError, onSuccess) => {
  const [preview, setPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [uploading, setUploading] = useState({ avatar: false, banner: false });

  const setPreviewFor = (type, url) => {
    if (type === "avatar") setPreview(url);
    if (type === "banner") setBannerPreview(url);
  };

  const validateImage = (file) => {
    if (!file.type.startsWith("image/")) {
      onError?.(i18n.t("profile:images.onlyImages"));
      return false;
    }

    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      onError?.(i18n.t("profile:images.maxSize", { mb: MAX_IMAGE_MB }));
      return false;
    }

    return true;
  };

  const handleImageChange = async (e, type) => {
    const file = e.target.files[0];

    // Permite volver a elegir el mismo archivo después
    e.target.value = "";

    if (!file) return;

    if (!validateImage(file)) return;

    setPreviewFor(type, URL.createObjectURL(file));
    setUploading((prev) => ({ ...prev, [type]: true }));

    try {
      await profileImageService.uploadProfileImage(user.uid, file, type);
      onSuccess?.(i18n.t(`profile:images.${MESSAGES[type].success}`));
    } catch (error) {
      console.error(`Error subiendo ${type}:`, error);
      // Vuelve a la imagen guardada
      setPreviewFor(type, null);
      onError?.(i18n.t(`profile:images.${MESSAGES[type].error}`));
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [preview, bannerPreview]);

  return {
    preview,
    bannerPreview,
    uploading,
    handleImageChange
  };
};
