import { useState, useRef } from "react";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { sendFriendRequest } from "../../services/friendService";
import { postService, interestService } from "../../services/posts";
import { confirmDeletePost } from "../../utils/confirmDeletePost";
import PostCard from "./PostCard";
import PostFilters from "./PostFilters";
import { UserProfileDialog } from "../UserProfile";
import { useFriendStatus, usePosts, useInterestedPosts, useFilteredPosts, usePostFilters, useProfileChat } from "../../hooks";

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

  const handleContactOwner = async(post) => {
    await postService.joinPost(post.id, user.uid);
    const message = `Hola ${post.username}, Quiero unirme a tu partida de ${post.game} 🎮`;
    window.open(`https://wa.me/${post.phone}?text=${encodeURIComponent(message)}`);
  };

  const handleDelete = async (id) => {
    try {
      await postService.deletePost(id);
      console.log("Eliminado correctamente");
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar la publicacion",
        life: 3000
      });
      console.error("Error al eliminar:", error);
    }
  };

  const confirmDelete = (id) => {
    confirmDeletePost({
      onAccept: () => handleDelete(id),
      onSuccess: () => {
        toast.current.show({
          severity: "success",
          summary: "Eliminado",
          detail: "Publicación eliminada correctamente",
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

  const handleInterested = async (
    post,
    interestedDoc
  ) => {
    try {
      return await interestService.toggleInterested({
        post,
        interestedDoc,
        user,
        userData
      });

    } catch (error) {

      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar el interés",
        life: 3000
      });

      return false;
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setShowCreatePost(true);
  };

  const handleFriendRequest = async () => {
    await sendFriendRequest(
      user,
      userData,
      selectedUserId
    );

    setFriendStatus("pending");
  };

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
            onContactOwner={handleContactOwner}
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