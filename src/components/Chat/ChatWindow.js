import { useTranslation } from "react-i18next";
import ChatAvatar from "./ChatAvatar";
import MessageList from "./MessageList";
import MessageComposer from "./MessageComposer";
import { useMemo } from "react";
import { TwitchLive } from "../Twitch";
import { useBlockStatus, useChatWindow, useFriendStatus, useRequireVerified, useTwitchPresenceBatch, useUserProfile } from "../../hooks";
import { JoinSteam } from "../Steam";
import { getDisplayName, getPresenceLabel, isOnline } from "../../utils";
import { useCurrentUser } from "../../context";

export default function ChatWindow({ chatId, onBack, onError }) {
  const { t } = useTranslation("chat");
  const user = useCurrentUser();
  const requireVerified = useRequireVerified(user);

  const { messages, loading, error, retry, hasOlder, loadingOlder, loadOlder, otherUserId, sendMessage } = useChatWindow(
    chatId,
    user.uid
  );

  const { userData: otherUser, missing: otherMissing } = useUserProfile(otherUserId);
  const otherName = getDisplayName(otherUser, t("list.user"), otherMissing);
  // Con un bloqueo (en cualquier dirección) no se puede escribir;
  // firestore.rules también lo impide
  const { blocked } = useBlockStatus(user, otherUserId);
  const { friendStatus } = useFriendStatus(user, otherUserId);

  const online = isOnline(otherUser?.lastSeen);

  // ¿Está en vivo en Twitch? Misma consulta batcheada, con un solo usuario
  const otherLinks = otherUser?.links;
  const twitchPlayers = useMemo(
    () => (otherUserId && otherLinks ? [{ id: otherUserId, links: otherLinks }] : []),
    [otherUserId, otherLinks]
  );
  const twitchLive = useTwitchPresenceBatch(twitchPlayers)[otherUserId];

  const handleSend = async (text, file) => {
    // Sin verificar: abre el diálogo; el composer conserva el texto
    if (!requireVerified()) throw new Error("email-not-verified");
    try {
      await sendMessage(text, file);
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      onError?.(
        file
          ? t("window.sendFileError")
          : t("window.sendError")
      );
      // El composer conserva el texto y el adjunto para reintentar
      throw error;
    }
  };

  return (
    <section className="chat-window" aria-label={t("window.label", { username: otherName })}>
      <header className="chat-window__header">
        <button
          type="button"
          className="chat-window__back"
          aria-label={t("window.back")}
          onClick={onBack}
        >
          <i className="pi pi-arrow-left" aria-hidden="true" />
        </button>

        <ChatAvatar user={otherUser} size="sm" />

        <div className="chat-window__who">
          <h2 className="chat-window__name">{otherName}</h2>
          <span className={`chat-window__status${online ? " chat-window__status--online" : ""}`}>
            {getPresenceLabel(otherUser?.lastSeen)}
          </span>
          <TwitchLive live={twitchLive} className="chat-window__twitch" />
        </div>
      </header>

      {/* Solo con amistad (y sin bloqueo); la autorización real es la del servidor */}
      <JoinSteam
        targetUid={otherUserId}
        enabled={friendStatus === "friends" && !blocked}
        className="chat-window__steam-join"
      />

      <MessageList
        messages={messages}
        loading={loading}
        currentUserId={user.uid}
        otherUsername={otherUser?.username}
        error={error}
        onRetry={retry}
        hasOlder={hasOlder}
        loadingOlder={loadingOlder}
        onLoadOlder={loadOlder}
      />

      {blocked ? (
        <p className="chat-blocked" role="status">
          <i className="pi pi-ban" aria-hidden="true" />
          {t("window.blocked")}
        </p>
      ) : (
        <MessageComposer onSend={handleSend} onError={onError} disabled={!otherUserId} />
      )}
    </section>
  );
}
