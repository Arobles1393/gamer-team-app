import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserAvatar } from "../UserAvatar";
import { Button } from "primereact/button";
import { memo, useCallback } from "react";
import PostPlatforms from "./PostPlatforms";
import PostTags from "./PostTags";
import JoinedLabel from "./JoinedLabel";
import { ReportButton } from "../Reports";
import { useJoinFeedback, useUserProfile } from "../../hooks";
import { formatDates } from "../../utils";
import "./PostCard.css";
import { useCurrentUser } from "../../context";

// Portadas decorativas para posts sin imagen; se elige una fija por post
const COVER_VARIANTS = 4;

const getCoverVariant = (id = "") => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash + id.charCodeAt(i)) % COVER_VARIANTS;
  }
  return hash;
};


const formatRelativeTime = (timestamp) => {
  const text = formatDates.formatDateN(timestamp);
  return text.charAt(0).toLowerCase() + text.slice(1);
};

function PostCard({
  post,
  interestedDoc,
  onToggleInterested,
  onEdit,
  onDelete,
  onShowProfile
}) {

  const { t } = useTranslation("posts");
  const navigate = useNavigate();
  const user = useCurrentUser();

  const { userData: author } = useUserProfile(post.userId);

  const isInterested = Boolean(interestedDoc);
  // "Quiero jugar": espera mientras se guarda y "¡Dentro!" al unirse
  const { phase, run } = useJoinFeedback();
  const joined = phase === "joined";

  const handleInterest = useCallback((event) => {
    event.stopPropagation();
    if (phase === "saving") return;
    run(isInterested, () => onToggleInterested(post, interestedDoc));
  }, [phase, run, isInterested, onToggleInterested, post, interestedDoc]);

  const handleEdit = useCallback((event) => {
    event.stopPropagation();
    onEdit(post);
  }, [onEdit, post]);

  const handleDelete = useCallback((event) => {
    event.stopPropagation();
    onDelete(post.id);
  }, [onDelete, post.id]);

  const handleShowProfile = useCallback((event) => {
    event.stopPropagation();
    onShowProfile(post.userId);
  }, [onShowProfile, post.userId]);

  const handleOpenPost = useCallback(() => {
    navigate(`/post/${post.id}`);
  }, [navigate, post.id]);

  const handleKeyDown = useCallback((event) => {
    if (event.target === event.currentTarget && event.key === "Enter") {
      handleOpenPost();
    }
  }, [handleOpenPost]);

  const isOwner = post.userId === user?.uid;

  const showInterestedBadge = !isOwner && isInterested;

  const relativeTime = formatRelativeTime(post.createdAt);

  const gameTitle = post.logo ? (
    <img src={post.logo} alt={post.game} className="post-card__logo" />
  ) : (
    <h3 className="post-card__title">{post.game}</h3>
  );

  return (
    <article
      className="post-card"
      onClick={handleOpenPost}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={t("card.open", { game: post.game })}
    >
      <div className={`post-card__cover post-card__cover--${getCoverVariant(post.id)}`}>
        {post.image && (
          <img src={post.image} alt="" className="post-card__image" loading="lazy" />
        )}
        {showInterestedBadge && (
          <span className={`post-card__interested${joined ? " gm-pop-in" : ""}`}>{t("card.interestedBadge")}</span>
        )}
        <PostPlatforms
          multiplatform={post.multiplatform}
          platforms={post.platforms}
          platform={post.platform}
        />
        {post.scheduledAt && (
          <span className="post-card__scheduled" title={t("card.scheduledTitle")}>
            <i className="pi pi-calendar" aria-hidden="true" />
            {formatDates.formatScheduledTime(post.scheduledAt)}
          </span>
        )}
        <div className="post-card__cover-title">
          {gameTitle}
        </div>
      </div>

      <div className="post-card__body">
        <p className="post-card__meta">
          <i className="pi pi-user" aria-hidden="true" />
          {t("card.playersNeeded", { count: Number(post.playersNeeded) || 0 })}
        </p>

        <PostTags
          requiresMic={post.requiresMic}
          skillLevel={post.skillLevel}
          language={post.language}
        />

        <div className="post-card__author">
          <button
            type="button"
            className="post-card__author-btn"
            onClick={handleShowProfile}
          >
            <UserAvatar
              image={author?.avatar}
              username={author?.username}
              className="post-card__avatar"
            />
            <span className="post-card__username">{author?.username}</span>
          </button>
          {relativeTime && (
            <span className="post-card__time">· {relativeTime}</span>
          )}
          {!isOwner && (
            <ReportButton
              targetType="post"
              targetId={post.id}
              label={t("card.reportLabel", { username: author?.username || t("card.aPlayer"), game: post.game })}
              className="post-card__report"
            />
          )}
        </div>

        <div className="post-card__actions">
          {isOwner ? (
            <>
              <Button
                label={t("card.edit")}
                className="post-card__btn post-card__btn--outline"
                onClick={handleEdit}
              />
              <Button
                label={t("card.delete")}
                className="post-card__btn post-card__btn--danger"
                onClick={handleDelete}
              />
            </>
          ) : (
            <Button
              label={joined ? undefined : isInterested ? t("card.leave") : t("card.join")}
              className={[
                "post-card__btn gm-join-btn",
                isInterested && !joined ? "post-card__btn--leave" : "post-card__btn--primary",
                phase === "saving" && "gm-join-btn--saving",
                joined && "gm-join-btn--joined"
              ].filter(Boolean).join(" ")}
              aria-busy={phase === "saving"}
              onClick={handleInterest}
            >
              {joined && <JoinedLabel />}
            </Button>
          )}
        </div>
        {/* Para lectores de pantalla: el cambio del botón no se anuncia solo */}
        <span className="gm-sr-only" role="status">
          {joined ? t("card.joinedAnnounce", { game: post.game }) : ""}
        </span>
      </div>
    </article>
  );
}

export default memo(PostCard);
