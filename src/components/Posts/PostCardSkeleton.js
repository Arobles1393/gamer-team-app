import { Skeleton } from "primereact/skeleton";

export default function PostCardSkeleton() {
  return (
    <div className="post-card post-card--skeleton" aria-hidden="true">
      <Skeleton height="148px" borderRadius="0" className="feed-skeleton" />
      <div className="post-card__body">
        <Skeleton width="45%" height="14px" className="feed-skeleton" />
        <Skeleton width="55%" height="14px" className="feed-skeleton" />
        <Skeleton height="46px" borderRadius="10px" className="feed-skeleton" />
      </div>
    </div>
  );
}
