import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import { Avatar } from "primereact/avatar";

export default function UserProfile({ userId }) {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const docRef = doc(db, "users", userId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    });

    return () => unsubscribe();
  }, [userId]);

  if (!userData) return <p>Cargando...</p>;

  const getPlatform = (url) => {
    if (url.includes("steam")) return "steam";
    if (url.includes("discord")) return "discord";
    if (url.includes("xbox")) return "xbox";
    if (url.includes("playstation") || url.includes("psn")) return "playstation";
    if (url.includes("epicgames")) return "epic";
    return "other";
  };

  const getIcon = (platform) => {
    switch (platform) {
      case "steam":
        return "https://cdn-icons-png.flaticon.com/512/5968/5968705.png";
      case "discord":
        return "https://cdn-icons-png.flaticon.com/512/2111/2111370.png";
      case "xbox":
        return "https://cdn-icons-png.flaticon.com/512/5968/5968885.png";
      case "playstation":
        return "https://cdn-icons-png.flaticon.com/512/5968/5968753.png";
      default:
        return "https://cdn-icons-png.flaticon.com/512/709/709496.png";
      }
  };

  const getLabel = (platform) => {
    switch (platform) {
      case "steam": return "Steam";
      case "discord": return "Discord";
      case "xbox": return "Xbox";
      case "playstation": return "PlayStation";
      default: return "Perfil";
    }
  };

  return (
    <>
      <div className="profile-header">
        <div className="profile-banner-container">
          <div className="profile-banner" 
            style={
              userData?.banner
                ? {
                    backgroundImage: `url(${userData?.banner})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }
                : {
                    background: "linear-gradient(90deg, #38bdf8, #a855f7)"
                  }
            }
          />
        </div>
        <div className="profile-avatar-wrapper">
          <Avatar
            image={userData?.avatar || undefined}
            label={
              !userData?.avatar
                ? userData?.username?.charAt(0).toUpperCase()
                : null
            }
            size="xlarge"
            shape="circle"
            className="profile-avatar"
          />
            <h2 style={{ margin: 0 }}>
              {userData?.username || "Gamer"}
            </h2>
        </div>
      </div>
      <div style={{ marginTop: "1rem", textAlign: "center" }}>
        {userData?.links?.length > 0 ? (
          <div className="gamer-links">
            {userData.links.map((link, index) => {
              const platform = getPlatform(link);
              const icon = getIcon(platform);
              return(
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="gamer-link"
                >
                  <img
                    src={icon}
                    alt={platform}
                    style={{ width: "20px", height: "20px" }}
                  />
                  {getLabel(platform)}
                </a>
              )
            })}
          </div>
        ) : (
          <p style={{ color: "#888" }}>No hay links</p>
        )}
      </div>
    </>
  );
}