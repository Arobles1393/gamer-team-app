import { UserAvatar } from "../UserAvatar";
import { isOnline } from "../../utils";

// Avatar con punto verde si el usuario está en línea
export default function ChatAvatar({ user, size = "md" }) {
  return (
    <span className={`chat-avatar chat-avatar--${size}`}>
      <UserAvatar
        image={user?.avatar}
        username={user?.username}
        className="chat-avatar__img"
      />
      {isOnline(user?.lastSeen) && (
        <span className="chat-avatar__dot" aria-hidden="true" />
      )}
    </span>
  );
}
