import { useCallback, useMemo, useRef } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "primereact/button";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import PostCard from "./PostCard";
import PostCardSkeleton from "./PostCardSkeleton";
import PostFilters from "./PostFilters";
import FeedEmptyState from "./FeedEmptyState";
import "./Feed.css";
import { UserProfileDialog } from "../UserProfile";
import { useBlockedIds, useFriends, useGames, usePaginatedPosts, usePostListActions } from "../../hooks";
import { useCurrentUser, useCurrentUserData } from "../../context";
import {
  POST_CATEGORIES,
  buildExploreUrl,
  getCategoryTitle,
  isPostCategory,
  platformLabels
} from "../../utils";

// /explorar?category=...&platform=...&game=...
// Una categoría del home completa, 15 posts por página con "Cargar más".
// Los filtros viven en la URL: cambiarlos reinicia la paginación.
export default function ExplorePage({ setEditingPost, setShowCreatePost }) {
  const user = useCurrentUser();
  const userData = useCurrentUserData();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const toast = useRef(null);

  const rawCategory = searchParams.get("category");
  const category = isPostCategory(rawCategory) ? rawCategory : "recent";
  const rawPlatform = searchParams.get("platform");
  const platform = rawPlatform && platformLabels[rawPlatform] ? rawPlatform : null;
  const game = searchParams.get("game") || null;

  const { requiresUser, empty } = POST_CATEGORIES[category];

  const { friendIds, loading: loadingFriends } = useFriends(user);
  const { blockedIds } = useBlockedIds(user);
  const region = userData?.region;

  // "De tus amigos" y "Cerca de ti" esperan a tener los datos del usuario
  const ready =
    category === "friends" ? !loadingFriends :
      category === "nearby" ? Boolean(userData) :
        true;

  const {
    posts,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    retry,
    removePost
  } = usePaginatedPosts({ category, platform, game, friendIds, region, blockedIds, ready });

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
  } = usePostListActions({
    user,
    setEditingPost,
    setShowCreatePost,
    showToast,
    onPostDeleted: removePost
  });

  const games = useGames();
  const gameOptions = useMemo(
    () => [
      { label: "Todos", value: "" },
      ...games.map((name) => ({ label: name, value: name }))
    ],
    [games]
  );

  // Cambiar un filtro reescribe la URL (sin apilar historial por cada chip)
  const updateFilters = (changes) => {
    navigate(
      buildExploreUrl({ category, platform, game, ...changes }),
      { replace: true }
    );
  };

  const hasFilters = Boolean(platform || game);

  // Secciones personales: sin sesión, al login (y de vuelta aquí)
  if (requiresUser && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const emptyText =
    category === "nearby" && userData && !region
      ? "Configura tu región en tu perfil para ver publicaciones cerca de ti."
      : empty;

  const renderResults = () => {
    if (error && posts.length === 0) {
      return (
        <div className="feed-empty" role="alert">
          <span className="feed-empty__icon">
            <i className="pi pi-exclamation-triangle" aria-hidden="true" />
          </span>
          <p className="feed-empty__title">No se pudieron cargar las partidas</p>
          <p className="feed-empty__text">Revisa tu conexión e inténtalo de nuevo.</p>
          <Button label="Reintentar" className="feed-empty__btn" onClick={retry} />
        </div>
      );
    }

    if (loading) {
      return (
        <div className="post-grid" aria-busy="true" aria-label="Cargando partidas">
          {Array.from({ length: 6 }, (_, i) => <PostCardSkeleton key={i} />)}
        </div>
      );
    }

    if (posts.length === 0) {
      return (
        <FeedEmptyState
          hasFilters={hasFilters}
          emptyText={emptyText}
          onClearFilters={() => updateFilters({ platform: null, game: null })}
        />
      );
    }

    return (
      <>
        <div className="post-grid">
          {posts.map((post) => (
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

        {hasMore && (
          <div className="feed-load-more">
            <Button
              label={loadingMore ? "Cargando…" : "Cargar más"}
              icon={loadingMore ? "pi pi-spin pi-spinner" : "pi pi-angle-down"}
              className="gm-btn gm-btn--ghost"
              disabled={loadingMore}
              onClick={loadMore}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="feed explore">
      <header className="feed-header explore-header">
        <div className="feed-header__titles">
          {/* Vuelve al home sin tocar esta URL, por si se quiere reabrir el link */}
          <button type="button" className="explore-header__back" onClick={() => navigate("/")}>
            <i className="pi pi-arrow-left" aria-hidden="true" />
            Volver
          </button>
          <span className="feed-header__eyebrow">Explorar</span>
          <h1 className="feed-header__title">{getCategoryTitle(category, platform)}</h1>
        </div>
      </header>

      <PostFilters
        filterGame={game}
        onGameChange={(value) => updateFilters({ game: value || null })}
        filterPlatform={platform}
        onPlatformChange={(value) => updateFilters({ platform: value })}
        gameOptions={gameOptions}
      />

      {renderResults()}

      <UserProfileDialog {...profileDialogProps} />
      <ConfirmDialog />
      <Toast ref={toast} />
    </div>
  );
}
