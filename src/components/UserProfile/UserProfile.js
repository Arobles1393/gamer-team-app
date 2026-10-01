import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "primereact/skeleton";
import { useUserProfile, useSteamPresenceBatch, useTwitchPresenceBatch } from "../../hooks";
import { ProfileHero } from "../ProfileHero";
import { ProfileSection } from "../ProfileSection";
import { FavoriteGames } from "../FavoriteGames";
import { SocialLinks } from "../SocialLinks";
import { SteamSection } from "../Steam";
import { countries } from "../../data/countries";
import { getPresenceLabel, isOnline } from "../../utils";

function UserProfileSkeleton() {
  const { t } = useTranslation("profile");

  return (
    <div className="user-profile" aria-busy="true" aria-label={t("player.loading")}>
      <Skeleton height="220px" borderRadius="0" className="steam-skeleton" />
      <div className="user-profile__grid">
        <Skeleton height="240px" borderRadius="16px" className="steam-skeleton" />
        <Skeleton height="240px" borderRadius="16px" className="steam-skeleton" />
      </div>
    </div>
  );
}

/**
 * Perfil de solo lectura de un jugador (se abre en UserProfileDialog).
 * `actions` son los botones de amistad / mensaje que van en el hero.
 */
export default function UserProfile({ userId, actions, onClose }) {
  const { t } = useTranslation("profile");
  const { userData } = useUserProfile(userId);

  // Misma consulta batcheada que en las listas, aquí con un solo jugador
  const links = userData?.links;
  const players = useMemo(
    () => (links ? [{ id: userId, links }] : []),
    [userId, links]
  );
  const steamGames = useSteamPresenceBatch(players);
  const twitchLive = useTwitchPresenceBatch(players);

  if (!userData) {
    return <UserProfileSkeleton />;
  }

  const country = countries.find((c) => c.value === userData.region);

  return (
    <div className="user-profile">
      <ProfileHero
        userData={userData}
        country={country}
        eyebrow={t("player.eyebrow")}
        presence={getPresenceLabel(userData.lastSeen)}
        online={isOnline(userData.lastSeen)}
        steamGame={steamGames[userId]}
        twitchLive={twitchLive[userId]}
        actions={actions}
        bannerAction={
          <button
            type="button"
            className="profile-hero__banner-btn profile-hero__banner-btn--icon"
            aria-label={t("player.close")}
            onClick={onClose}
          >
            <i className="pi pi-times" aria-hidden="true" />
          </button>
        }
      />

      <div className="user-profile__grid">
        <div className="user-profile__column">
          {userData.description && (
            <ProfileSection title={t("about.title")} icon="pi-user">
              <p className="user-profile__about">{userData.description}</p>
            </ProfileSection>
          )}

          <SteamSection links={userData.links} />

          <FavoriteGames games={userData.games} />
        </div>

        <div className="user-profile__column">
          <SocialLinks links={userData.links} />
        </div>
      </div>
    </div>
  );
}
