import { Avatar } from "primereact/avatar";
import { useChats } from "../../hooks";
import { formatDates } from "../../utils";

export default function ChatList({ user, setActiveChat }) {
  const { chats } = useChats(user);

  return (
    <div className="chat-list">
      <h3>Chats</h3>

      {chats.length === 0 && <p>No tienes chats aún</p>}

      {chats.map((chat) => {

        const otherUserId = chat.participants.find(
          (id) => id !== user.uid
        );

        const otherUser = chat.participantInfo?.[otherUserId];

        return (
          <div
            key={chat.id}
            className="chat-item"
            onClick={() => setActiveChat(chat.id)}
          >
            <Avatar
              image={otherUser?.avatar}
              label={
                otherUser?.username
                  ?.charAt(0)
                  ?.toUpperCase()
              }
              shape="circle"
            />
            <div className="chat-info">
              <strong>
                {otherUser?.username}
              </strong>
              <p>
                {chat.lastMessage}
              </p>
              <small>
                {formatDates.formatChatTime(chat.lastMessageAt)}
              </small>
            </div>
          </div>
        );
      })}
    </div>
  );
}