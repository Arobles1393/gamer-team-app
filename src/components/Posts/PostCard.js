import { useNavigate } from "react-router-dom";
import { Card } from "primereact/card";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { memo, useMemo, useCallback } from "react";
import { getPlatformKey, platformIcons } from "../../utils/";
import "./PostCard.css"

function PostCard({
  post,
  user,
  interestedPosts,
  onToggleInterested,
  onJoin,
  onEdit,
  onDelete,
  onShowProfile
}) {

  const navigate = useNavigate();

  const uniquePlatforms = useMemo(
    () =>
      [...new Set(
        (post.platforms || [])
          .map(getPlatformKey)
          .filter(Boolean)
      )],
    [post.platforms]
  );

  const interestedDoc = useMemo(
    () =>
      interestedPosts.find(
        item =>
          item.postId === post.id &&
          item.userId === user.uid
      ),
    [interestedPosts, post.id, user.uid]
  );

  const isInterested = Boolean(interestedDoc);

  const handleInterest = useCallback((event) => {
    event.stopPropagation();

    onToggleInterested(post, interestedDoc);

    if (!isInterested) {
      onJoin(post);
    }
  }, [onToggleInterested, post, interestedDoc, isInterested, onJoin]);

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

  const platformContent = useMemo(() => {
    if (post.multiplatform) {
      return uniquePlatforms.map(platform => (
        <span key={platform}>
          {platformIcons[platform]?.()}
        </span>
      ));
    }

    return platformIcons[post.platform]?.();
  }, [post.multiplatform, uniquePlatforms, post.platform]);

  const interestLabel = isInterested
    ? "Ya no me interesa"
    : "Quiero jugar";

  const interestIcon = isInterested
    ? "pi pi-times"
    : "pi pi-users";

  const interestSeverity = isInterested
    ? "danger"
    : "success";

  const interestedBadgeText = "Te interesa esta publicación";

  const isOwner = post.userId === user.uid;

  const showInterestedBadge = !isOwner && isInterested;

  const imageSrc = post.image ?? "/imagenotfound.png";

  return (
    <Card 
      className="rawg-card" 
      onClick={handleOpenPost}
    >
      <div className="rawg-image-container">
        {showInterestedBadge && (
          <div className="interested-badge-container">
            <span className="joined-badge">
              {interestedBadgeText}
            </span>
          </div>
        )}
        <img
          src={imageSrc}
          alt={post.game}
          className="rawg-image"
        />
      </div>
      <div>
        {post.logo ? (
          <img src={post.logo} alt={post.game} className="logo-game" />
        ) : (
          <h3>{post.game}</h3>
        )}
        <div className="rawg-meta">
          <div className="meta-item">
            {platformContent}
          </div>
          <div className="meta-item meta-item-right">
            <i className="pi pi-users"></i>
            <span>{post.playersNeeded} jugadores</span>
          </div>
        </div>
        <div className="rawg-extra">
          {post.comments && (
            <p>{post.comments}</p>
          )}
          <div className="user-row">
            <Avatar
              image={post?.avatar}
              label={post.username?.[0]?.toUpperCase()}
              shape="circle"
              className="clickable-avatar"
              onClick={handleShowProfile}
            />
            <span>
              {post.username}
            </span>
          </div>
          <div className="post-actions">
            {isOwner ? (
              <>
                <Button
                  label="Editar"
                  icon="pi pi-pencil"
                  severity="success"
                  size="small"
                  onClick={handleEdit}
                />
                <Button
                  label="Eliminar"
                  icon="pi pi-trash"
                  severity="danger"
                  size="small"
                  onClick={handleDelete}
                />
              </>
            ) : (
              <Button
                label={interestLabel}
                icon={interestIcon}
                severity={interestSeverity}
                size="small"
                onClick={handleInterest}
              />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default memo(PostCard);