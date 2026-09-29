import { memo } from "react";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { countries } from "../../data/countries";
import { formatDates } from "../../utils";

const MAX_GAMES = 4;
// La presencia se actualiza cada 30 s: 2 min de margen para "en línea"
const ONLINE_WINDOW_MS = 2 * 60 * 1000;

const getLastSeenMs = (lastSeen) => {
  if (!lastSeen) return null;
  if (lastSeen.toMillis) return lastSeen.toMillis();
  if (lastSeen.seconds) return lastSeen.seconds * 1000;
  return new Date(lastSeen).getTime() || null;
};

function PlayerStatus({ lastSeen }) {
  const lastSeenMs = getLastSeenMs(lastSeen);
  const online = lastSeenMs !== null && Date.now() - lastSeenMs < ONLINE_WINDOW_MS;

  const label = online
    ? "En línea"
    : lastSeenMs
      ? `Visto hace ${formatDates.formatChatTime(lastSeen)}`
      : "Desconectado";

  return (
    <span className={`player-card__status${online ? " player-card__status--online" : ""}`}>
      <span className="player-card__status-dot" aria-hidden="true" />
      {label}
    </span>
  );
}

function PlayerGames({ games }) {
  if (!games?.length) {
    return <p className="player-card__no-games">Sin juegos favoritos</p>;
  }

  const visible = games.slice(0, MAX_GAMES);
  const extra = games.length - visible.length;

  return (
    <ul className="player-card__games" aria-label="Juegos favoritos">
      {visible.map((game) => (
        <li key={game.id} className="player-card__game" title={game.name}>
          <img src={game.image} alt={game.name} loading="lazy" />
        </li>
      ))}
      {extra > 0 && (
        <li className="player-card__game player-card__game--more">+{extra}</li>
      )}
    </ul>
  );
}

function PlayerCard({ player, onShowProfile }) {
  const country = countries.find((c) => c.value === player.region);
  const openProfile = () => onShowProfile(player.id);

  return (
    <article className="player-card">
      <div className="player-card__banner" aria-hidden="true" />

      <div className="player-card__body">
        <Avatar
          image={player.avatar}
          label={player.avatar ? undefined : player.username?.charAt(0).toUpperCase()}
          shape="circle"
          className="player-card__avatar"
        />

        <h3 className="player-card__name">{player.username}</h3>

        <div className="player-card__meta">
          {player.region && (
            <span className="player-card__region">
              {country?.flag && <span aria-hidden="true">{country.flag}</span>}
              {player.region}
            </span>
          )}
          <PlayerStatus lastSeen={player.lastSeen} />
        </div>

        <PlayerGames games={player.games} />

        <Button
          label="Ver perfil"
          className="player-card__btn"
          aria-label={`Ver perfil de ${player.username}`}
          onClick={openProfile}
        />
      </div>
    </article>
  );
}

export default memo(PlayerCard);
