import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { formatDates } from "../../utils";

const formatMemberSince = (createdAt) => {
  const date = formatDates.toDate(createdAt);
  if (!date) return null;

  return date.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
};

export default function ProfileHero({
  userData,
  country,
  avatarPreview,
  bannerPreview,
  uploading,
  isEditing,
  onEdit,
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
      </div>

      <div className="profile-hero__info">
        <div className="profile-hero__avatar-wrap">
          <Avatar
            image={avatarImage}
            label={avatarImage ? undefined : username.charAt(0).toUpperCase()}
            shape="circle"
            className="profile-hero__avatar"
          />
          {uploading.avatar && (
            <span className="profile-hero__avatar-loading" aria-hidden="true">
              <i className="pi pi-spin pi-spinner" />
            </span>
          )}
          <button
            type="button"
            className="profile-hero__avatar-btn"
            aria-label="Cambiar foto de perfil"
            onClick={onAvatarEdit}
            disabled={uploading.avatar}
          >
            <i className="pi pi-camera" aria-hidden="true" />
          </button>
        </div>

        <div className="profile-hero__identity">
          <span className="feed-header__eyebrow">Mi perfil</span>
          <h1 className="profile-hero__name">{username}</h1>

          <div className="profile-hero__meta">
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

        <div className="profile-hero__actions">
          {isEditing ? (
            <span className="profile-hero__editing">
              <i className="pi pi-pencil" aria-hidden="true" />
              Editando perfil
            </span>
          ) : (
            <Button
              label="Editar perfil"
              icon="pi pi-pencil"
              className="gm-btn gm-btn--primary profile-hero__edit"
              onClick={onEdit}
            />
          )}
        </div>
      </div>
    </section>
  );
}
