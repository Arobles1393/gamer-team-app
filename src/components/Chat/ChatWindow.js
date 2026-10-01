import ChatAvatar from "./ChatAvatar";
import MessageList from "./MessageList";
import MessageComposer from "./MessageComposer";
import { useMemo } from "react";
import { TwitchLive } from "../Twitch";
import { useBlockStatus, useChatWindow, useTwitchPresenceBatch, useUserProfile } from "../../hooks";
import { getPresenceLabel, isOnline } from "../../utils";
import { useCurrentUser } from "../../context";

export default function ChatWindow({ chatId, onBack, onError }) {
  const user = useCurrentUser();

  const { messages, loading, otherUserId, sendMessage } = useChatWindow(
    chatId,
    user.uid
  );

  const { userData: otherUser } = useUserProfile(otherUserId);
  // Con un bloqueo (en cualquier dirección) no se puede escribir;
  // firestore.rules también lo impide
  const { blocked } = useBlockStatus(user, otherUserId);

  const online = isOnline(otherUser?.lastSeen);

  // ¿Está en vivo en Twitch? Misma consulta batcheada, con un solo usuario
  const otherLinks = otherUser?.links;
  const twitchPlayers = useMemo(
    () => (otherUserId && otherLinks ? [{ id: otherUserId, links: otherLinks }] : []),
    [otherUserId, otherLinks]
  );
  const twitchLive = useTwitchPresenceBatch(twitchPlayers)[otherUserId];

  const handleSend = async (text, file) => {
    try {
      await sendMessage(text, file);
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      onError?.(
        file
          ? "No se pudo enviar el archivo. Intenta de nuevo."
          : "No se pudo enviar el mensaje. Intenta de nuevo."
      );
      // El composer conserva el texto y el adjunto para reintentar
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
          <TwitchLive live={twitchLive} className="chat-window__twitch" />
        </div>
      </header>

      <MessageList
        messages={messages}
        loading={loading}
        currentUserId={user.uid}
        otherUsername={otherUser?.username}
      />

      {blocked ? (
        <p className="chat-blocked" role="status">
          <i className="pi pi-ban" aria-hidden="true" />
          No puedes enviar mensajes en esta conversación.
        </p>
      ) : (
        <MessageComposer onSend={handleSend} onError={onError} disabled={!otherUserId} />
      )}
    </section>
  );
}
