import { useNavigate } from "react-router-dom";
import { UserAvatar } from "../UserAvatar";
import { Button } from "primereact/button";
import { memo, useCallback } from "react";
import PostPlatforms from "./PostPlatforms";
import { ReportButton } from "../Reports";
import { useUserProfile } from "../../hooks";
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

const formatPlayersNeeded = (count) => (
  Number(count) === 1
    ? "1 jugador necesario"
    : `${count} jugadores necesarios`
);

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

  const navigate = useNavigate();
  const user = useCurrentUser();

  const { userData: author } = useUserProfile(post.userId, { publicOnly: !user });

  const isInterested = Boolean(interestedDoc);

  const handleInterest = useCallback(async (event) => {
    event.stopPropagation();
    await onToggleInterested(post, interestedDoc);
  }, [onToggleInterested, post, interestedDoc]);

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
      aria-label={`Ver partida de ${post.game}`}
    >
      <div className={`post-card__cover post-card__cover--${getCoverVariant(post.id)}`}>
        {post.image && (
          <img src={post.image} alt="" className="post-card__image" loading="lazy" />
        )}
        {showInterestedBadge && (
          <span className="post-card__interested">Te interesa</span>
        )}
        <PostPlatforms
          multiplatform={post.multiplatform}
          platforms={post.platforms}
          platform={post.platform}
        />
        <div className="post-card__cover-title">
          {gameTitle}
        </div>
      </div>

      <div className="post-card__body">
        <p className="post-card__meta">
          <i className="pi pi-user" aria-hidden="true" />
          {formatPlayersNeeded(post.playersNeeded)}
        </p>

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
              label={`Publicación de ${author?.username || "un jugador"} · ${post.game}`}
              className="post-card__report"
            />
          )}
        </div>

        <div className="post-card__actions">
          {isOwner ? (
            <>
              <Button
                label="Editar"
                className="post-card__btn post-card__btn--outline"
                onClick={handleEdit}
              />
              <Button
                label="Eliminar"
                className="post-card__btn post-card__btn--danger"
                onClick={handleDelete}
              />
            </>
          ) : (
            <Button
              label={isInterested ? "Ya no me interesa" : "Quiero jugar"}
              className={`post-card__btn ${isInterested ? "post-card__btn--leave" : "post-card__btn--primary"}`}
              onClick={handleInterest}
            />
          )}
        </div>
      </div>
    </article>
  );
}

export default memo(PostCard);
