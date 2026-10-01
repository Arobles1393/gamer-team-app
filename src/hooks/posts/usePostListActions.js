import { useCallback } from "react";
import { postService } from "../../services/posts";
import i18n from "../../i18n";
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
    () => showToast("error", i18n.t("common:status.error"), i18n.t("posts:actions.chatError"))
  );

  const { handleFriendRequest } = useFriendRequest(
    user,
    selectedUserId,
    setFriendStatus
  );

  const { handleInterested } = usePostInterest(
    user,
    () => showToast("error", i18n.t("common:status.error"), i18n.t("posts:actions.interestError"))
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
          showToast("success", i18n.t("posts:actions.deletedTitle"), i18n.t("posts:actions.deletedText"));
        } catch (error) {
          console.error("Error al eliminar:", error);
          showToast("error", i18n.t("common:status.error"), i18n.t("posts:actions.deleteError"));
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
      onChat: handleChat,
      onFriendStatusChange: setFriendStatus
    }
  };
};
