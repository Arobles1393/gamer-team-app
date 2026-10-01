import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { Toast } from "primereact/toast";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import GroupChatWindow from "./GroupChatWindow";
import ChatEmptyState from "./ChatEmptyState";
import "../Posts/Feed.css";
import "./Chat.css";

export default function ChatPage() {
  const { t } = useTranslation();
  const { state } = useLocation();

  // Llega con chatId (1:1: perfil, card, notificación) o con groupChatId
  // (chat del grupo de una partida: detalle del post, notificación)
  const requested = state?.groupChatId
    ? { type: "group", id: state.groupChatId }
    : state?.chatId
      ? { type: "direct", id: state.chatId }
      : null;
  const requestedKey = requested ? `${requested.type}:${requested.id}` : null;

  // { type: "direct" | "group", id }
  const [activeChat, setActiveChat] = useState(requested);
  const toast = useRef(null);

  useEffect(() => {
    if (requestedKey) {
      const [type, id] = requestedKey.split(/:(.+)/);
      setActiveChat({ type, id });
    }
  }, [requestedKey]);

  const showError = useCallback((detail) => {
    toast.current?.show({
      severity: "error",
      summary: t("status.error"),
      detail,
      life: 3000
    });
  }, [t]);

  return (
    <>
      {/* En mobile se ve un panel a la vez: la lista o el chat abierto */}
      <div className={`feed chat${activeChat ? " chat--open" : ""}`}>
        <ChatList activeChat={activeChat} onSelectChat={setActiveChat} />

        {activeChat?.type === "group" ? (
          <GroupChatWindow
            key={`group-${activeChat.id}`}
            postId={activeChat.id}
            onBack={() => setActiveChat(null)}
            onError={showError}
          />
        ) : activeChat ? (
          <ChatWindow
            key={activeChat.id}
            chatId={activeChat.id}
            onBack={() => setActiveChat(null)}
            onError={showError}
          />
        ) : (
          <section className="chat-window chat-window--idle">
            <ChatEmptyState variant="noSelection" />
          </section>
        )}
      </div>
      <Toast ref={toast} />
    </>
  );
}
