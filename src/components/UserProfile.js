import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import { Avatar } from "primereact/avatar";
import { platformIcons } from "../utils/platformIcons";
import { getPlatform } from "../utils/getPlatform";
import { getLabel } from "../utils/getLabel";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/config";

export default function UserProfile({ userId, user }) {
  const [userData, setUserData] = useState(null);
  const [steamStats, setSteamStats] = useState(null);
  const [loadingSteam, setLoadingSteam] = useState(false);
  const getSteamStats = httpsCallable(functions, "getSteamStats");

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

  useEffect(() => {
    if (!userData?.links || userData.links.length === 0) return;

    const steamId = getSteamIdFromLinks(userData.links);

    if (!steamId) {
      console.log("❌ No se encontró Steam ID");
      return;
    }

    console.log("🚀 Enviando SteamID:", steamId);

    const fetchSteam = async () => {
      try {
        const res = await getSteamStats({ steamId: String(steamId) });
        setSteamStats(res.data);
      } catch (error) {
        console.error("Error Steam:", error);
      }
    };

    fetchSteam();
  }, [userData]);

  const getSteamIdFromLinks = (links) => {
    const steamLink = links?.find(link => link.includes("steamcommunity"));
    if (!steamLink) return null;

    const parts = steamLink.split("/");
    return parts[parts.length - 1] || parts[parts.length - 2];
  };

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
      <div style={{ marginTop: "1rem" }}>
        <p>{userData?.description}</p>
      </div>
      <div style={{ marginTop: "1rem" }}>
        <h4>Juegos favoritos</h4>
        <>
          {userData?.games?.length > 0 ? (
            <div className="games-grid">
              {userData.games.map((game, index) => (
                <div key={game.id} className="game-card">
                  <img src={game.image} alt={game.name} />
                  <div className="game-card-overlay">{game.name}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#888" }}>No hay juegos que mostrar</p>
          )}
        </>
      </div>
      <div style={{ marginTop: "1rem" }}>
        <h4>Estadísticas de Steam</h4>

        {loadingSteam && <p>Cargando stats...</p>}

        {steamStats && (
          <>
            <div className="steam-stats">
              <div className="stat-card">
                <h3>{steamStats.totalGames}</h3>
                <p>Juegos</p>
              </div>

              <div className="stat-card">
                <h3>{steamStats.totalHours}</h3>
                <p>Horas</p>
              </div>
            </div>

            <div className="steam-games">
              {steamStats.games.map((game) => (
                <div key={game.appid} className="game-card">
                  <img
                    src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`}
                    alt={game.name}
                  />
                  <div className="game-card-overlay">
                    <span>{game.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loadingSteam && !steamStats && (
          <>
            {user.uid !== userId ? (
              <p style={{ color: "#888" }}>No hay datos de Steam.</p>
            ) : (
              <p style={{ color: "#888" }}>Si quieres mostrar tu perfil de Steam aqui, solo pega la url de tu perfil de steam en la parte de redes sociles de tu perfil de GamerMatch y automaticamente mostraremos tus estadisticas</p>
            )}
          </>
        )}
      </div>
      <div style={{ marginTop: "1rem" }}>
        <h4>Redes sociales</h4>
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