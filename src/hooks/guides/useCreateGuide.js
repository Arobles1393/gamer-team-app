import { useCallback, useState } from "react";
import { guideService } from "../../services/guides";
import { extractYoutubeId, guideHtmlToText, isSafeImageUrl, MAX_GUIDE_HTML } from "../../utils";

const MIN_TITLE = 3;
const MAX_TITLE = 150;

const gameNameOf = (game) =>
  (typeof game === "string" ? game : game?.value ?? "").trim();

const isHttpUrl = (value) => {
  try {
    const url = new URL(value.trim());
    return (url.protocol === "https:" || url.protocol === "http:") && value.trim().length <= 2048;
  } catch {
    return false;
  }
};

// Formulario de nueva guía: "original" (escrita con el editor) o "external"
// (link a otro sitio). Devuelve los errores por campo (claves de guides:create.errors.*)
// y submit(), que crea la guía como pendiente de revisión.
export const useCreateGuide = (user) => {
  const [type, setType] = useState("original");
  const [game, setGame] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const youtubeVideoId = extractYoutubeId(youtubeUrl);
  const trimmedTitle = title.trim();

  const errors = {
    game: !gameNameOf(game) && "game",
    title: (trimmedTitle.length < MIN_TITLE || trimmedTitle.length > MAX_TITLE) && "title",
    ...(type === "original"
      ? {
        content: (!guideHtmlToText(content) && !/<img\s/i.test(content) && "content")
          || (content.length > MAX_GUIDE_HTML && "contentTooLong"),
        youtube: youtubeUrl.trim() && !youtubeVideoId && "youtube",
        cover: coverImage && !isSafeImageUrl(coverImage) && "cover"
      }
      : {
        externalUrl: !isHttpUrl(externalUrl) && "externalUrl"
      })
  };

  const isValid = !Object.values(errors).some(Boolean);

  // Sube una imagen (portada o del texto) y devuelve su URL
  const uploadImage = useCallback((file) => guideService.uploadGuideImage(user.uid, file), [user]);

  // preview: la vista previa ya mostrada del link externo (si hay)
  const submit = useCallback(async ({ preview } = {}) => {
    setSaving(true);

    try {
      const common = { authorId: user.uid, game: gameNameOf(game), title: trimmedTitle };
      const ref = type === "original"
        ? await guideService.createOriginalGuide({ ...common, content, coverImage, youtubeVideoId })
        : await guideService.createExternalGuide({ ...common, externalUrl: externalUrl.trim(), preview });

      return ref.id;
    } finally {
      setSaving(false);
    }
  }, [user, game, trimmedTitle, type, content, coverImage, youtubeVideoId, externalUrl]);

  return {
    type,
    setType,
    game,
    setGame,
    title,
    setTitle,
    content,
    setContent,
    coverImage,
    setCoverImage,
    youtubeUrl,
    setYoutubeUrl,
    youtubeVideoId,
    externalUrl,
    setExternalUrl,
    isHttpUrl,
    errors,
    isValid,
    saving,
    uploadImage,
    submit
  };
};
