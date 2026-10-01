import { useMemo } from "react";
import { Link } from "react-router-dom";
import MessageList from "./MessageList";
import MessageComposer from "./MessageComposer";
import { UserAvatar } from "../UserAvatar";
import {
  useBlockedIds,
  useGroupChatWindow,
  usePostSummary,
  useUserProfiles
} from "../../hooks";
import { excludeBlockedAuthors } from "../../utils";
import { useCurrentUser } from "../../context";

const MAX_AVATARS = 4;

// Avatares apilados de los participantes (máx. 4 + "+N")
function StackedAvatars({ users, total }) {
  const extra = total - users.length;

  return (
    <span className="chat-stack" aria-hidden="true">
      {users.map((participant) => (
        <UserAvatar
          key={participant.id}
          image={participant.avatar}
          username={participant.username}
          className="chat-stack__avatar"
        />
      ))}
      {extra > 0 && <span className="chat-stack__more">+{extra}</span>}
    </span>
  );
}

// Chat del grupo de una partida (group_chats/{postId}): autor + interesados
export default function GroupChatWindow({ postId, onBack, onError }) {
  const user = useCurrentUser();

  const { messages, loading, participants, hasAccess, sendMessage } =
    useGroupChatWindow(postId, user.uid);

  // Juego y autor del post, en vivo
  const post = usePostSummary(postId);
  const { profiles, users } = useUserProfiles(participants);

  // Mensajes de alguien bloqueado (en cualquier dirección) no se muestran
  const { blockedIds } = useBlockedIds(user);
  const visibleMessages = useMemo(
    () => excludeBlockedAuthors(messages, blockedIds, "senderId"),
    [messages, blockedIds]
  );

  const title = post?.game || "Chat del grupo";
  const count = participants.length;

  const handleSend = async (text, file) => {
    try {
      await sendMessage(text, file);
    } catch (error) {
      console.error("Error enviando mensaje al grupo:", error);
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
    <section className="chat-window chat-window--group" aria-label={`Chat del grupo de ${title}`}>
      <header className="chat-window__header">
        <button
          type="button"
          className="chat-window__back"
          aria-label="Volver a los chats"
          onClick={onBack}
        >
          <i className="pi pi-arrow-left" aria-hidden="true" />
        </button>

        <StackedAvatars users={users.slice(0, MAX_AVATARS)} total={count} />

        <div className="chat-window__who">
          <h2 className="chat-window__name">
            {post ? (
              <Link to={`/post/${postId}`} className="chat-window__post-link">
                {title}
              </Link>
            ) : title}
          </h2>
          <span className="chat-window__status">
            <i className="pi pi-users" aria-hidden="true" />
            {count === 1 ? "1 participante" : `${count} participantes`}
          </span>
        </div>
      </header>

      {hasAccess || loading ? (
        <>
          <MessageList
            messages={visibleMessages}
            loading={loading}
            currentUserId={user.uid}
            otherUsername="todo el grupo"
            senderProfiles={profiles}
          />
          <MessageComposer onSend={handleSend} onError={onError} disabled={!hasAccess} />
        </>
      ) : (
        <div className="chat-messages chat-messages--empty">
          <p className="chat-blocked" role="status">
            <i className="pi pi-lock" aria-hidden="true" />
            Ya no formas parte de este grupo.
          </p>
        </div>
      )}
    </section>
  );
}
