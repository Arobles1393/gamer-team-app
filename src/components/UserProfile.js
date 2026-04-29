import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import { Avatar } from "primereact/avatar";
import { platformIcons } from "../utils/platformIcons";
import { getPlatform } from "../utils/getPlatform";
import { getLabel } from "../utils/getLabel";

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
              return(
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="gamer-link"
                >
                  {platformIcons[platform]?.()}
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