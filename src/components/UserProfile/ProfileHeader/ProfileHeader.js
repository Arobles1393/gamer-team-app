import { Avatar } from "primereact/avatar";
//import "./ProfileHeader.css"; descomentar cuando en el index.css se quiten los estilos que ya estan en el archivo ProfileHeader.css

export default function ProfileHeader({ userData }) {
  const avatarLabel = !userData?.avatar
    ? userData?.username?.charAt(0).toUpperCase()
    : null;

  return (
    <div className="profile-header">
      <div className="profile-banner-container">
        <div
          className="profile-banner"
          style={
            userData?.banner
              ? {
                  backgroundImage: `url(${userData.banner})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }
              : {
                  background:
                    "linear-gradient(90deg, #38bdf8, #a855f7)"
                }
          }
        />
      </div>

      <div className="profile-avatar-wrapper">
        <Avatar
          image={userData?.avatar || undefined}
          label={avatarLabel}
          size="xlarge"
          shape="circle"
          className="profile-avatar"
        />

        <h2>
          {userData?.username || "Gamer"}
        </h2>
      </div>
    </div>
  );
}