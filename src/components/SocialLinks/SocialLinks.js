import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { ProfileSection } from "../ProfileSection";
import { getLabel, getPlatform, platformIcons } from "../../utils";
import "./SocialLinks.css";

// "https://www.twitch.tv/usuario" -> "twitch.tv/usuario"
const getDisplayUrl = (link) => {
  try {
    const url = new URL(link);
    const path = url.pathname.replace(/\/$/, "");
    return `${url.hostname.replace(/^www\./, "")}${path}`;
  } catch {
    return link;
  }
};

const isInvalidLink = (link) => Boolean(link.trim()) && !link.trim().startsWith("https://");

function PlatformIcon({ link }) {
  const platform = getPlatform(link);
  const icon = platformIcons[platform]?.("social-link__svg");

  return (
    <span className="social-link__icon" aria-hidden="true">
      {icon ?? <i className="pi pi-link" />}
    </span>
  );
}

export default function SocialLinks({
  links = [],
  isEditing = false,
  onLinksChange,
  emptyText = "Este jugador no ha agregado redes."
}) {

  const handleChange = (index, value) => {
    const newLinks = [...links];
    newLinks[index] = value;

    onLinksChange?.(newLinks);
  };

  const handleRemove = (index) => {
    const newLinks = links.filter((_, i) => i !== index);

    onLinksChange?.(newLinks);
  };

  const handleAdd = () => {
    onLinksChange?.([...links, ""]);
  };

  if (isEditing) {
    return (
      <ProfileSection title="Redes sociales" icon="pi-share-alt" className="social-links">
        {links.length > 0 && (
          <ul className="social-links__edit-list">
            {links.map((link, index) => {
              const invalid = isInvalidLink(link);

              return (
                <li key={index} className="social-links__edit-item">
                  <div className="social-links__edit-row">
                    <PlatformIcon link={link} />
                    <InputText
                      value={link}
                      onChange={(e) => handleChange(index, e.target.value)}
                      placeholder="https://…"
                      aria-label={`Link ${index + 1}`}
                      aria-invalid={invalid}
                      className={`gm-input${invalid ? " gm-input--invalid" : ""}`}
                    />
                    <Button
                      icon="pi pi-trash"
                      className="gm-btn gm-btn--icon"
                      aria-label={`Quitar link ${index + 1}`}
                      onClick={() => handleRemove(index)}
                    />
                  </div>
                  {invalid && (
                    <p className="gm-field__error">El link debe comenzar con https://</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <Button
          label="Agregar link"
          icon="pi pi-plus"
          className="gm-btn gm-btn--ghost social-links__add"
          onClick={handleAdd}
        />

        <p className="gm-field__hint social-links__hint">
          Pega el link de tu perfil de Steam para mostrar tus estadísticas.
        </p>
      </ProfileSection>
    );
  }

  return (
    <ProfileSection title="Redes sociales" icon="pi-share-alt" className="social-links">
      {links.length > 0 ? (
        <ul className="social-links__list">
          {links.map((link, index) => (
            <li key={index}>
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="social-link"
              >
                <PlatformIcon link={link} />
                <span className="social-link__text">
                  <span className="social-link__label">{getLabel(getPlatform(link))}</span>
                  <span className="social-link__url">{getDisplayUrl(link)}</span>
                </span>
                <i className="pi pi-external-link social-link__external" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="gm-section__empty">{emptyText}</p>
      )}
    </ProfileSection>
  );
}
