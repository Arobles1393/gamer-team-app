import { useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "primereact/button";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import PostCard from "./PostCard";
import { EmptyState } from "../EmptyState";
import PostCardSkeleton from "./PostCardSkeleton";
import PostFilters from "./PostFilters";
import FeedEmptyState from "./FeedEmptyState";
import "./Feed.css";
import { UserProfileDialog } from "../UserProfile";
import { useBlockedIds, useFriends, useGames, usePaginatedPosts, usePostListActions } from "../../hooks";
import { useCurrentUser, useCurrentUserData } from "../../context";
import { LANGUAGES, SKILL_LEVELS } from "../../constants";
import {
  EMPTY_TAG_FILTERS,
  hasTagFilters,
  POST_CATEGORIES,
  buildExploreUrl,
  getCountryByCode,
  getCountryLabelByCode,
  getCategoryEmptyText,
  getCategoryTitle,
  isPostCategory,
  platformLabels
} from "../../utils";

// /explorar?category=...&platform=...&game=...
// Una categoría del home completa, 15 posts por página con "Cargar más".
// Los filtros viven en la URL: cambiarlos reinicia la paginación.
export default function ExplorePage({ setEditingPost, setShowCreatePost }) {
  const { t } = useTranslation("posts");
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

  // ?region=MX (desde el mapa de la comunidad): "Recientes" de ese país.
  // posts.authorRegion guarda el nombre en español, como users.region
  const regionCountry = category === "recent" ? getCountryByCode(searchParams.get("region")) : null;
  const regionCode = regionCountry?.code ?? null;

  // Panel "Más filtros": ?mic=1|0&level=casual|competitive&lang=es|en|...
  const rawMic = searchParams.get("mic");
  const rawLevel = searchParams.get("level");
  const rawLang = searchParams.get("lang");
  const tagMic = rawMic === "1" ? true : rawMic === "0" ? false : null;
  const tagLevel = SKILL_LEVELS.some((level) => level.value === rawLevel) ? rawLevel : null;
  const tagLang = LANGUAGES.some((language) => language.value === rawLang) ? rawLang : null;
  const tags = useMemo(
    () => ({ mic: tagMic, skillLevel: tagLevel, language: tagLang }),
    [tagMic, tagLevel, tagLang]
  );

  const { requiresUser } = POST_CATEGORIES[category];
  const empty = getCategoryEmptyText(category);

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
  } = usePaginatedPosts({
    category,
    platform,
    game,
    tags,
    friendIds,
    region,
    authorRegion: regionCountry?.value ?? null,
    blockedIds,
    ready
  });

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
      { label: t("feed.allOption"), value: "" },
      ...games.map((name) => ({ label: name, value: name }))
    ],
    [games, t]
  );

  // Cambiar un filtro reescribe la URL (sin apilar historial por cada chip)
  const updateFilters = (changes) => {
    navigate(
      buildExploreUrl({
        category,
        region: regionCode,
        platform,
        game,
        ...changes,
        tags: { ...tags, ...changes.tags }
      }),
      { replace: true }
    );
  };

  const hasFilters = Boolean(platform || game || hasTagFilters(tags));

  // Secciones personales: sin sesión, al login (y de vuelta aquí)
  if (requiresUser && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const emptyText =
    category === "nearby" && userData && !region
      ? t("categories.nearby.noRegion")
      : empty;

  const renderResults = () => {
    if (error && posts.length === 0) {
      return (
        <EmptyState
          icon="pi-exclamation-triangle"
          title={t("explore.errorTitle")}
          text={t("explore.errorText")}
          actionLabel={t("common:actions.retry")}
          onAction={retry}
          alert
        />
      );
    }

    if (loading) {
      return (
        <div className="post-grid" aria-busy="true" aria-label={t("feed.loading")}>
          {Array.from({ length: 6 }, (_, i) => <PostCardSkeleton key={i} />)}
        </div>
      );
    }

    if (posts.length === 0) {
      return (
        <FeedEmptyState
          hasFilters={hasFilters}
          emptyText={emptyText}
          onClearFilters={() => updateFilters({ platform: null, game: null, tags: EMPTY_TAG_FILTERS })}
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
              label={loadingMore ? t("explore.loadingMore") : t("explore.loadMore")}
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
            {t("explore.back")}
          </button>
          <span className="feed-header__eyebrow">{t("explore.eyebrow")}</span>
          <h1 className="feed-header__title">
            {regionCountry
              ? t("explore.regionTitle", { country: getCountryLabelByCode(regionCountry.code) })
              : getCategoryTitle(category, platform)}
          </h1>
          {regionCountry && (
            <button
              type="button"
              className="feed-chip feed-chip--active explore-region"
              aria-label={t("explore.clearRegion", { country: getCountryLabelByCode(regionCountry.code) })}
              onClick={() => updateFilters({ region: null })}
            >
              <span aria-hidden="true">{regionCountry.flag}</span>
              {getCountryLabelByCode(regionCountry.code)}
              <i className="pi pi-times" aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      <PostFilters
        filterGame={game}
        onGameChange={(value) => updateFilters({ game: value || null })}
        filterPlatform={platform}
        onPlatformChange={(value) => updateFilters({ platform: value })}
        gameOptions={gameOptions}
        tagFilters={tags}
        onTagFiltersChange={(changes) => updateFilters({ tags: changes })}
      />

      {renderResults()}

      <UserProfileDialog {...profileDialogProps} />
      <ConfirmDialog />
      <Toast ref={toast} />
    </div>
  );
}
