import { useTranslation } from "react-i18next";
import PostCard from "./PostCard";
import PostCardSkeleton from "./PostCardSkeleton";

// Una categoría del feed: título + fila horizontal de PostCard.
// "Ver más" (onSeeMore) abre la categoría completa en /explorar.
export default function PostCategorySection({
  title,
  posts,
  hasMore,
  loading,
  onSeeMore,
  getInterestedDoc,
  onToggleInterested,
  onEdit,
  onDelete,
  onShowProfile
}) {
  const { t } = useTranslation();
  const showSkeleton = loading && posts.length === 0;

  return (
    <section className="feed-section" aria-label={title}>
      <header className="feed-section__header">
        <h2 className="feed-section__title">{title}</h2>

        {hasMore && (
          <button
            type="button"
            className="feed-section__more"
            onClick={onSeeMore}
          >
            {t("actions.seeMore")}
            <i className="pi pi-chevron-right" aria-hidden="true" />
          </button>
        )}
      </header>

      <div className="feed-row" aria-busy={showSkeleton}>
        {showSkeleton
          ? Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="feed-row__item">
              <PostCardSkeleton />
            </div>
          ))
          : posts.map((post) => (
            <div key={post.id} className="feed-row__item">
              <PostCard
                post={post}
                interestedDoc={getInterestedDoc(post)}
                onToggleInterested={onToggleInterested}
                onEdit={onEdit}
                onDelete={onDelete}
                onShowProfile={onShowProfile}
              />
            </div>
          ))}
      </div>
    </section>
  );
}
