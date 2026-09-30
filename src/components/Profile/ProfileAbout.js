import { InputTextarea } from "primereact/inputtextarea";
import { ProfileSection } from "../ProfileSection";

const MAX_LENGTH = 500;

export default function ProfileAbout({ description, isEditing, onDescriptionChange }) {
  return (
    <ProfileSection title="Sobre mí" icon="pi-user" className="profile-about">
      {isEditing ? (
        <div className="gm-field">
          <InputTextarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Cuéntale a otros jugadores qué juegas, tus horarios, tu estilo…"
            aria-label="Sobre mí"
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
        <p className="gm-section__empty">
          Aún no has escrito nada sobre ti. Edita tu perfil para presentarte.
        </p>
      )}
    </ProfileSection>
  );
}
