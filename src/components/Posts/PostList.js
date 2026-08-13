import { useState, useRef } from "react";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { postService } from "../../services/posts";
import { confirmDeletePost } from "../../utils/confirmDeletePost";
import PostCard from "./PostCard";
import PostFilters from "./PostFilters";
import { UserProfileDialog } from "../UserProfile";
import { useFriendStatus, usePosts, useInterestedPosts, useFilteredPosts, usePostFilters, useProfileChat, usePostInterest,
  useFriendRequest } from "../../hooks";

export default function PostList({ user, userData, setEditingPost, setShowCreatePost, onlyMine = false, joined = false }) {

  const {
    posts,
    title
  } = usePosts(
    user,
    onlyMine,
    joined
  );

  const {
    filterGame,
    setFilterGame,
    filterPlatform,
    setFilterPlatform,
    gameOptions,
    platformOptions
  } = usePostFilters(posts);

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const toast = useRef(null);

  const {
    friendStatus,
    setFriendStatus
  } = useFriendStatus(
      user,
      selectedUserId
  );

  const { interestedMap } = useInterestedPosts(user);

  const handleDelete = async (id) => {
    try {
      await postService.deletePost(id);
      return true;
    } catch (error) {
      console.error("Error al eliminar:", error);
      return false;
    }
  };

  const confirmDelete = (id) => {
    confirmDeletePost({
      onAccept: async () => {
        const success = await handleDelete(id);

        toast.current.show({
          severity: success ? "success" : "error",
          summary: success ? "Eliminado" : "Error",
          detail: success
            ? "Publicación eliminada correctamente"
            : "No se pudo eliminar la publicación",
          life: 3000
        });
      }
    });
  };

  const filteredPosts = useFilteredPosts(
    posts,
    filterGame,
    filterPlatform
  );

  const {
    handleChat
  } = useProfileChat(
    user,
    selectedUserId,
    () => setShowProfile(false)
  );

  const { handleInterested } = usePostInterest(
    user,
    userData,
    () => {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar el interés",
        life: 3000
      });
    }
  );

  const handleEditPost = (post) => {
    setEditingPost(post);
    setShowCreatePost(true);
  };

  const { handleFriendRequest } = useFriendRequest(
    user,
    userData,
    selectedUserId,
    () => setFriendStatus("pending")
  );

  return (
    <div>
      <PostFilters
        title={title}
        total={filteredPosts.length}
        filterGame={filterGame}
        onGameChange={setFilterGame}
        filterPlatform={filterPlatform}
        onPlatformChange={setFilterPlatform}
        gameOptions={gameOptions}
        platformOptions={platformOptions}
      />
      <div className="post-grid">
        {filteredPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            user={user}
            interestedDoc={ interestedMap.get(`${post.id}_${user.uid}`) }
            onToggleInterested={handleInterested}
            onEdit={handleEditPost}
            onDelete={confirmDelete}
            onShowProfile={(userId) => {
              setSelectedUserId(userId);
              setShowProfile(true);
            }}
          />
        ))}
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