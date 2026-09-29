import { Skeleton } from "primereact/skeleton";
import { useUserProfile } from "../../hooks";
import { ProfileHero } from "../ProfileHero";
import { ProfileSection } from "../ProfileSection";
import { FavoriteGames } from "../FavoriteGames";
import { SocialLinks } from "../SocialLinks";
import { SteamSection } from "../Steam";
import { countries } from "../../data/countries";
import { getPresenceLabel, isOnline } from "../../utils";

function UserProfileSkeleton() {
  return (
    <div className="user-profile" aria-busy="true" aria-label="Cargando perfil">
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
  const { userData } = useUserProfile(userId);

  if (!userData) {
    return <UserProfileSkeleton />;
  }

  const country = countries.find((c) => c.value === userData.region);

  return (
    <div className="user-profile">
      <ProfileHero
        userData={userData}
        country={country}
        eyebrow="Perfil de jugador"
        presence={getPresenceLabel(userData.lastSeen)}
        online={isOnline(userData.lastSeen)}
        actions={actions}
        bannerAction={
          <button
            type="button"
            className="profile-hero__banner-btn profile-hero__banner-btn--icon"
            aria-label="Cerrar perfil"
            onClick={onClose}
          >
            <i className="pi pi-times" aria-hidden="true" />
          </button>
        }
      />

      <div className="user-profile__grid">
        <div className="user-profile__column">
          {userData.description && (
            <ProfileSection title="Sobre mí" icon="pi-user">
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
