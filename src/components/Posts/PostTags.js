import { memo } from "react";
import { useTranslation } from "react-i18next";
import { DEFAULT_LANGUAGE, getLanguageLabel } from "../../constants";

// Etiquetas de la card del feed: solo lo que se sale de lo esperado.
// Micrófono solo si es "sí", nivel solo si es competitivo (casual es lo
// normal) e idioma solo si no es español. Sin nada que mostrar, no se
// renderiza (no deja espacio vacío).
function PostTags({ requiresMic, skillLevel, language }) {
  const { t } = useTranslation("posts");
  const showMic = requiresMic === true;
  const showCompetitive = skillLevel === "competitive";
  const showLanguage = Boolean(language) && language !== DEFAULT_LANGUAGE;

  if (!showMic && !showCompetitive && !showLanguage) {
    return null;
  }

  return (
    <ul className="post-card__tags" aria-label={t("tags.label")}>
      {showMic && (
        <li className="post-card__tag" title={t("tags.micRequired")}>
          <i className="pi pi-microphone" aria-hidden="true" />
          {t("tags.mic")}
        </li>
      )}
      {showCompetitive && (
        <li className="post-card__tag post-card__tag--competitive">
          <i className="pi pi-trophy" aria-hidden="true" />
          {t("tags.competitive")}
        </li>
      )}
      {showLanguage && (
        <li className="post-card__tag" title={t("tags.languageTitle", { language: getLanguageLabel(language) })}>
          <i className="pi pi-globe" aria-hidden="true" />
          {language.toUpperCase()}
        </li>
      )}
    </ul>
  );
}

export default memo(PostTags);
