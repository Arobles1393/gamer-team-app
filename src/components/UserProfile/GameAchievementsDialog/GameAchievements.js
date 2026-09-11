import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../../firebase/config";

const getRarityClass = (percent) => {
  if (percent < 1) return "ultra-rare";
  if (percent < 5) return "very-rare";
  if (percent < 10) return "rare";
  return "";
};

export default function GameAchievements({ game, steamId }) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const unlocked = achievements.filter((a) => a.achieved === 1);
  const locked = achievements.filter((a) => a.achieved === 0);

  useEffect(() => {
    if (!game || !steamId) return;

    let cancelled = false;

    const fetchAchievements = async () => {
      setLoading(true);
      setError(false);

      try {
        const getSteamStats = httpsCallable(functions, "getSteamStats");

        const res = await getSteamStats({
          steamId: String(steamId),
          appid: game.appid
        });

        if (!cancelled) {
          setAchievements(res.data.achievements || []);
        }
      } catch (err) {
        console.error("Error obteniendo logros:", err);

        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAchievements();

    return () => {
      cancelled = true;
    };
  }, [game, steamId]);

  const renderAchievements = (list, title, isUnlocked) => (
    <>
      <h4 style={{ marginTop: "1rem" }}>
        {title} ({list.length})
      </h4>
      {list.map((ach) => (
        <div
          key={ach.name}
          className={`achievement-card ${getRarityClass(ach.percent)} ${
            isUnlocked ? "unlocked" : "locked"
          }`}
        >
          <img src={isUnlocked ? ach.icon : ach.iconGray} alt={ach.name} />
          <div className="achievement-info">
            <p>{ach.name}</p>
            <span>{ach.description}</span>
            <span className="rarity">{ach.percent.toFixed(1)}% jugadores</span>
          </div>
        </div>
      ))}
    </>
  );

  if (loading) {
    return <p>Cargando logros...</p>;
  }

  if (error) {
    return <p>No se pudieron cargar los logros. Intenta de nuevo más tarde.</p>;
  }

  return (
    <>
      {achievements.length > 0 ? (
        <>
          <div className="rarity-title">
            <h4>Rareza de logros</h4>
            <div className="rarity-dots">
              <span className="dot rare" title="Raro" />
              <span className="dot very-rare" title="Muy raro" />
              <span className="dot ultra-rare" title="Ultra raro" />
            </div>
          </div>
          {unlocked.length > 0 && renderAchievements(unlocked, "Desbloqueados", true)}
          {locked.length > 0 && renderAchievements(locked, "Bloqueados", false)}
        </>
      ) : (
        <p>
          No hay logros disponibles para este juego (es posible que el usuario
          tenga sus logros de Steam en privado o el juego no cuente con logros).
        </p>
      )}
    </>
  );
}