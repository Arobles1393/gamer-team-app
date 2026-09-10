import { Avatar } from "primereact/avatar";
import { useUserProfile } from "../../hooks";
import { formatDates } from "../../utils";

export default function ChatListItem({ chat, currentUserId, onClick }) {
  const otherUserId = chat.participants.find(
    (id) => id !== currentUserId
  );

  const { userData: otherUser } = useUserProfile(otherUserId);

  return (
    <div className="chat-item" onClick={onClick}>
      <Avatar
        image={otherUser?.avatar}
        label={otherUser?.username?.charAt(0)?.toUpperCase()}
        shape="circle"
      />
      <div className="chat-info">
        <strong>{otherUser?.username}</strong>
        <p>{chat.lastMessage}</p>
        <small>{formatDates.formatChatTime(chat.lastMessageAt)}</small>
      </div>
    </div>
  );
}