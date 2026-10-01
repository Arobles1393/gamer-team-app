import { useState, useRef, useMemo, useCallback } from "react";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import PostCard from "./PostCard";
import PostFilters from "./PostFilters";
import FeedHeader from "./FeedHeader";
import PostCardSkeleton from "./PostCardSkeleton";
import FeedEmptyState from "./FeedEmptyState";
import "./Feed.css";
import { UserProfileDialog } from "../UserProfile";
import { useBlockedIds, usePosts, useFilteredPosts, usePostFilters, usePostListActions } from "../../hooks";
import { excludeBlockedAuthors } from "../../utils";
import { useCurrentUser } from "../../context";

// Vistas planas: "Mis publicaciones" (onlyMine) y "Mis partidas" (joined).
// El feed principal por categorías es PostFeed.
export default function PostList({ setEditingPost, setShowCreatePost, onlyMine = false, joined = false }) {
  const user = useCurrentUser();
  const toast = useRef(null);
  const [search, setSearch] = useState("");

  const showToast = useCallback((severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const {
    interestedMap,
    getInterestedDoc,
    handleInterested,
    handleEditPost,
    confirmDelete,
    openProfile,
    profileDialogProps
  } = usePostListActions({ user, setEditingPost, setShowCreatePost, showToast });

  const {
    posts: allPosts,
    title,
    loading
  } = usePosts(
    user,
    onlyMine,
    joined
  );

  // "Mis partidas": posts marcados con "me interesa" (colección post_interested)
  const posts = useMemo(
    () => joined
      ? allPosts.filter((post) => interestedMap.has(`${post.id}_${user?.uid}`))
      : allPosts,
    [allPosts, joined, interestedMap, user?.uid]
  );

  const gameNames = useMemo(() => posts.map((post) => post.game), [posts]);

  const {
    filterGame,
    setFilterGame,
    filterPlatform,
    setFilterPlatform,
    gameOptions
  } = usePostFilters(gameNames);

  const filteredPosts = useFilteredPosts(
    posts,
    filterGame,
    filterPlatform
  );

  const { blockedIds } = useBlockedIds(user);

  // Búsqueda por nombre de juego desde la top bar; sin autores bloqueados
  const visiblePosts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const unblocked = excludeBlockedAuthors(filteredPosts, blockedIds);
    if (!term) return unblocked;
    return unblocked.filter((post) => post.game?.toLowerCase().includes(term));
  }, [filteredPosts, search, blockedIds]);

  const hasFilters = Boolean(filterGame || filterPlatform || search.trim());

  const handleClearFilters = () => {
    setFilterGame(null);
    setFilterPlatform(null);
    setSearch("");
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
              interestedDoc={getInterestedDoc(post)}
              onToggleInterested={handleInterested}
              onEdit={handleEditPost}
              onDelete={confirmDelete}
              onShowProfile={openProfile}
            />
          ))}
        </div>
      )}
      <UserProfileDialog {...profileDialogProps} />
      <ConfirmDialog />
      <Toast ref={toast} />
    </div>
  );
}
