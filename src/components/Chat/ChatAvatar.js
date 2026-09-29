import { Avatar } from "primereact/avatar";
import { isOnline } from "../../utils";

// Avatar con punto verde si el usuario está en línea
export default function ChatAvatar({ user, size = "md" }) {
  const initial = user?.username?.charAt(0).toUpperCase() || "?";

  return (
    <span className={`chat-avatar chat-avatar--${size}`}>
      <Avatar
        image={user?.avatar}
        label={user?.avatar ? undefined : initial}
        shape="circle"
        className="chat-avatar__img"
      />
      {isOnline(user?.lastSeen) && (
        <span className="chat-avatar__dot" aria-hidden="true" />
      )}
    </span>
  );
}
