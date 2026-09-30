import { UserAvatar } from "../UserAvatar";
import { formatDates } from "../../utils";
import "./ProfileHero.css";

const formatMemberSince = (createdAt) => {
  const date = formatDates.toDate(createdAt);
  if (!date) return null;

  return date.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
};

const NOT_UPLOADING = { avatar: false, banner: false };

/**
 * Portada + avatar + identidad de un perfil.
 * - Mi perfil: `editable` muestra los botones para cambiar foto y portada.
 * - Diálogo de otro jugador: `presence` y `online` muestran su estado,
 *   `bannerAction` va sobre la portada (p. ej. cerrar).
 * `actions` se dibuja a la derecha (Editar perfil, Agregar amigo, Mensaje…).
 */
export default function ProfileHero({
  userData,
  country,
  eyebrow,
  presence,
  online = false,
  actions,
  bannerAction,
  editable = false,
  avatarPreview = null,
  bannerPreview = null,
  uploading = NOT_UPLOADING,
  onAvatarEdit,
  onBannerEdit
}) {
  const avatarImage = avatarPreview || userData?.avatar;
  const bannerImage = bannerPreview || userData?.banner;
  const username = userData?.username || "Gamer";
  const memberSince = formatMemberSince(userData?.createdAt);

  return (
    <section className="profile-hero">
      <div
        className="profile-hero__banner"
        style={bannerImage ? { backgroundImage: `url(${bannerImage})` } : undefined}
      >
        {editable ? (
          <button
            type="button"
            className="profile-hero__banner-btn"
            onClick={onBannerEdit}
            disabled={uploading.banner}
          >
            <i
              className={`pi ${uploading.banner ? "pi-spin pi-spinner" : "pi-camera"}`}
              aria-hidden="true"
            />
            <span>{uploading.banner ? "Subiendo…" : "Cambiar portada"}</span>
          </button>
        ) : (
          bannerAction
        )}
      </div>

      <div className="profile-hero__info">
        <div className="profile-hero__avatar-wrap">
          <UserAvatar
            image={avatarImage}
            username={username}
            className="profile-hero__avatar"
          />

          {online && !editable && (
            <span className="profile-hero__online" aria-hidden="true" />
          )}

          {uploading.avatar && (
            <span className="profile-hero__avatar-loading" aria-hidden="true">
              <i className="pi pi-spin pi-spinner" />
            </span>
          )}

          {editable && (
            <button
              type="button"
              className="profile-hero__avatar-btn"
              aria-label="Cambiar foto de perfil"
              onClick={onAvatarEdit}
              disabled={uploading.avatar}
            >
              <i className="pi pi-camera" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="profile-hero__identity">
          {eyebrow && <span className="profile-hero__eyebrow">{eyebrow}</span>}
          <h1 className="profile-hero__name">{username}</h1>

          <div className="profile-hero__meta">
            {presence && (
              <span className={`profile-hero__meta-item profile-hero__presence${online ? " profile-hero__presence--online" : ""}`}>
                <span className="profile-hero__presence-dot" aria-hidden="true" />
                {presence}
              </span>
            )}
            {userData?.region && (
              <span className="profile-hero__meta-item">
                {country?.flag && <span aria-hidden="true">{country.flag}</span>}
                {userData.region}
              </span>
            )}
            {memberSince && (
              <span className="profile-hero__meta-item">
                <i className="pi pi-calendar" aria-hidden="true" />
                Miembro desde {memberSince}
              </span>
            )}
          </div>
        </div>

        {actions && <div className="profile-hero__actions">{actions}</div>}
      </div>
    </section>
  );
}
