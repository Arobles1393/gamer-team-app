import { useMemo, useState } from "react";
import NewsHeader from "./NewsHeader";
import NewsFilters from "./NewsFilters";
import NewsCard from "./NewsCard";
import NewsCardSkeleton from "./NewsCardSkeleton";
import NewsEmptyState from "./NewsEmptyState";
import { useGamingNews } from "../../hooks";
import "../Posts/Feed.css";
import "./GamingNews.css";

export default function GamingNews() {
  const { news, loading, error, retry } = useGamingNews();
  const [search, setSearch] = useState("");
  const [source, setSource] = useState(null);

  // Fuentes presentes en las noticias, con su conteo
  const sources = useMemo(() => {
    const counts = news.reduce((acc, item) => {
      acc[item.source] = (acc[item.source] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [news]);

  // Ya vienen ordenadas por fecha desc desde Firestore
  const visibleNews = useMemo(() => {
    const term = search.trim().toLowerCase();

    return news.filter((item) => {
      const matchSource = !source || item.source === source;
      const matchSearch =
        !term ||
        item.title?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term);

      return matchSource && matchSearch;
    });
  }, [news, search, source]);

  const renderResults = () => {
    if (error) {
      return <NewsEmptyState variant="error" onAction={retry} />;
    }

    if (loading) {
      return (
        <div className="news-grid" aria-busy="true" aria-label="Cargando noticias">
          <NewsCardSkeleton featured />
          {Array.from({ length: 6 }, (_, i) => <NewsCardSkeleton key={i} />)}
        </div>
      );
    }

    if (news.length === 0) {
      return <NewsEmptyState variant="empty" />;
    }

    if (visibleNews.length === 0) {
      return (
        <NewsEmptyState
          variant="noMatch"
          search={search}
          onAction={() => setSearch("")}
        />
      );
    }

    const [featured, ...rest] = visibleNews;

    return (
      <div className="news-grid">
        <NewsCard item={featured} featured />
        {rest.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>
    );
  };

  const hasNews = !loading && !error && news.length > 0;

  return (
    <div className="feed news">
      <NewsHeader
        search={search}
        onSearchChange={setSearch}
        disabled={!hasNews}
      />

      {hasNews && sources.length > 1 && (
        <NewsFilters
          sources={sources}
          source={source}
          onSourceChange={setSource}
          total={news.length}
        />
      )}

      {renderResults()}
    </div>
  );
}
