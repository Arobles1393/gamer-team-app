import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import './Chat.css'

export default function ChatPage({ user, userData }) {
  const [activeChat, setActiveChat] = useState(null);
  const location = useLocation();

  // 🔥 si vienes desde "Enviar mensaje"
  useEffect(() => {
    if (location.state?.chatId) {
      setActiveChat(location.state.chatId);
    }
  }, [location]);

  return (
    <div className="chat-container">
      <ChatList user={user} setActiveChat={setActiveChat} />

      {activeChat ? (
        <ChatWindow user={user} chatId={activeChat} userData={userData}/>
      ) : (
        <div className="chat-empty">
          <p>Selecciona un chat</p>
        </div>
      )}
    </div>
  );
}