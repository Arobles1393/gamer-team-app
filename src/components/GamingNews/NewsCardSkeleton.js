import { Skeleton } from "primereact/skeleton";

export default function NewsCardSkeleton({ featured = false }) {
  return (
    <div
      className={`news-card news-card--skeleton${featured ? " news-card--featured" : ""}`}
      aria-hidden="true"
    >
      <span className="news-card__media">
        <Skeleton width="100%" height="100%" borderRadius="0" className="news-skeleton" />
      </span>
      <span className="news-card__body">
        <Skeleton width="30%" height="12px" className="news-skeleton" />
        <Skeleton width="90%" height="18px" className="news-skeleton" />
        <Skeleton width="70%" height="18px" className="news-skeleton" />
        <Skeleton width="100%" height="12px" className="news-skeleton" />
      </span>
    </div>
  );
}
