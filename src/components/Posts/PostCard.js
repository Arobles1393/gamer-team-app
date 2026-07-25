import { useNavigate } from "react-router-dom";
import { Card } from "primereact/card";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { memo, useMemo, useCallback } from "react";
import PostPlatforms from "./PostPlatforms";
import "./PostCard.css"

function PostCard({
  post,
  user,
  interestedDoc,
  onToggleInterested,
  onContactOwner,
  onEdit,
  onDelete,
  onShowProfile
}) {

  const navigate = useNavigate();

  const isInterested = Boolean(interestedDoc);

  const handleInterest = useCallback(async(event) => {
    event.stopPropagation();

    const success = await onToggleInterested(post, interestedDoc);

    if (!success || isInterested) {
      return;
    }

    onContactOwner?.(post);

  },[
    onToggleInterested,
    post,
    interestedDoc,
    isInterested,
    onContactOwner
  ]);

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

  const gameTitle = post.logo ? (
    <img 
      src={post.logo}
      alt={post.game}
      className="logo-game"
    />
  ) : (
    <h3>{post.game}</h3>
  );

  const interestButton = useMemo(() => (
    isInterested
      ? {
          label: "Ya no me interesa",
          icon: "pi pi-times",
          severity: "danger"
        }
      : {
          label: "Quiero jugar",
          icon: "pi pi-users",
          severity: "success"
        }
  ), [isInterested]);

  const interestedBadgeText = "Te interesa esta publicación";

  const isOwner = post.userId === user.uid;

  const showInterestedBadge = !isOwner && isInterested;

  const imageSrc = post.image ?? "/imagenotfound.png";

  const usernameInitial = post.username?.charAt(0)?.toUpperCase() || "?";

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
        {gameTitle}
        <div className="rawg-meta">
          <div className="meta-item">
            <PostPlatforms
              multiplatform={post.multiplatform}
              platforms={post.platforms}
              platform={post.platform}
            />
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
              label={usernameInitial}
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
                label={interestButton.label}
                icon={interestButton.icon}
                severity={interestButton.severity}
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