import { memo } from "react";
import { useTranslation } from "react-i18next";
import { UserAvatar } from "../UserAvatar";
import { Button } from "primereact/button";
import { countries } from "../../data/countries";
import { getCountryLabel, getPresenceLabel, isOnline } from "../../utils";
import SteamIcon from "../Steam/SteamIcon";
import { TwitchLive } from "../Twitch";

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

// Solo aparece si Steam confirma que está jugando algo: offline y perfil
// privado se ven igual desde la API, así que nunca se muestra "desconectado"
function SteamGameStatus({ game }) {
  const { t } = useTranslation();

  return (
    <span className="player-card__steam" title={t("presence.playingOnSteam", { game })}>
      <SteamIcon className="player-card__steam-icon" />
      <span className="player-card__steam-text">{t("presence.playing", { game })}</span>
    </span>
  );
}

function PlayerGames({ games }) {
  const { t } = useTranslation("friends");

  if (!games?.length) {
    return <p className="player-card__no-games">{t("card.noGames")}</p>;
  }

  const visible = games.slice(0, MAX_GAMES);
  const extra = games.length - visible.length;

  return (
    <ul className="player-card__games" aria-label={t("card.gamesLabel")}>
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

// Con `onChat` (p. ej. en Amigos) muestra también el botón de mensaje.
// `steamGame` y `twitchLive` los resuelve el padre para toda la lista
// (useSteamPresenceBatch, useTwitchPresenceBatch). Pueden aparecer los dos.
function PlayerCard({ player, steamGame, twitchLive, onShowProfile, onChat }) {
  const { t } = useTranslation("friends");
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
              {getCountryLabel(player.region)}
            </span>
          )}
          <PlayerStatus lastSeen={player.lastSeen} />
        </div>

        {steamGame && <SteamGameStatus game={steamGame} />}
        <TwitchLive live={twitchLive} className="player-card__twitch" />

        <PlayerGames games={player.games} />

        <div className="player-card__actions">
          {onChat && (
            <Button
              label={t("card.message")}
              className="player-card__btn player-card__btn--primary"
              aria-label={t("card.messageLabel", { username: player.username })}
              onClick={openChat}
            />
          )}
          <Button
            label={t("card.viewProfile")}
            className="player-card__btn"
            aria-label={t("card.viewProfileLabel", { username: player.username })}
            onClick={openProfile}
          />
        </div>
      </div>
    </article>
  );
}

export default memo(PlayerCard);
