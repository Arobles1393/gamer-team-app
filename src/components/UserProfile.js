import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { Avatar } from "primereact/avatar";

export default function UserProfile({ userId }) {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    };

    if (userId) fetchUser();
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
        <div style={{ textAlign: "center" }}>
            <Avatar
              image={userData?.avatar}
              label={
                !userData?.avatar
                  ? userData?.username?.charAt(0).toUpperCase()
                  : null
              }
              size="xlarge"
              shape="circle"
              style={{ marginBottom: "1rem", backgroundColor: "#6366f1", color: "#fff" }}
            />
            <h2 style={{ margin: 0 }}>
                {userData?.username || "Gamer"}
            </h2>
        </div>
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
            {userData?.links?.length > 0 ? (
              userData.links.map((link, index) => {
                const platform = getPlatform(link);
                const icon = getIcon(platform);
                return(
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.5rem",
                      color: "#3b82f6",
                      textDecoration: "none"
                    }}
                  >
                    <img
                      src={icon}
                      alt={platform}
                      style={{ width: "20px", height: "20px" }}
                    />
                    {getLabel(platform)}
                  </a>
                )
              })
            ) : (
              <p style={{ color: "#888" }}>No hay links</p>
            )}
        </div>
    </>
  );
}