import { useState } from "react";
import PostCard from "./PostCard";
import PostCardSkeleton from "./PostCardSkeleton";

// Una categoría del feed: título + fila horizontal de PostCard.
// "Ver más" despliega en la misma fila el resto de posts de la categoría.
export default function PostCategorySection({
  title,
  posts,
  morePosts,
  loading,
  getInterestedDoc,
  onToggleInterested,
  onEdit,
  onDelete,
  onShowProfile
}) {
  const [expanded, setExpanded] = useState(false);

  const visiblePosts = expanded ? [...posts, ...morePosts] : posts;
  const showSkeleton = loading && posts.length === 0;

  return (
    <section className="feed-section" aria-label={title}>
      <header className="feed-section__header">
        <h2 className="feed-section__title">{title}</h2>

        {morePosts.length > 0 && (
          <button
            type="button"
            className="feed-section__more"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Ver menos" : "Ver más"}
            <i className={`pi ${expanded ? "pi-chevron-left" : "pi-chevron-right"}`} aria-hidden="true" />
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
          : visiblePosts.map((post) => (
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
