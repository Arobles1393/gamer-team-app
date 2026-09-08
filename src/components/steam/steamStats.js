import "./Steam.css";

export default function SteamStats({ stats, onSelectGame }) {
  if (!stats) return null;

  const maxPlaytime = stats.games[0]?.playtime_forever || 1;

  return (
    <div className="steam-container">
      
      <div className="steam-summary">
        <div className="steam-card">
          <span className="steam-number">{stats.totalGames}</span>
          <span className="steam-label">Juegos</span>
        </div>

        <div className="steam-card">
          <span className="steam-number">{stats.totalHours}</span>
          <span className="steam-label">Horas</span>
        </div>
      </div>

      <h4>Juegos más activos</h4>
      <div className="steam-games">
        {stats.games.map((game) => {
          const percentage = (game.playtime_forever / maxPlaytime) * 100;

          return (
            <div
              key={game.appid}
              className="steam-game-card"
              onClick={() => onSelectGame(game)}
            >
              <img
                src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`}
                alt={game.name}
                loading="lazy"
              />

              <div className="steam-overlay">
                <p>{game.name}</p>
                <span>{Math.round(game.playtime_forever / 60)} hrs</span>
                <div className="bar">
                  <div
                    className="bar-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}