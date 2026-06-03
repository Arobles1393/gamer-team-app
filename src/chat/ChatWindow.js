import { useEffect, useState, useRef } from "react";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
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

  const formatTime = (timestamp) => {
    if (!timestamp?.seconds) return "";

    return new Date(
      timestamp.seconds * 1000
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getLastSeenText = (lastSeen) => {

    if (!lastSeen?.seconds) {
      return "⚫ Desconectado";
    }

    const diffMinutes = Math.floor(
      (Date.now() - lastSeen.seconds * 1000)
        / 60000
    );

    if (diffMinutes < 1) {
      return "🟢 Activo ahora";
    }

    if (diffMinutes < 60) {
      return `Hace ${diffMinutes} min`;
    }

    const hours = Math.floor(
      diffMinutes / 60
    );

    return `Hace ${hours} h`;
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
              {formatTime(msg.createdAt)}
            </small>
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>
      <div className="chat-input">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
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