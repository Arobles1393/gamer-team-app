import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import MessageList from "./MessageList";
import MessageComposer from "./MessageComposer";
import { UserAvatar } from "../UserAvatar";
import {
  useBlockedIds,
  useGroupChatWindow,
  usePostSummary,
  useRequireVerified,
  useUserProfiles
} from "../../hooks";
import { excludeBlockedAuthors } from "../../utils";
import { JoinSteam } from "../Steam";
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
  const { t } = useTranslation("chat");
  const user = useCurrentUser();
  const requireVerified = useRequireVerified(user);

  const { messages, loading, error, retry, hasOlder, loadingOlder, loadOlder, participants, hasAccess, sendMessage } =
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

  const title = post?.game || t("list.groupFallback");
  const count = participants.length;

  const handleSend = async (text, file) => {
    // Sin verificar: abre el diálogo; el composer conserva el texto
    if (!requireVerified()) throw new Error("email-not-verified");
    try {
      await sendMessage(text, file);
    } catch (error) {
      console.error("Error enviando mensaje al grupo:", error);
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
    <section className="chat-window chat-window--group" aria-label={t("window.groupLabel", { title })}>
      <header className="chat-window__header">
        <button
          type="button"
          className="chat-window__back"
          aria-label={t("window.back")}
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
            {t("window.participants", { count })}
          </span>
        </div>
      </header>

      {/* Sala del autor: solo para quien participa por su "Quiero jugar" */}
      <JoinSteam
        targetUid={post?.userId}
        postId={postId}
        enabled={Boolean(post?.userId) && post.userId !== user.uid && hasAccess}
        className="chat-window__steam-join"
      />

      {hasAccess || loading ? (
        <>
          <MessageList
            messages={visibleMessages}
            loading={loading}
            currentUserId={user.uid}
            otherUsername={t("window.wholeGroup")}
            senderProfiles={profiles}
            error={error}
            onRetry={retry}
            hasOlder={hasOlder}
            loadingOlder={loadingOlder}
            onLoadOlder={loadOlder}
          />
          <MessageComposer onSend={handleSend} onError={onError} disabled={!hasAccess} />
        </>
      ) : (
        <div className="chat-messages chat-messages--empty">
          <p className="chat-blocked" role="status">
            <i className="pi pi-lock" aria-hidden="true" />
            {t("window.leftGroup")}
          </p>
        </div>
      )}
    </section>
  );
}
