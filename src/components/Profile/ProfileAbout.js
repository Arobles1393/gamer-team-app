import { useTranslation } from "react-i18next";
import { InputTextarea } from "primereact/inputtextarea";
import { ProfileSection } from "../ProfileSection";

const MAX_LENGTH = 500;

export default function ProfileAbout({ description, isEditing, onDescriptionChange }) {
  const { t } = useTranslation("profile");

  return (
    <ProfileSection title={t("about.title")} icon="pi-user" className="profile-about">
      {isEditing ? (
        <div className="gm-field">
          <InputTextarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder={t("about.placeholder")}
            aria-label={t("about.title")}
            rows={4}
            autoResize
            maxLength={MAX_LENGTH}
            className="gm-input"
          />
          <p className="gm-field__hint profile-about__counter">
            {description.length}/{MAX_LENGTH}
          </p>
        </div>
      ) : description ? (
        <p className="profile-about__text">{description}</p>
      ) : (
        <p className="gm-section__empty">{t("about.empty")}</p>
      )}
    </ProfileSection>
  );
}
