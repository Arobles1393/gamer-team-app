import { useChats } from "../../hooks";
import ChatListItem from "./ChatListItem";

export default function ChatList({ user, setActiveChat }) {
  const { chats } = useChats(user);

  return (
    <div className="chat-list">
      <h3>Chats</h3>

      {chats.length === 0 && <p>No tienes chats aún</p>}

      {chats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          currentUserId={user.uid}
          onClick={() => setActiveChat(chat.id)}
        />
      ))}
    </div>
  );
}