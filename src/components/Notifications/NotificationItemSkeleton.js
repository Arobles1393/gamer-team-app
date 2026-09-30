import { Skeleton } from "primereact/skeleton";

export default function NotificationItemSkeleton({ compact = false }) {
  return (
    <li className={`notif notif--skeleton${compact ? " notif--compact" : ""}`} aria-hidden="true">
      <div className="notif__main">
        <Skeleton shape="circle" size="44px" className="notif__skeleton" />
        <span className="notif__body">
          <Skeleton width="70%" height="14px" className="notif__skeleton" />
          <Skeleton width="30%" height="12px" className="notif__skeleton" />
        </span>
      </div>
    </li>
  );
}
