import { useState } from "react";
import { platformIcons } from "../../utils/platformIcons";
import { getPlatform } from "../../utils/getPlatform";
import { getLabel } from "../../utils/getLabel";
import SteamStats from "../../steam/steamStats";
import GameAchievements from "../GameArchievements";
import { Dialog } from "primereact/dialog";
import { useUserProfile, useSteamStats } from "../../hooks";
import ProfileHeader from "./ProfileHeader/ProfileHeader";
import FavoriteGames from "./FavoriteGames/FavoriteGames";

export default function UserProfile({ userId, user }) {
  const { userData } = useUserProfile(userId);
  const {
    steamStats,
    steamID,
    loadingSteam
  } = useSteamStats(userData?.links);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showAchievements, setShowAchievements] = useState(false);

  const handleSelectGame = (game) => {
    setSelectedGame(game);
    setShowAchievements(true);
  };

  if (!userData) return <p>Cargando...</p>;

  return (
    <>
      <ProfileHeader userData={userData} />
      <div style={{ marginTop: "1rem" }}>
        <p>{userData?.description}</p>
      </div>
      {!steamStats && (
        <FavoriteGames games={userData.games} />
      )}
      <div style={{ marginTop: "1rem" }}>
        <h4>Estadísticas de Steam</h4>

        {loadingSteam && <p>Cargando stats...</p>}

        {steamStats && (
          <SteamStats 
            stats={steamStats} 
            onSelectGame={handleSelectGame}
          />
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
      <Dialog
        header={selectedGame?.name}
        visible={showAchievements}
        style={{ width: "700px" }}
        onHide={() => setShowAchievements(false)}
      >
        <GameAchievements 
          game={selectedGame} 
          steamId={steamID} 
        />
      </Dialog>
    </>
  );
}