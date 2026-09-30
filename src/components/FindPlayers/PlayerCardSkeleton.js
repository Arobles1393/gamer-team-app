import { Skeleton } from "primereact/skeleton";

export default function PlayerCardSkeleton() {
  return (
    <div className="player-card player-card--skeleton" aria-hidden="true">
      <div className="player-card__banner" />
      <div className="player-card__body">
        <Skeleton shape="circle" size="72px" className="feed-skeleton player-card__avatar-skeleton" />
        <Skeleton width="50%" height="18px" className="feed-skeleton" />
        <Skeleton width="65%" height="14px" className="feed-skeleton" />
        <Skeleton height="48px" borderRadius="10px" className="feed-skeleton" />
        <Skeleton height="44px" borderRadius="10px" className="feed-skeleton" />
      </div>
    </div>
  );
}
