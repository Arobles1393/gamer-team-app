import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "primereact/button";
import { UserAvatar } from "../UserAvatar";
import { useUserProfile } from "../../hooks";
import { getCountryLabel } from "../../utils";
import { getLanguageLabel, platforms } from "../../constants";

// Verde > 75, violeta 50-75, gris < 50
const scoreTone = (score) => {
  if (score > 75) return "high";
  if (score >= 50) return "mid";
  return "low";
};

// Texto de cada valor en común según el tipo de señal (computeCompatibility)
const useSignalLabel = (gameNames) => {
  const { t } = useTranslation("matching");

  const labelOf = {
    games: (value) => gameNames[value] ?? t("signal.game"),
    schedule: (value) => t(`timeShort.${value}`),
    platforms: (value) => platforms.find((platform) => platform.value === value)?.label ?? value,
    skillLevel: (value) => t(`level.${value}`),
    groupSize: (value) => t(`group.${value}`),
    languages: (value) => getLanguageLabel(value) ?? value,
    mic: () => t("signal.mic"),
    region: (value) => getCountryLabel(value),
    values: (value) => t(`values.${value}`)
  };

  return ({ type, values }) => {
    const first = labelOf[type](values[0]);
    return values.length > 1 ? t("signal.more", { label: first, count: values.length - 1 }) : first;
  };
};

/**
 * Jugador compatible: avatar y usuario en vivo (publicProfiles), % de
 * compatibilidad y lo que tienen en común. gameNames: { [gameId]: nombre }
 * de mis juegos favoritos (los en común son siempre míos también).
 */
function MatchCard({ match, gameNames, onShowProfile }) {
  const { t } = useTranslation("matching");
  const { userData } = useUserProfile(match.id);
  const signalLabel = useSignalLabel(gameNames);
  const username = userData?.username ?? "";
  const tone = scoreTone(match.score);

  return (
    <article className="player-card match-card">
      <div className="player-card__banner" aria-hidden="true" />

      <div className="player-card__body">
        <UserAvatar image={userData?.avatar} username={username} className="player-card__avatar" />

        <h3 className="player-card__name">{username || " "}</h3>

        <p className={`match-card__score match-card__score--${tone}`}>
          {t("compatible.percent", { score: match.score })}
        </p>

        {match.matchedSignals.length > 0 && (
          <ul className="match-card__signals" aria-label={t("compatible.signalsLabel")}>
            {match.matchedSignals.map((signal) => (
              <li key={signal.type} className="match-card__signal">
                <i className={`pi ${signal.icon}`} aria-hidden="true" />
                {signalLabel(signal)}
              </li>
            ))}
          </ul>
        )}

        <div className="player-card__actions">
          <Button
            label={t("friends:card.viewProfile")}
            className="player-card__btn"
            aria-label={t("friends:card.viewProfileLabel", { username })}
            onClick={() => onShowProfile(match.id)}
          />
        </div>
      </div>
    </article>
  );
}

export default memo(MatchCard);
