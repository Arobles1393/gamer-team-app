import { useNavigate, useParams } from "react-router-dom";
import { useCallback, useRef, useState } from "react";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Skeleton } from "primereact/skeleton";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { UserProfileDialog } from "../UserProfile";
import { ProfileSection } from "../ProfileSection";
import PostDetailHero from "./PostDetailHero";
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
  useRequireAuth
} from "../../hooks";
import { confirmDeletePost, confirmDestructive } from "../../utils";
import { useCurrentUser, useCurrentUserData } from "../../context";
import "./Feed.css";
import "./PostDetail.css";

function PostDetailSkeleton() {
  return (
    <div className="post-detail" aria-busy="true" aria-label="Cargando partida">
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
  const user = useCurrentUser();
  const currentUserData = useCurrentUserData();
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useRef(null);

  const [togglingInterest, setTogglingInterest] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);

  const requireAuth = useRequireAuth(user);

  const { post, loading, error } = usePost(id);
  const { userData: postAuthor } = useUserProfile(post?.userId, { publicOnly: !user });

  const { comments, publishComment, removeComment } = usePostComments(
    id,
    post?.userId,
    user?.uid
  );

  const { interestedUserIds, interestedCount, isInterested, interestedDoc } =
    usePostInterestStatus(id, user?.uid);

  const showError = useCallback((detail) => {
    toast.current?.show({ severity: "error", summary: "Error", detail, life: 3000 });
  }, []);

  const showSuccess = useCallback((detail) => {
    toast.current?.show({ severity: "success", summary: "Listo", detail, life: 2500 });
  }, []);

  const { handleInterested } = usePostInterest(user, () => {
    showError("No se pudo guardar tu interés. Intenta de nuevo.");
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

  if (loading) {
    return <PostDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="feed post-detail">
        <div className="feed-empty" role="alert">
          <span className="feed-empty__icon">
            <i className="pi pi-exclamation-triangle" aria-hidden="true" />
          </span>
          <p className="feed-empty__title">No se pudo cargar la partida</p>
          <p className="feed-empty__text">Revisa tu conexión e inténtalo de nuevo.</p>
          <Button
            label="Volver al inicio"
            className="feed-empty__btn"
            onClick={() => navigate("/")}
          />
        </div>
      </div>
    );
  }

  // Si el post se borra, usePost ya redirige al inicio
  if (!post) {
    return null;
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
          showError("No se pudo eliminar la publicación. Intenta de nuevo.");
        }
      }
    });
  };

  const handlePublish = async (comment, file) => {
    try {
      return await publishComment(comment, file);
    } catch (error) {
      console.error("Error al publicar comentario:", error);
      showError("No se pudo guardar el comentario. Intenta de nuevo.");
      return false;
    }
  };

  const confirmDeleteComment = (commentId) => {
    confirmDestructive({
      header: "Eliminar comentario",
      message: "El comentario y su imagen o video se eliminarán. Esta acción no se puede deshacer.",
      acceptLabel: "Eliminar comentario",
      onAccept: async () => {
        try {
          await removeComment(commentId);
          showSuccess("Comentario eliminado");
        } catch (error) {
          console.error("Error al eliminar comentario:", error);
          showError("No se pudo eliminar el comentario. Intenta de nuevo.");
        }
      }
    });
  };

  return (
    <div className="post-detail">
      <PostDetailHero post={post} onBack={handleBack} />

      <div className="post-detail__grid">
        <div className="post-detail__main">
          <ProfileSection title="Sobre la partida" icon="pi-align-left">
            {post.comments ? (
              <p className="post-detail__description">{post.comments}</p>
            ) : (
              <p className="gm-section__empty">El anfitrión no agregó una descripción.</p>
            )}
          </ProfileSection>

          <ProfileSection
            title="Comentarios"
            icon="pi-comments"
            className="post-comments"
            action={comments.length > 0 && (
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

            {comments.length > 0 ? (
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
                Todavía no hay comentarios. ¡Rompe el hielo y coordina la partida!
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
            interestedCount={interestedCount}
            commentsCount={comments.length}
            togglingInterest={togglingInterest}
            openingChat={openingChat}
            onToggleInterest={handleToggleInterest}
            onChatWithHost={handleChatWithHost}
            onEdit={handleEdit}
            onDelete={handleDeletePost}
            onAuthorClick={openProfile}
          />

          <PostInterested
            userIds={interestedUserIds}
            isOwner={isOwner}
            onOpenProfile={openProfile}
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
      />

      <ConfirmDialog />
      <Toast ref={toast} />
    </div>
  );
}
