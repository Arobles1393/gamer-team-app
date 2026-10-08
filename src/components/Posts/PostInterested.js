import { useTranslation } from "react-i18next";
import { Button } from "primereact/button";
import { UserAvatar } from "../UserAvatar";
import { Skeleton } from "primereact/skeleton";
import { ProfileSection } from "../ProfileSection";
import { useUserProfiles } from "../../hooks";
import { getPresenceLabel, isOnline } from "../../utils";

// Jugadores que tocaron "Quiero jugar": el anfitrión puede abrir su perfil y escribirles.
// Sin sesión (onLogin) no se sabe quiénes son (firestore.rules, auditoría M-11):
// solo cuántos (guestCount) y la invitación a entrar
export default function PostInterested({ userIds, isOwner, onOpenProfile, guestCount = null, onLogin = null }) {
  const { t } = useTranslation("posts");
  const { users, loading } = useUserProfiles(userIds);
  const count = onLogin ? guestCount : userIds.length;

  const renderBody = () => {
    if (onLogin) {
      return (
        <div className="comment-login">
          <p className="comment-login__text">{t("interested.loginPrompt")}</p>
          <Button
            label={t("common:actions.login")}
            icon="pi pi-sign-in"
            className="gm-btn gm-btn--ghost comment-login__btn"
            onClick={onLogin}
          />
        </div>
      );
    }

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
      action={count > 0 && <span className="post-detail__count">{count}</span>}
    >
      {renderBody()}
    </ProfileSection>
  );
}
