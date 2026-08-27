import SteamStats from "../../../steam/steamStats";
import "./SteamStatsSection.css";

export default function SteamStatsSection({
  steamStats,
  loadingSteam,
  isOwnProfile,
  onSelectGame
}) {
  return (
    <section className="steam-stats-section">
      <h4>Estadísticas de Steam</h4>

      {loadingSteam && (
        <p>Cargando stats...</p>
      )}

      {steamStats && (
        <SteamStats
          stats={steamStats}
          onSelectGame={onSelectGame}
        />
      )}

      {!loadingSteam && !steamStats && (
        isOwnProfile ? (
          <p className="steam-stats-empty">
            Si quieres mostrar tu perfil de Steam aquí,
            solo pega la URL de tu perfil de Steam en la
            parte de redes sociales de tu perfil de GamerMatch
            y automáticamente mostraremos tus estadísticas.
          </p>
        ) : (
          <p className="steam-stats-empty">
            No hay datos de Steam.
          </p>
        )
      )}
    </section>
  );
}