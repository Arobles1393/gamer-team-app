import { useState } from "react";
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";
import { ProfileSection } from "../ProfileSection";
import GameAchievementsDialog from "./GameAchievementsDialog";
import { useSteamStats } from "../../hooks";
import "./Steam.css";

const STEAM_CDN = "https://cdn.cloudflare.steamstatic.com/steam/apps";

const formatHours = (minutes) =>
  Math.round(minutes / 60).toLocaleString("es-MX");

function SteamGameCard({ game, maxPlaytime, onSelect }) {
  // Algunos juegos no tienen la portada vertical: se intenta con el header horizontal
  const [src, setSrc] = useState(`${STEAM_CDN}/${game.appid}/library_600x900.jpg`);
  const [broken, setBroken] = useState(false);

  const handleImageError = () => {
    if (src.endsWith("library_600x900.jpg")) {
      setSrc(`${STEAM_CDN}/${game.appid}/header.jpg`);
    } else {
      setBroken(true);
    }
  };

  const percent = Math.max(4, (game.playtime_forever / maxPlaytime) * 100);

  return (
    <li>
      <button
        type="button"
        className="steam-game"
        aria-label={`Ver logros de ${game.name}`}
        onClick={() => onSelect(game)}
      >
        {!broken && (
          <img
            src={src}
            alt=""
            loading="lazy"
            className="steam-game__img"
            onError={handleImageError}
          />
        )}
        <span className="steam-game__info">
          <span className="steam-game__name">{game.name}</span>
          <span className="steam-game__hours">{formatHours(game.playtime_forever)} h</span>
          <span className="steam-game__bar" aria-hidden="true">
            <span style={{ width: `${percent}%` }} />
          </span>
        </span>
      </button>
    </li>
  );
}

function SteamSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando estadísticas de Steam">
      <div className="steam-summary">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} height="72px" borderRadius="12px" className="steam-skeleton" />
        ))}
      </div>
      <ul className="steam-games">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i}>
            <Skeleton height="100%" borderRadius="12px" className="steam-skeleton steam-skeleton--game" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Estadísticas de Steam a partir del link de Steam guardado en las redes del usuario.
 * Al tocar un juego se abren sus logros.
 */
export default function SteamSection({ links, isOwnProfile = false, onConnect }) {
  const { steamStats, steamID, loadingSteam, steamError } = useSteamStats(links);
  const [selectedGame, setSelectedGame] = useState(null);

  const steamLink = links?.find((link) => link.includes("steamcommunity"));
  const games = steamStats?.games ?? [];

  const renderBody = () => {
    if (loadingSteam) {
      return <SteamSkeleton />;
    }

    if (!steamID) {
      return isOwnProfile ? (
        <div className="steam-section__empty">
          <p className="gm-section__empty">
            Pega el link de tu perfil de Steam en Redes sociales y aquí mostraremos tus horas y juegos más jugados.
          </p>
          {onConnect && (
            <Button
              label="Conectar Steam"
              icon="pi pi-link"
              className="gm-btn gm-btn--ghost"
              onClick={onConnect}
            />
          )}
        </div>
      ) : (
        <p className="gm-section__empty">Este jugador no ha conectado su Steam.</p>
      );
    }

    if (steamError) {
      return (
        <p className="gm-section__empty">
          No pudimos leer las estadísticas de Steam.
          {isOwnProfile
            ? " Revisa que el link sea correcto y que tu perfil y detalles de juegos sean públicos."
            : " Es posible que su perfil sea privado."}
        </p>
      );
    }

    if (!steamStats || games.length === 0) {
      return (
        <p className="gm-section__empty">
          El perfil de Steam no muestra juegos (la biblioteca puede ser privada).
        </p>
      );
    }

    return (
      <>
        <div className="steam-summary">
          <div className="steam-stat">
            <span className="steam-stat__value">{steamStats.totalHours.toLocaleString("es-MX")}</span>
            <span className="steam-stat__label">Horas jugadas</span>
          </div>
          <div className="steam-stat">
            <span className="steam-stat__value">{steamStats.totalGames.toLocaleString("es-MX")}</span>
            <span className="steam-stat__label">Juegos</span>
          </div>
          <div className="steam-stat steam-stat--wide">
            <span className="steam-stat__value steam-stat__value--text" title={games[0].name}>
              {games[0].name}
            </span>
            <span className="steam-stat__label">Más jugado</span>
          </div>
        </div>

        <p className="steam-section__subtitle">Más jugados · toca uno para ver sus logros</p>

        <ul className="steam-games">
          {games.map((game) => (
            <SteamGameCard
              key={game.appid}
              game={game}
              maxPlaytime={games[0].playtime_forever || 1}
              onSelect={setSelectedGame}
            />
          ))}
        </ul>
      </>
    );
  };

  return (
    <ProfileSection
      title="Steam"
      icon="pi-desktop"
      className="steam-section"
      action={
        steamLink && (
          <a
            href={steamLink}
            target="_blank"
            rel="noreferrer"
            className="steam-section__external"
          >
            Ver en Steam
            <i className="pi pi-external-link" aria-hidden="true" />
          </a>
        )
      }
    >
      {renderBody()}

      <GameAchievementsDialog
        game={selectedGame}
        steamId={steamID}
        visible={Boolean(selectedGame)}
        onHide={() => setSelectedGame(null)}
      />
    </ProfileSection>
  );
}
