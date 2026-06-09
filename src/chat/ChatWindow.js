import { useEffect, useState, useRef } from "react";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import { InputTextarea } from "primereact/inputtextarea";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  getDoc
} from "firebase/firestore";
import { db } from "../firebase/config";

export default function ChatWindow({ user, chatId, userData }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUser, setOtherUser] = useState(null);
  const messagesEndRef = useRef(null);

  // 🔥 escuchar mensajes en tiempo real
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);

  useEffect(() => {

  const loadOtherUser = async () => {

    if (!chatId) return;

    const chatSnap = await getDoc(
      doc(db, "chats", chatId)
    );

    if (!chatSnap.exists()) return;

    const chatData = chatSnap.data();

    const otherUserId =
      chatData.participants.find(
        (id) => id !== user.uid
      );

    if (!otherUserId) return;

    const userSnap = await getDoc(
      doc(db, "users", otherUserId)
    );

    if (userSnap.exists()) {
      setOtherUser(userSnap.data());
    }

  };

  loadOtherUser();

}, [chatId, user.uid]);

  // 🚀 enviar mensaje
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    // 🔥 guardar mensaje
    await addDoc(
      collection(db, "chats", chatId, "messages"),
      {
        text: newMessage,
        senderId: user.uid,
        senderName: userData.username,
        senderAvatar: userData.avatar || "",
        createdAt: serverTimestamp()
      }
    );

    // 🔥 actualizar metadata del chat
    await updateDoc(
      doc(db, "chats", chatId),
      {
        lastMessage: newMessage,
        lastMessageAt: serverTimestamp()
      }
    );
    
    setNewMessage("");
  };

  if (!chatId) return null;

  const formatMessageTime = (timestamp) => {

    if (!timestamp?.seconds) return "";

    const date = new Date(
      timestamp.seconds * 1000
    );

    const today = new Date();

    const diffDays = Math.floor(
      (today - date) / 86400000
    );

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    if (diffDays === 1) {
      return "Ayer";
    }

    if (diffDays < 7) {
      return `Enviado hace ${diffDays} días`;
    }

    return date.toLocaleDateString();
  };

  const getLastSeenText = (lastSeen) => {

    if (!lastSeen?.seconds) {
      return "⚫ Desconectado";
    }

    const diffMs =
      Date.now() - (lastSeen.seconds * 1000);

    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) {
      return "🟢 Activo ahora";
    }

    if (minutes < 60) {
      return `Ultima conexion: Hace ${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `Ultima conexion: Hace ${hours} h`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `Ultima conexion: Hace ${days} día${days > 1 ? "s" : ""}`;
    }

    const weeks = Math.floor(days / 7);

    if (weeks < 4) {
      return `Ultima conexion: Hace ${weeks} semana${weeks > 1 ? "s" : ""}`;
    }

    const months = Math.floor(days / 30);

    if (months < 12) {
      return `Ultima conexion: Hace ${months} mes${months > 1 ? "es" : ""}`;
    }

    const years = Math.floor(days / 365);

    return `Ultima conexion: Hace ${years} año${years > 1 ? "s" : ""}`;
  };

  return (
    <div className="chat-window">
      <div className="chat-header">

        <Avatar
          image={otherUser?.avatar}
          label={
            otherUser?.username
              ?.charAt(0)
              ?.toUpperCase()
          }
          shape="circle"
        />

        <div>

          <strong>
            {otherUser?.username || "Usuario"}
          </strong>

          <small>
            {getLastSeenText(otherUser?.lastSeen)}
          </small>

        </div>

      </div>
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty-messages">
            Inicia la conversación 🎮
          </div>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={
              msg.senderId === user.uid
                ? "my-msg"
                : "other-msg"
            }
          >
            <div>{msg.text}</div>

            <small>
              {formatMessageTime(msg.createdAt)}
            </small>
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
              sendMessage();
            }
          }}
        />
        <Button
          icon="pi pi-send"
          rounded
          text
          onClick={sendMessage}
        />
      </div>
    </div>
  );
}