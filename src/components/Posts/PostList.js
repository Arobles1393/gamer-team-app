import { useState, useRef, useMemo } from "react";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { postService } from "../../services/posts";
import { confirmDeletePost } from "../../utils/confirmDeletePost";
import PostCard from "./PostCard";
import PostFilters from "./PostFilters";
import FeedHeader from "./FeedHeader";
import PostCardSkeleton from "./PostCardSkeleton";
import FeedEmptyState from "./FeedEmptyState";
import "./Feed.css";
import { UserProfileDialog } from "../UserProfile";
import { useFriendStatus, usePosts, useInterestedPosts, useFilteredPosts, usePostFilters, useProfileChat, usePostInterest,
  useFriendRequest } from "../../hooks";
import { useCurrentUser } from "../../context";

export default function PostList({ setEditingPost, setShowCreatePost, onlyMine = false, joined = false }) {
  const user = useCurrentUser();


  const {
    posts: allPosts,
    title,
    loading
  } = usePosts(
    user,
    onlyMine,
    joined
  );

  const { interestedMap } = useInterestedPosts(user);

  // "Mis partidas": posts marcados con "me interesa" (colección post_interested)
  const posts = useMemo(
    () => joined
      ? allPosts.filter((post) => interestedMap.has(`${post.id}_${user.uid}`))
      : allPosts,
    [allPosts, joined, interestedMap, user.uid]
  );

  const {
    filterGame,
    setFilterGame,
    filterPlatform,
    setFilterPlatform,
    gameOptions
  } = usePostFilters(posts);

  const [search, setSearch] = useState("");
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

  // Búsqueda por nombre de juego desde la top bar
  const visiblePosts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return filteredPosts;
    return filteredPosts.filter((post) => post.game?.toLowerCase().includes(term));
  }, [filteredPosts, search]);

  const hasFilters = Boolean(filterGame || filterPlatform || search.trim());

  const handleClearFilters = () => {
    setFilterGame(null);
    setFilterPlatform(null);
    setSearch("");
  };

  const {
    handleChat
  } = useProfileChat(
    user,
    selectedUserId,
    () => setShowProfile(false),
    () => {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo abrir el chat. Intenta de nuevo.",
        life: 3000
      });
    }
  );

  const { handleInterested } = usePostInterest(
    user,
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
    selectedUserId,
    () => setFriendStatus("pending")
  );

  const handleShowProfile = (userId) => {
    setSelectedUserId(userId);
    setShowProfile(true);
  };

  return (
    <div className="feed">
      <FeedHeader
        title={title}
        search={search}
        onSearchChange={setSearch}
        onCreatePost={() => setShowCreatePost(true)}
      />
      <PostFilters
        filterGame={filterGame}
        onGameChange={setFilterGame}
        filterPlatform={filterPlatform}
        onPlatformChange={setFilterPlatform}
        gameOptions={gameOptions}
      />
      {loading ? (
        <div className="post-grid" aria-busy="true" aria-label="Cargando partidas">
          {Array.from({ length: 6 }, (_, i) => <PostCardSkeleton key={i} />)}
        </div>
      ) : visiblePosts.length === 0 ? (
        <FeedEmptyState
          hasFilters={hasFilters}
          onClearFilters={handleClearFilters}
        />
      ) : (
        <div className="post-grid">
          {visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              interestedDoc={ interestedMap.get(`${post.id}_${user.uid}`) }
              onToggleInterested={handleInterested}
              onEdit={handleEditPost}
              onDelete={confirmDelete}
              onShowProfile={handleShowProfile}
            />
          ))}
        </div>
      )}
      <UserProfileDialog
        visible={showProfile}
        onHide={() => setShowProfile(false)}
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
