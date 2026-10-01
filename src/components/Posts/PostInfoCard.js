import { useTranslation } from "react-i18next";
import { UserAvatar } from "../UserAvatar";
import { Button } from "primereact/button";
import { ProfileSection } from "../ProfileSection";
import { countries } from "../../data/countries";
import { formatDates, getCountryLabel } from "../../utils";
import { getLanguageLabel, getSkillLevelLabel } from "../../constants";

function InfoRow({ icon, label, children }) {
  return (
    <div className="post-info__row">
      <i className={`pi ${icon} post-info__row-icon`} aria-hidden="true" />
      <dt className="post-info__label">{label}</dt>
      <dd className="post-info__value">{children}</dd>
    </div>
  );
}


/**
 * Detalles de la partida y acciones: Quiero jugar / Mensaje al anfitrión,
 * o Editar / Eliminar si el post es del usuario. "Chat del grupo" solo para
 * el autor y los interesados (los participantes del grupo).
 */
export default function PostInfoCard({
  post,
  author,
  isOwner,
  isInterested,
  interestedCount,
  commentsCount,
  togglingInterest,
  openingChat,
  onToggleInterest,
  onChatWithHost,
  onOpenGroupChat,
  onEdit,
  onDelete,
  onAuthorClick
}) {
  const { t } = useTranslation("posts");
  const username = author?.username || t("comments.player");
  const country = countries.find((c) => c.value === author?.region);
  const playersNeeded = Number(post.playersNeeded) || 0;

  return (
    <ProfileSection title="Detalles" icon="pi-info-circle" className="post-info">
      <button
        type="button"
        className="post-info__host"
        onClick={() => onAuthorClick(post.userId)}
      >
        <UserAvatar
          image={author?.avatar}
          username={username}
          className="post-info__avatar"
        />
        <span className="post-info__host-text">
          <span className="post-info__host-label">
            {isOwner ? t("info.hostYou") : t("info.host")}
          </span>
          <span className="post-info__host-name">{username}</span>
        </span>
        <i className="pi pi-chevron-right post-info__host-arrow" aria-hidden="true" />
      </button>

      <dl className="post-info__list">
        {/* Programada: lo que importa para unirse es cuándo se juega */}
        {post.scheduledAt ? (
          <InfoRow icon="pi-clock" label={t("info.scheduled")}>
            {formatDates.formatScheduledTime(post.scheduledAt)}
          </InfoRow>
        ) : (
          <InfoRow icon="pi-clock" label={t("info.published")}>
            {formatDates.formatDateN(post.createdAt) || "—"}
          </InfoRow>
        )}
        <InfoRow icon="pi-globe" label={t("info.region")}>
          {author?.region ? `${country?.flag ?? ""} ${getCountryLabel(author.region)}`.trim() : t("info.noRegion")}
        </InfoRow>
        {playersNeeded > 0 && (
          <InfoRow icon="pi-user" label={t("info.lookingFor")}>
            {t("info.players", { count: playersNeeded })}
          </InfoRow>
        )}
        {/* Etiquetas opcionales: solo las que tienen valor */}
        {post.requiresMic === true && (
          <InfoRow icon="pi-microphone" label={t("info.mic")}>{t("tags.micRequired")}</InfoRow>
        )}
        {post.skillLevel && (
          <InfoRow icon="pi-trophy" label={t("info.level")}>{getSkillLevelLabel(post.skillLevel)}</InfoRow>
        )}
        {post.language && (
          <InfoRow icon="pi-language" label={t("info.language")}>{getLanguageLabel(post.language)}</InfoRow>
        )}
        <InfoRow icon="pi-users" label={t("info.interested")}>
          {t("info.players", { count: interestedCount })}
        </InfoRow>
        <InfoRow icon="pi-comments" label={t("info.comments")}>
          {commentsCount}
        </InfoRow>
      </dl>

      <div className="post-info__actions">
        {(isOwner || isInterested) && (
          <Button
            label={t("info.groupChat")}
            icon="pi pi-users"
            className="gm-btn gm-btn--primary post-info__group-chat"
            onClick={onOpenGroupChat}
          />
        )}
        {isOwner ? (
          <>
            <Button
              label={t("info.editPost")}
              icon="pi pi-pencil"
              className="gm-btn gm-btn--ghost"
              onClick={onEdit}
            />
            <Button
              label={t("info.delete")}
              icon="pi pi-trash"
              className="gm-btn gm-btn--danger"
              onClick={onDelete}
            />
          </>
        ) : (
          <>
            <Button
              label={isInterested ? t("card.leave") : t("card.join")}
              icon={isInterested ? "pi pi-times" : "pi pi-bolt"}
              className={`gm-btn ${isInterested ? "gm-btn--danger" : "gm-btn--primary"}`}
              loading={togglingInterest}
              onClick={onToggleInterest}
            />
            <Button
              label={t("info.messageHost")}
              icon="pi pi-comments"
              className="gm-btn gm-btn--ghost"
              loading={openingChat}
              onClick={onChatWithHost}
            />
          </>
        )}
      </div>
    </ProfileSection>
  );
}
