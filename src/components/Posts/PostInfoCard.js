import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { platformIcons } from "../../utils/platformIcons";
import { getPlatformKey } from "../../utils/getPlatformKey";
import { formatDates } from "../../utils";

export default function PostInfoCard({
  post,
  postAuthor,
  comments,
  interestedCount,
  isInterested,
  currentUserId,
  onInterestedClick,
  onAuthorClick
}) {
  const uniquePlatforms = [
    ...new Set(
      (post.platforms || [])
        .map(getPlatformKey)
        .filter(Boolean)
    )
  ];

  return (
    <div className="left-panel">
      <img
        src={!post.portada ? post.image : post.portada}
        alt={post.game}
        className="game-cover"
      />
      {!post.portada && <h2>{post.game}</h2>}

      <div className="meta-item">
        {post.multiplatform ? (
          uniquePlatforms.map((platform) => (
            <span key={platform}>{platformIcons[platform]?.()}</span>
          ))
        ) : (
          platformIcons[post.platform]?.()
        )}
      </div>

      <div className="game-info-card">
        <div className="info-row">
          <Avatar
            image={postAuthor?.avatar}
            label={postAuthor?.username?.charAt(0).toUpperCase()}
            shape="circle"
            onClick={(e) => {
              e.stopPropagation();
              onAuthorClick(post.userId);
            }}
          />
          <span>{postAuthor?.username}</span>
        </div>

        <div className="info-row">
          <i className="pi pi-clock"></i>
          <span>{formatDates.formatDateN(post.createdAt)}</span>
        </div>

        <div className="info-row">
          <i className="pi pi-globe"></i>
          <span>{postAuthor?.region}</span>
        </div>

        <div className="info-row">
          <i className="pi pi-comments"></i>
          <span>{comments.length} comentarios</span>
        </div>

        <div className="info-row">
          <i className="pi pi-users"></i>
          <span>{interestedCount} jugadores interesados</span>
        </div>

        {post.userId !== currentUserId && (
          <Button
            label={isInterested ? "Ya no me interesa" : "Quiero jugar"}
            icon={isInterested ? "pi pi-times" : "pi pi-users"}
            className={isInterested ? "p-button-danger" : "p-button-success"}
            onClick={onInterestedClick}
          />
        )}
      </div>
    </div>
  );
}