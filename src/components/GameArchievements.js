import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/config";

export default function GameAchievements({ game, steamId }) {
  const [achievements, setAchievements] = useState([]);

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

  return (
    <div className="achievements-grid">
      {achievements.length > 0 ? (
        achievements.map((ach, index) => (
          <div key={index} className="achievement-card">
            <p>{ach.apiname}</p>
            <span>{ach.achieved ? "✅" : "❌"}</span>
          </div>
        ))
      ) : (
        <p>No hay logros disponibles para este juego (Es posible que el usaurio tenga su logros de 
            steam en privado)</p>
      )}
    </div>
  );
}