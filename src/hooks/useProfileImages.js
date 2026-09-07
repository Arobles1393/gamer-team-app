import { useEffect, useState } from "react";
import { profileImageService } from "../services/profile";

export const useProfileImages = (user) => {
  const [preview, setPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  const validateImage = (file) => {
    if (!file.type.startsWith("image/")) {
      alert("Solo imágenes");
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Máximo 5MB");
      return false;
    }

    return true;
  };

  const handleImageChange = async (e, type) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!validateImage(file)) return;

    const previewUrl = URL.createObjectURL(file);

    if (type === "avatar") {
      setPreview(previewUrl);
    }

    if (type === "banner") {
      setBannerPreview(previewUrl);
    }

    try {
      await profileImageService.uploadProfileImage(
        user.uid,
        file,
        type
      );
    } catch (error) {
      console.error(`Error subiendo ${type}:`, error);
    }
  };

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }

      if (bannerPreview) {
        URL.revokeObjectURL(bannerPreview);
      }
    };
  }, [preview, bannerPreview]);

  return {
    preview,
    bannerPreview,
    handleImageChange
  };
};