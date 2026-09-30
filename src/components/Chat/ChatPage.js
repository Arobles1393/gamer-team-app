import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Toast } from "primereact/toast";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import ChatEmptyState from "./ChatEmptyState";
import "../Posts/Feed.css";
import "./Chat.css";

export default function ChatPage() {
  const { state } = useLocation();
  const requestedChatId = state?.chatId ?? null;

  // Llega con chatId al abrir el chat desde un perfil, una card o una notificación
  const [activeChat, setActiveChat] = useState(requestedChatId);
  const toast = useRef(null);

  useEffect(() => {
    if (requestedChatId) {
      setActiveChat(requestedChatId);
    }
  }, [requestedChatId]);

  const showError = useCallback((detail) => {
    toast.current?.show({
      severity: "error",
      summary: "Error",
      detail,
      life: 3000
    });
  }, []);

  return (
    <>
      {/* En mobile se ve un panel a la vez: la lista o el chat abierto */}
      <div className={`feed chat${activeChat ? " chat--open" : ""}`}>
        <ChatList activeChatId={activeChat} onSelectChat={setActiveChat} />

        {activeChat ? (
          <ChatWindow
            key={activeChat}
            chatId={activeChat}
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
