import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCallback, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Skeleton } from "primereact/skeleton";
import { Toast } from "primereact/toast";
import { UserProfileDialog } from "../UserProfile";
import { ProfileSection } from "../ProfileSection";
import PostDetailHero from "./PostDetailHero";
import { EmptyState } from "../EmptyState";
import PostInfoCard from "./PostInfoCard";
import PostInterested from "./PostInterested";
import CommentInput from "./CommentInput";
import CommentItem from "./CommentItem";
import CommentLoginPrompt from "./CommentLoginPrompt";
import { postService } from "../../services/posts";
import {
  usePost,
  usePostComments,
  usePostInterestStatus,
  usePostInterest,
  useUserProfile,
  useFriendStatus,
  useProfileChat,
  useFriendRequest,
  useProfileDialog,
  useRequireAuth,
  useRequireVerified,
  useBlockedIds
} from "../../hooks";
import { confirmDeletePost, confirmDestructive, excludeBlockedAuthors } from "../../utils";
import { useCurrentUser, useCurrentUserData } from "../../context";
import "./Feed.css";
import "./PostDetail.css";

function PostDetailSkeleton() {
  const { t } = useTranslation("posts");

  return (
    <div className="post-detail" aria-busy="true" aria-label={t("detail.loading")}>
      <Skeleton height="340px" borderRadius="16px" className="post-detail-skeleton" />
      <div className="post-detail__grid">
        <div className="post-detail__main">
          <Skeleton height="140px" borderRadius="16px" className="post-detail-skeleton" />
          <Skeleton height="260px" borderRadius="16px" className="post-detail-skeleton" />
        </div>
        <div className="post-detail__side">
          <Skeleton height="380px" borderRadius="16px" className="post-detail-skeleton" />
        </div>
      </div>
    </div>
  );
}

