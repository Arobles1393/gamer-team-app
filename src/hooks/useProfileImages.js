import { useEffect, useState } from "react";
import { profileImageService } from "../services/profile";

const SUCCESS_MESSAGES = {
  avatar: "Foto de perfil actualizada",
  banner: "Portada actualizada"
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
      onError?.("Solo se permiten imágenes");
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      onError?.("La imagen debe pesar máximo 5 MB");
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
      onSuccess?.(SUCCESS_MESSAGES[type]);
    } catch (error) {
      console.error(`Error subiendo ${type}:`, error);
      // Vuelve a la imagen guardada
      setPreviewFor(type, null);
      onError?.(`No se pudo subir la imagen de ${type === "avatar" ? "perfil" : "portada"}.`);
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
