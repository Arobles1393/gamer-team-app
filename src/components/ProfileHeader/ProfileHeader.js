import { Avatar } from "primereact/avatar";
import "./ProfileHeader.css";

export default function ProfileHeader({
  userData,
  isEditing = false,
  avatarPreview = null,
  bannerPreview = null,
  onAvatarEdit,
  onBannerEdit,
  showUsername = true
}) {
  const avatarImage =
    avatarPreview || userData?.avatar || undefined;

  const avatarLabel =
    !avatarPreview && !userData?.avatar
      ? userData?.username?.charAt(0).toUpperCase()
      : null;

  const bannerImage =
    bannerPreview || userData?.banner;

  return (
    <div className="profile-header">
      <div className="profile-banner-container">
        <div
          className="profile-banner"
          style={
            bannerImage
              ? {
                  backgroundImage: `url(${bannerImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }
              : {
                  background:
                    "linear-gradient(90deg, #38bdf8, #a855f7)"
                }
          }
        />
        {isEditing && (
          <div
            className="banner-edit-icon"
            onClick={onBannerEdit}
          >
            <i className="pi pi-pencil"></i>
          </div>
        )}
      </div>
      <div className="profile-avatar-wrapper">
        <Avatar
          image={avatarImage}
          label={avatarLabel}
          size="xlarge"
          shape="circle"
          className="profile-avatar"
        />
        {isEditing && (
          <div
            className="avatar-edit-icon"
            onClick={onAvatarEdit}
          >
            <i className="pi pi-pencil"></i>
          </div>
        )}
        {showUsername && (
          <h2>
            {userData?.username || "Gamer"}
          </h2>
        )}
      </div>
    </div>
  );
}