export default function PostDetail({ setEditingPost, setShowCreatePost }) {
  const { t } = useTranslation("posts");
  const user = useCurrentUser();
  const currentUserData = useCurrentUserData();
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useRef(null);

  const [togglingInterest, setTogglingInterest] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);

  const requireAuth = useRequireAuth(user);
  const requireVerified = useRequireVerified(user);

  const { post, loading, error } = usePost(id);
  const { userData: postAuthor } = useUserProfile(post?.userId);

  const { comments: allComments, publishComment, removeComment } = usePostComments(
    id,
    post?.userId,
    user?.uid
  );

  // Comentarios de usuarios bloqueados (en cualquier dirección) se ocultan
  const { blockedIds, loading: loadingBlocks } = useBlockedIds(user);
  const comments = useMemo(
    () => excludeBlockedAuthors(allComments, blockedIds),
    [allComments, blockedIds]
  );

  const { interestedUserIds, interestedCount, isInterested, interestedDoc } =
    usePostInterestStatus(id, user?.uid);

  // Interesados con bloqueo de por medio tampoco aparecen en la lista
  const visibleInterestedIds = useMemo(
    () => interestedUserIds.filter((userId) => !blockedIds.includes(userId)),
    [interestedUserIds, blockedIds]
  );

  const showError = useCallback((detail) => {
    toast.current?.show({ severity: "error", summary: t("common:status.error"), detail, life: 3000 });
  }, [t]);

  const showSuccess = useCallback((detail) => {
    toast.current?.show({ severity: "success", summary: t("common:status.done"), detail, life: 2500 });
  }, [t]);

  const { handleInterested } = usePostInterest(user, () => {
    showError(t("detail.errors.interest"));
  });

  const {
    selectedUserId,
    visible: showProfile,
    openProfile,
    closeProfile
  } = useProfileDialog(user);

  const { friendStatus, setFriendStatus } = useFriendStatus(
    user,
    selectedUserId
  );

  const { handleChat, openChatWith } = useProfileChat(
    user,
    selectedUserId,
    closeProfile,
    showError
  );

  const { handleFriendRequest } = useFriendRequest(
    user,
    selectedUserId,
    setFriendStatus
  );

  // Se esperan los bloqueos para no mostrar un instante un post bloqueado
  if (loading || loadingBlocks) {
    return <PostDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="feed post-detail">
        <EmptyState
          icon="pi-exclamation-triangle"
          title={t("detail.errorTitle")}
          text={t("detail.errorText")}
          actionLabel={t("detail.home")}
          onAction={() => navigate("/")}
          alert
        />
      </div>
    );
  }

  // Si el post se borra, usePost ya redirige al inicio
  if (!post) {
    return null;
  }

  // Link directo a un post de alguien con quien hay bloqueo (en cualquier
  // dirección): no se muestra, igual que en el feed y en /explorar
  if (blockedIds.includes(post.userId)) {
    return (
      <div className="feed post-detail">
        <EmptyState
          icon="pi-ban"
          title={t("detail.blockedTitle")}
          text={t("detail.blockedText")}
          actionLabel={t("detail.home")}
          onAction={() => navigate("/")}
        />
      </div>
    );
  }

  const isOwner = post.userId === user?.uid;

  const handleBack = () => {
    // Sin historial (link directo) se regresa al feed
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const handleToggleInterest = async () => {
    setTogglingInterest(true);

    try {
      await handleInterested(post, interestedDoc);
    } finally {
      setTogglingInterest(false);
    }
  };

  const handleChatWithHost = async () => {
    setOpeningChat(true);

    try {
      await openChatWith(post.userId);
    } finally {
      setOpeningChat(false);
    }
  };

  const handleEdit = () => {
    setEditingPost(post);
    setShowCreatePost(true);
  };

  const handleDeletePost = () => {
    confirmDeletePost({
      onAccept: async () => {
        try {
          await postService.deletePost(post.id);
          navigate("/");
        } catch (error) {
          console.error("Error al eliminar la publicación:", error);
          showError(t("detail.errors.deletePost"));
        }
      }
    });
  };

  const handlePublish = async (comment, file) => {
    // Sin verificar: abre el diálogo y el comentario se queda en el campo
    if (!requireVerified()) return false;
    try {
      return await publishComment(comment, file);
    } catch (error) {
      console.error("Error al publicar comentario:", error);
      showError(t("detail.errors.saveComment"));
      return false;
    }
  };

  const confirmDeleteComment = (commentId) => {
    confirmDestructive({
      header: t("detail.deleteComment.header"),
      message: t("detail.deleteComment.message"),
      acceptLabel: t("detail.deleteComment.accept"),
      onAccept: async () => {
        try {
          await removeComment(commentId);
          showSuccess(t("detail.deleteComment.done"));
        } catch (error) {
          console.error("Error al eliminar comentario:", error);
          showError(t("detail.errors.deleteComment"));
        }
      }
    });
  };

  return (
    <div className="post-detail">
      <PostDetailHero post={post} onBack={handleBack} />

      <div className="post-detail__grid">
        <div className="post-detail__main">
          <ProfileSection title={t("detail.about")} icon="pi-align-left">
            {post.comments ? (
              <p className="post-detail__description">{post.comments}</p>
            ) : (
              <p className="gm-section__empty">{t("detail.noDescription")}</p>
            )}
          </ProfileSection>

          <ProfileSection
            title={t("detail.comments")}
            icon="pi-comments"
            className="post-comments"
            action={user && comments.length > 0 && (
              <span className="post-detail__count">{comments.length}</span>
            )}
          >
            {user ? (
              <CommentInput
                currentUser={currentUserData}
                onPublish={handlePublish}
                onError={showError}
              />
            ) : (
              <CommentLoginPrompt onLogin={requireAuth} />
            )}

            {/* Sin sesión los comentarios no se leen: solo la invitación */}
            {!user ? null : comments.length > 0 ? (
              <ul className="post-comments__list">
                {comments.map((item) => (
                  <CommentItem
                    key={item.id}
                    comment={item}
                    isOwn={item.userId === user?.uid}
                    isHost={item.userId === post.userId}
                    onDelete={confirmDeleteComment}
                    onOpenProfile={openProfile}
                  />
                ))}
              </ul>
            ) : (
              <p className="gm-section__empty post-comments__empty">
                {t("detail.noComments")}
              </p>
            )}
          </ProfileSection>
        </div>

        <div className="post-detail__side">
          <PostInfoCard
            post={post}
            author={postAuthor}
            isOwner={isOwner}
            isInterested={isInterested}
            interestedCount={user ? interestedCount : post.interestedCount ?? 0}
            commentsCount={user ? comments.length : null}
            togglingInterest={togglingInterest}
            openingChat={openingChat}
            onToggleInterest={handleToggleInterest}
            onChatWithHost={handleChatWithHost}
            onOpenGroupChat={() => navigate("/chat", { state: { groupChatId: post.id } })}
            onEdit={handleEdit}
            onDelete={handleDeletePost}
            onAuthorClick={openProfile}
          />

          <PostInterested
            userIds={visibleInterestedIds}
            isOwner={isOwner}
            onOpenProfile={openProfile}
            // Sin sesión: cuántos hay (del post) y la invitación a entrar
            guestCount={user ? null : post.interestedCount ?? 0}
            onLogin={user ? null : requireAuth}
          />
        </div>
      </div>

      <UserProfileDialog
        visible={showProfile}
        onHide={closeProfile}
        selectedUserId={selectedUserId}
        friendStatus={friendStatus}
        onSendFriendRequest={handleFriendRequest}
        onChat={handleChat}
        onFriendStatusChange={setFriendStatus}
      />

      <ConfirmDialog />
      <Toast ref={toast} />
    </div>
  );
}
