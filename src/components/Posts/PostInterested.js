import { useTranslation } from "react-i18next";
import { UserAvatar } from "../UserAvatar";
import { Skeleton } from "primereact/skeleton";
import { ProfileSection } from "../ProfileSection";
import { useUserProfiles } from "../../hooks";
import { getPresenceLabel, isOnline } from "../../utils";

// Jugadores que tocaron "Quiero jugar": el anfitrión puede abrir su perfil y escribirles
export default function PostInterested({ userIds, isOwner, onOpenProfile }) {
  const { t } = useTranslation("posts");
  // Perfiles públicos: con y sin sesión se ve el nombre y la presencia
  const { users, loading } = useUserProfiles(userIds);

  const renderBody = () => {
    if (loading) {
      return (
        <ul className="post-interested" aria-busy="true" aria-label={t("interested.loading")}>
          {Array.from({ length: Math.min(userIds.length, 3) }, (_, i) => (
            <li key={i} className="post-interested__skeleton">
              <Skeleton shape="circle" size="40px" className="post-detail-skeleton" />
              <Skeleton width="60%" height="14px" className="post-detail-skeleton" />
            </li>
          ))}
        </ul>
      );
    }

    if (users.length === 0) {
      return (
        <p className="gm-section__empty">
          {isOwner
            ? t("interested.emptyOwner")
            : t("interested.empty")}
        </p>
      );
    }

    return (
      <ul className="post-interested">
        {users.map((player) => {
          const online = isOnline(player.lastSeen);

          return (
            <li key={player.id}>
              <button
                type="button"
                className="post-interested__item"
                onClick={() => onOpenProfile(player.id)}
              >
                <span className="post-interested__avatar">
                  <UserAvatar
                    image={player.avatar}
                    username={player.username}
                    className="post-interested__avatar-img"
                  />
                  {online && <span className="post-interested__online" aria-hidden="true" />}
                </span>
                <span className="post-interested__text">
                  <span className="post-interested__name">{player.username}</span>
                  <span className={`post-interested__status${online ? " post-interested__status--online" : ""}`}>
                    {getPresenceLabel(player.lastSeen)}
                  </span>
                </span>
                <i className="pi pi-chevron-right post-interested__arrow" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <ProfileSection
      title={t("interested.title")}
      icon="pi-users"
      className="post-interested-section"
      action={userIds.length > 0 && <span className="post-detail__count">{userIds.length}</span>}
    >
      {renderBody()}
    </ProfileSection>
  );
}
