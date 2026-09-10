import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import { InputTextarea } from "primereact/inputtextarea";
import { useChatWindow, useUserProfile } from "../../hooks";
import { formatDates } from "../../utils";

export default function ChatWindow({ user, chatId }) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const { messages, otherUserId, sendMessage } = useChatWindow(
    chatId,
    user.uid
  );

  const { userData: otherUser } = useUserProfile(otherUserId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!chatId) return null;

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    await sendMessage(newMessage);
    setNewMessage("");
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <Avatar
          image={otherUser?.avatar}
          label={otherUser?.username?.charAt(0)?.toUpperCase()}
          shape="circle"
        />

        <div>
          <strong>{otherUser?.username || "Usuario"}</strong>
          <small>{formatDates.formatLastSeen(otherUser?.lastSeen)}</small>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty-messages">
            Inicia la conversación 🎮
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={msg.senderId === user.uid ? "my-msg" : "other-msg"}
          >
            <div>{msg.text}</div>
            <small>{formatDates.formatMessageTime(msg.createdAt)}</small>
          </div>
        ))}

        <div ref={messagesEndRef}></div>
      </div>

      <div className="chat-input">
        <InputTextarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          autoResize
          rows={1}
          style={{ width: "100%" }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button icon="pi pi-send" rounded text onClick={handleSend} />
      </div>
    </div>
  );
}