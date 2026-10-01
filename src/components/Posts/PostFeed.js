import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import PostFilters from "./PostFilters";
import FeedHeader from "./FeedHeader";
import FeedEmptyState from "./FeedEmptyState";
import ProfileNudge from "./ProfileNudge";
import PostCategorySection from "./PostCategorySection";
import "./Feed.css";
import { UserProfileDialog } from "../UserProfile";
import {
  useBlockedIds,
  useFriends,
  useGames,
  useGameSearchLog,
  usePostCategories,
  usePostFilters,
  usePostListActions,
  useRequireAuth
} from "../../hooks";
import { useCurrentUser, useCurrentUserData } from "../../context";
import { EMPTY_TAG_FILTERS, buildExploreUrl, hasTagFilters } from "../../utils";

// Feed principal por categorías. El buscador y los chips de plataforma
// filtran todas las categorías a la vez.
export default function PostFeed({ setEditingPost, setShowCreatePost }) {
  const user = useCurrentUser();
  const userData = useCurrentUserData();
  const requireAuth = useRequireAuth(user);
  const navigate = useNavigate();
  const toast = useRef(null);
  const [search, setSearch] = useState("");

  const showToast = useCallback((severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const {
    getInterestedDoc,
    handleInterested,
    handleEditPost,
    confirmDelete,
    openProfile,
    profileDialogProps
  } = usePostListActions({ user, setEditingPost, setShowCreatePost, showToast });

  // Todos los juegos con publicaciones, para el filtro y el registro de búsquedas
  const games = useGames();

  const {
    filterGame,
    setFilterGame,
    filterPlatform,
    setFilterPlatform,
    tagFilters,
    setTagFilters,
    gameOptions
  } = usePostFilters(games);

  const { friendIds } = useFriends(user);

  // Autores bloqueados (en cualquier dirección) no aparecen en ninguna categoría
  const { blockedIds } = useBlockedIds(user);

  const sections = usePostCategories({
    filterGame,
    filterPlatform,
    search,
    friendIds,
    userRegion: userData?.region,
    blockedIds,
    tags: tagFilters
  });

  useGameSearchLog({ user, search, filterGame, games });

  // Las categorías sin posts se omiten en vez de mostrarse vacías
  const visibleSections = sections.filter((section) => section.loading || section.posts.length > 0);
  const hasFilters = Boolean(filterGame || filterPlatform || search.trim() || hasTagFilters(tagFilters));

  const handleClearFilters = () => {
    setFilterGame(null);
    setFilterPlatform(null);
    setTagFilters(EMPTY_TAG_FILTERS);
    setSearch("");
  };

  return (
    <div className="feed">
      <FeedHeader
        title="Partidas disponibles"
        search={search}
        onSearchChange={setSearch}
        onCreatePost={() => requireAuth() && setShowCreatePost(true)}
      />
      {userData && !userData.region && <ProfileNudge />}
      <PostFilters
        filterGame={filterGame}
        onGameChange={setFilterGame}
        filterPlatform={filterPlatform}
        onPlatformChange={setFilterPlatform}
        gameOptions={gameOptions}
        tagFilters={tagFilters}
        onTagFiltersChange={setTagFilters}
      />

      {visibleSections.length === 0 ? (
        <FeedEmptyState
          hasFilters={hasFilters}
          onClearFilters={handleClearFilters}
        />
      ) : (
        <div className="feed-sections">
          {visibleSections.map((section) => (
            <PostCategorySection
              key={section.key}
              title={section.title}
              posts={section.posts}
              hasMore={section.hasMore}
              loading={section.loading}
              onSeeMore={() => navigate(buildExploreUrl({
                category: section.key,
                platform: filterPlatform,
                game: filterGame,
                tags: tagFilters
              }))}
              getInterestedDoc={getInterestedDoc}
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
