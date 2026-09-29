import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import './Chat.css'

export default function ChatPage() {
  const [activeChat, setActiveChat] = useState(null);
  const { state } = useLocation();
  const chatId = state?.chatId;

  useEffect(() => {
    if (chatId) {
      setActiveChat(chatId);
    }
  }, [chatId]);

  return (
    <div className="chat-container">
      <ChatList setActiveChat={setActiveChat} />

      {activeChat ? (
        <ChatWindow chatId={activeChat} />
      ) : (
        <div className="chat-empty">
          <p>Selecciona un chat</p>
        </div>
      )}
    </div>
  );
}