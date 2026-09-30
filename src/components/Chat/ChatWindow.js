import ChatAvatar from "./ChatAvatar";
import MessageList from "./MessageList";
import MessageComposer from "./MessageComposer";
import { useChatWindow, useUserProfile } from "../../hooks";
import { getPresenceLabel, isOnline } from "../../utils";
import { useCurrentUser } from "../../context";

export default function ChatWindow({ chatId, onBack, onError }) {
  const user = useCurrentUser();

  const { messages, loading, otherUserId, sendMessage } = useChatWindow(
    chatId,
    user.uid
  );

  const { userData: otherUser } = useUserProfile(otherUserId);

  const online = isOnline(otherUser?.lastSeen);

  const handleSend = async (text) => {
    try {
      await sendMessage(text);
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      onError?.("No se pudo enviar el mensaje. Intenta de nuevo.");
      // El composer devuelve el texto al input
      throw error;
    }
  };

  return (
    <section className="chat-window" aria-label={`Chat con ${otherUser?.username || "usuario"}`}>
      <header className="chat-window__header">
        <button
          type="button"
          className="chat-window__back"
          aria-label="Volver a los chats"
          onClick={onBack}
        >
          <i className="pi pi-arrow-left" aria-hidden="true" />
        </button>

        <ChatAvatar user={otherUser} size="sm" />

        <div className="chat-window__who">
          <h2 className="chat-window__name">{otherUser?.username || "Usuario"}</h2>
          <span className={`chat-window__status${online ? " chat-window__status--online" : ""}`}>
            {getPresenceLabel(otherUser?.lastSeen)}
          </span>
        </div>
      </header>

      <MessageList
        messages={messages}
        loading={loading}
        currentUserId={user.uid}
        otherUsername={otherUser?.username}
      />

      <MessageComposer onSend={handleSend} disabled={!otherUserId} />
    </section>
  );
}
