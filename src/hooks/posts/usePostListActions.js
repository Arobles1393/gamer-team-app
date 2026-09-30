import { useCallback } from "react";
import { postService } from "../../services/posts";
import { confirmDeletePost } from "../../utils/confirmDeletePost";
import { useInterestedPosts } from "./useInterestedPosts";
import { usePostInterest } from "./usePostInterest";
import { useProfileDialog } from "../profile/useProfileDialog";
import { useFriendStatus } from "../friends/useFriendStatus";
import { useFriendRequest } from "../friends/useFriendRequest";
import { useProfileChat } from "../chat/useProfileChat";

// Acciones sobre las cards de una lista de posts (feed por categorías y
// vistas planas): "Me interesa", editar, borrar y el diálogo de perfil.
// `showToast(severity, summary, detail)` muestra los mensajes.
// `onPostDeleted(id)` (opcional) para listas que no se actualizan solas.
export const usePostListActions = ({
  user,
  setEditingPost,
  setShowCreatePost,
  showToast,
  onPostDeleted
}) => {
  const { interestedMap } = useInterestedPosts(user);

  const {
    selectedUserId,
    visible,
    openProfile,
    closeProfile
  } = useProfileDialog(user);

  const { friendStatus, setFriendStatus } = useFriendStatus(user, selectedUserId);

  const { handleChat } = useProfileChat(
    user,
    selectedUserId,
    closeProfile,
    () => showToast("error", "Error", "No se pudo abrir el chat. Intenta de nuevo.")
  );

  const { handleFriendRequest } = useFriendRequest(
    user,
    selectedUserId,
    setFriendStatus
  );

  const { handleInterested } = usePostInterest(
    user,
    () => showToast("error", "Error", "No se pudo guardar el interés")
  );

  const getInterestedDoc = useCallback(
    (post) => interestedMap.get(`${post.id}_${user?.uid}`),
    [interestedMap, user?.uid]
  );

  const handleEditPost = useCallback((post) => {
    setEditingPost(post);
    setShowCreatePost(true);
  }, [setEditingPost, setShowCreatePost]);

  const confirmDelete = useCallback((id) => {
    confirmDeletePost({
      onAccept: async () => {
        try {
          await postService.deletePost(id);
          onPostDeleted?.(id);
          showToast("success", "Eliminado", "Publicación eliminada correctamente");
        } catch (error) {
          console.error("Error al eliminar:", error);
          showToast("error", "Error", "No se pudo eliminar la publicación");
        }
      }
    });
  }, [showToast, onPostDeleted]);

  return {
    interestedMap,
    getInterestedDoc,
    handleInterested,
    handleEditPost,
    confirmDelete,
    openProfile,
    // Props para <UserProfileDialog />
    profileDialogProps: {
      visible,
      onHide: closeProfile,
      selectedUserId,
      friendStatus,
      onSendFriendRequest: handleFriendRequest,
      onChat: handleChat
    }
  };
};
