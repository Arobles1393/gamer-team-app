import { Skeleton } from "primereact/skeleton";

export default function ChatListItemSkeleton() {
  return (
    <li className="chat-item chat-item--skeleton" aria-hidden="true">
      <Skeleton shape="circle" size="46px" className="feed-skeleton" />
      <span className="chat-item__body">
        <Skeleton width="55%" height="14px" className="feed-skeleton" />
        <Skeleton width="80%" height="12px" className="feed-skeleton" />
      </span>
    </li>
  );
}
