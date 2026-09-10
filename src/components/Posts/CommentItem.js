import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { useUserProfile } from "../../hooks";

export default function CommentItem({
  comment,
  currentUserId,
  onDelete,
  onOpenProfile
}) {
  const { userData: author } = useUserProfile(comment.userId);

  return (
    <div className="comment-card">
      {comment.userId === currentUserId && (
        <Button
          icon="pi pi-times"
          className="p-button-rounded p-button-text p-button-danger delete-comment-btn"
          onClick={() => onDelete(comment.id)}
        />
      )}

      <div className="comment-header">
        <Avatar
          image={author?.avatar}
          label={author?.username?.charAt(0).toUpperCase()}
          shape="circle"
          onClick={(e) => {
            e.stopPropagation();
            onOpenProfile(comment.userId);
          }}
        />
        <span>{author?.username}</span>
      </div>

      {comment.text && <p>{comment.text}</p>}

      {comment.mediaType === "image" && (
        <img src={comment.mediaUrl} className="comment-image" />
      )}

      {comment.mediaType === "video" && (
        <video controls className="comment-video">
          <source src={comment.mediaUrl} />
        </video>
      )}
    </div>
  );
}