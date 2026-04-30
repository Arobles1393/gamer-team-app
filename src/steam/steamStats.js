import "./steam.css";

export default function SteamStats({ stats }) {
  if (!stats) return null;

  return (
    <div className="steam-container">
      
      {/* 🎯 RESUMEN */}
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

      {/* 🎮 TOP JUEGOS */}
      <h4>Juegos más activos</h4>
      <div className="steam-games">
        {stats.games.map((game) => {
          const maxPlaytime = stats.games[0]?.playtime_forever || 1;
          const percentage = (game.playtime_forever / maxPlaytime) * 100;
          return(
            <div key={game.appid} className="steam-game-card">
              
              <img
                src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`}
                alt={game.name}
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