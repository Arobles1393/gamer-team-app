import { memo } from "react";
import { useTranslation } from "react-i18next";
import { UserAvatar } from "../UserAvatar";
import { useUserProfile } from "../../hooks";
import { formatDates } from "../../utils";
import { ReportButton } from "../Reports";

function CommentItem({
  comment,
  isOwn,
  isHost,
  onDelete,
  onOpenProfile
}) {
  const { t } = useTranslation("posts");
  const { userData: author } = useUserProfile(comment.userId);
  const username = author?.username || t("comments.player");

  const openProfile = () => onOpenProfile(comment.userId);

  return (
    <li className="comment">
      <button
        type="button"
        className="comment__avatar-btn"
        aria-label={t("comments.viewProfile", { username })}
        onClick={openProfile}
      >
        <UserAvatar
          image={author?.avatar}
          username={username}
          className="comment__avatar"
        />
      </button>

      <div className="comment__body">
        <div className="comment__header">
          <button type="button" className="comment__author" onClick={openProfile}>
            {username}
          </button>
          {isHost && <span className="comment__badge">{t("comments.host")}</span>}
          <span className="comment__time">
            {formatDates.formatDateN(comment.createdAt)}
          </span>

          {isOwn ? (
            <button
              type="button"
              className="comment__delete"
              aria-label={t("comments.delete")}
              onClick={() => onDelete(comment.id)}
            >
              <i className="pi pi-trash" aria-hidden="true" />
            </button>
          ) : (
            <ReportButton
              targetType="comment"
              targetId={comment.id}
              label={t("comments.reportLabel", { username })}
              className="comment__report"
            />
          )}
        </div>

        {comment.text && <p className="comment__text">{comment.text}</p>}

        {comment.mediaType === "image" && (
          <a
            href={comment.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="comment__media-link"
            aria-label={t("comments.openImage")}
          >
            <img
              src={comment.mediaUrl}
              alt={t("comments.imageAlt", { username })}
              loading="lazy"
              className="comment__media"
            />
          </a>
        )}

        {comment.mediaType === "video" && (
          <video controls preload="metadata" className="comment__media">
            <source src={comment.mediaUrl} />
          </video>
        )}
      </div>
    </li>
  );
}

export default memo(CommentItem);
