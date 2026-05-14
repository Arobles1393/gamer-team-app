import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/config";

export default function GameAchievements({ game, steamId }) {
  const [achievements, setAchievements] = useState([]);
  const unlocked = achievements.filter(a => a.achieved === 1);
  const locked = achievements.filter(a => a.achieved === 0);

  useEffect(() => {
    if (!game || !steamId) return;

    const fetchAchievements = async () => {
      try {
        const getSteamStats = httpsCallable(functions, "getSteamStats");

        const res = await getSteamStats({
          steamId: String(steamId),
          appid: game.appid
        });

        setAchievements(res.data.achievements || []);
      } catch (error) {
        console.error("Error logros:", error);
      }
    };

    fetchAchievements();
  }, [game, steamId]);

  const renderAchievements = (list, title, isUnlocked) => (
    <>
      <h4 style={{ marginTop: "1rem" }}>
        {title} ({list.length})
      </h4>
      {list.map((ach, index) => (
        <div key={index} className={`achievement-card ${isUnlocked ? "unlocked" : "locked"}`}>
          <img src={isUnlocked ? ach.icon : ach.iconGray} alt={ach.name} />
          <div className="achievement-info">
            <p>{ach.name}</p>
            <span>{ach.description}</span>
          </div>
        </div>
      ))}
    </>
  );

  return (
    <>
      {achievements.length > 0 ? (
        <>
          {unlocked.length > 0 && renderAchievements(unlocked, "Desbloqueados", true)}
          {locked.length > 0 && renderAchievements(locked, "Bloqueados", false)}
        </>
      ) : (
        <p>No hay logros disponibles para este juego (Es posible que el usuario tenga su logros de 
            steam en privado o el juego no cuente con logros)</p>
      )}
    </>
  );
}