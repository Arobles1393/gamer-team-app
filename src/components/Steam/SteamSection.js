import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";
import { ProfileSection } from "../ProfileSection";
import GameAchievementsDialog from "./GameAchievementsDialog";
import { useSteamStats } from "../../hooks";
import { getIntlLocale } from "../../i18n";
import "./Steam.css";

const STEAM_CDN = "https://cdn.cloudflare.steamstatic.com/steam/apps";

const formatNumber = (value) => value.toLocaleString(getIntlLocale());

const formatHours = (minutes) => formatNumber(Math.round(minutes / 60));

function SteamGameCard({ game, maxPlaytime, onSelect }) {
  const { t } = useTranslation("profile");
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
        aria-label={t("steam.viewAchievements", { name: game.name })}
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
          <span className="steam-game__hours">
            {t("steam.hours", { hours: formatHours(game.playtime_forever) })}
          </span>
          <span className="steam-game__bar" aria-hidden="true">
            <span style={{ width: `${percent}%` }} />
          </span>
        </span>
      </button>
    </li>
  );
}

function SteamSkeleton() {
  const { t } = useTranslation("profile");

  return (
    <div aria-busy="true" aria-label={t("steam.loading")}>
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
  const { t } = useTranslation("profile");
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
          <p className="gm-section__empty">{t("steam.connectHint")}</p>
          {onConnect && (
            <Button
              label={t("steam.connect")}
              icon="pi pi-link"
              className="gm-btn gm-btn--ghost"
              onClick={onConnect}
            />
          )}
        </div>
      ) : (
        <p className="gm-section__empty">{t("steam.notConnected")}</p>
      );
    }

    if (steamError) {
      return (
        <p className="gm-section__empty">
          {t("steam.error")} {isOwnProfile ? t("steam.errorOwn") : t("steam.errorOther")}
        </p>
      );
    }

    if (!steamStats || games.length === 0) {
      return (
        <p className="gm-section__empty">{t("steam.noGames")}</p>
      );
    }

    return (
      <>
        <div className="steam-summary">
          <div className="steam-stat">
            <span className="steam-stat__value">{formatNumber(steamStats.totalHours)}</span>
            <span className="steam-stat__label">{t("steam.hoursPlayed")}</span>
          </div>
          <div className="steam-stat">
            <span className="steam-stat__value">{formatNumber(steamStats.totalGames)}</span>
            <span className="steam-stat__label">{t("steam.games")}</span>
          </div>
          <div className="steam-stat steam-stat--wide">
            <span className="steam-stat__value steam-stat__value--text" title={games[0].name}>
              {games[0].name}
            </span>
            <span className="steam-stat__label">{t("steam.mostPlayed")}</span>
          </div>
        </div>

        <p className="steam-section__subtitle">{t("steam.subtitle")}</p>

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
            {t("steam.viewOnSteam")}
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
