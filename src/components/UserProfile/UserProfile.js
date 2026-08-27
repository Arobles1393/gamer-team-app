import { useState } from "react";
import { useUserProfile, useSteamStats } from "../../hooks";
import ProfileHeader from "./ProfileHeader/ProfileHeader";
import FavoriteGames from "./FavoriteGames/FavoriteGames";
import SocialLinks from "./SocialLinks/SocialLinks";
import SteamStatsSection from "./SteamStatsSection/SteamStatsSection";
import GameAchievementsDialog from "./GameAchievementsDialog/GameAchievementsDialog";

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
      <SteamStatsSection
        steamStats={steamStats}
        loadingSteam={loadingSteam}
        isOwnProfile={user.uid === userId}
        onSelectGame={handleSelectGame}
      />
      <SocialLinks links={userData.links} />
      <GameAchievementsDialog
        game={selectedGame}
        steamId={steamID}
        visible={showAchievements}
        onHide={() => setShowAchievements(false)}
      />
    </>
  );
}