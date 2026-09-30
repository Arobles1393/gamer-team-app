import { memo } from "react";
import { UserAvatar } from "../UserAvatar";
import { Button } from "primereact/button";
import { countries } from "../../data/countries";
import { getPresenceLabel, isOnline } from "../../utils";

const MAX_GAMES = 4;

function PlayerStatus({ lastSeen }) {
  const online = isOnline(lastSeen);

  return (
    <span className={`player-card__status${online ? " player-card__status--online" : ""}`}>
      <span className="player-card__status-dot" aria-hidden="true" />
      {getPresenceLabel(lastSeen)}
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

// Con `onChat` (p. ej. en Amigos) muestra también el botón de mensaje
function PlayerCard({ player, onShowProfile, onChat }) {
  const country = countries.find((c) => c.value === player.region);
  const openProfile = () => onShowProfile(player.id);
  const openChat = () => onChat(player.id);

  return (
    <article className="player-card">
      <div className="player-card__banner" aria-hidden="true" />

      <div className="player-card__body">
        <UserAvatar
          image={player.avatar}
          username={player.username}
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

        <div className="player-card__actions">
          {onChat && (
            <Button
              label="Mensaje"
              className="player-card__btn player-card__btn--primary"
              aria-label={`Enviar mensaje a ${player.username}`}
              onClick={openChat}
            />
          )}
          <Button
            label="Ver perfil"
            className="player-card__btn"
            aria-label={`Ver perfil de ${player.username}`}
            onClick={openProfile}
          />
        </div>
      </div>
    </article>
  );
}

export default memo(PlayerCard);
