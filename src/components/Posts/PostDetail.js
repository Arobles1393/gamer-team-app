import { useParams } from "react-router-dom";
import { useRef } from "react";
import { useState } from "react";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { UserProfileDialog } from "../UserProfile";
import PostHero from "./PostHero";
import PostInfoCard from "./PostInfoCard";
import CommentInput from "./CommentInput";
import CommentItem from "./CommentItem";
import {
  usePost,
  usePostComments,
  usePostInterestStatus,
  usePostInterest,
  useUserProfile,
  useFriendStatus,
  useProfileChat,
  useFriendRequest
} from "../../hooks";

export default function PostDetail({ user }) {
  const { id } = useParams();

  const { post } = usePost(id);
  const { userData: postAuthor } = useUserProfile(post?.userId);

  const { comments, publishComment, removeComment } = usePostComments(
    id,
    post?.userId,
    user.uid
  );

  const { interestedCount, isInterested, interestedDoc } =
    usePostInterestStatus(id, user.uid);

  const { handleInterested } = usePostInterest(user, (error) => {
    console.error("Error al actualizar interés:", error);
  });

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  const { friendStatus, setFriendStatus } = useFriendStatus(
    user,
    selectedUserId
  );

  const { handleChat } = useProfileChat(user, selectedUserId, () =>
    setShowProfile(false)
  );

  const { handleFriendRequest } = useFriendRequest(
    user,
    selectedUserId,
    () => setFriendStatus("pending")
  );

  const toast = useRef(null);

  if (!post) {
    return <div>Cargando...</div>;
  }

  const openProfile = (userId) => {
    setSelectedUserId(userId);
    setShowProfile(true);
  };

  const handlePublish = async (comment, file) => {
    try {
      await publishComment(comment, file);
    } catch (error) {
      console.error("Error al publicar comentario:", error);

      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar el comentario. Intenta de nuevo.",
        life: 3000
      });
    }
  };

  const confirmDelete = (commentId) => {
    confirmDialog({
      message: "¿Seguro que quieres eliminar este comentario?",
      header: "Advertencia",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "eliminar",
      rejectLabel: "Cancelar",

      accept: async () => {
        try {
          await removeComment(commentId);

          toast.current.show({
            severity: "success",
            summary: "Eliminado",
            detail: "Comentario eliminado correctamente",
            life: 3000
          });
        } catch (error) {
          console.error("Error al eliminar comentario:", error);
        }
      },
      reject: () => {}
    });
  };

  return (
    <div className="post-detail">
      <PostHero post={post} />

      <div className="post-content">
        <PostInfoCard
          post={post}
          postAuthor={postAuthor}
          comments={comments}
          interestedCount={interestedCount}
          isInterested={isInterested}
          currentUserId={user.uid}
          onInterestedClick={() => handleInterested(post, interestedDoc)}
          onAuthorClick={openProfile}
        />

        <div className="right-panel">
          <div className="community-section">
            <h3>Publicaciones</h3>

            <CommentInput onPublish={handlePublish} />

            <div className="comments-list">
              {comments.map((item) => (
                <CommentItem
                  key={item.id}
                  comment={item}
                  currentUserId={user.uid}
                  onDelete={confirmDelete}
                  onOpenProfile={openProfile}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <UserProfileDialog
        visible={showProfile}
        onHide={() => setShowProfile(false)}
        selectedUserId={selectedUserId}
        user={user}
        friendStatus={friendStatus}
        onSendFriendRequest={handleFriendRequest}
        onChat={handleChat}
      />

      <ConfirmDialog />
      <Toast ref={toast} />
    </div>
  );
}