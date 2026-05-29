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
  doc
} from "firebase/firestore";
import { db } from "../firebase/config";

export default function ChatWindow({ user, chatId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
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

  // 🚀 enviar mensaje
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    // 🔥 guardar mensaje
    await addDoc(
      collection(db, "chats", chatId, "messages"),
      {
        text: newMessage,
        senderId: user.uid,
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

  return (
    <div className="chat-window">
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
          icon= "pi pi-send"
          onClick= { sendMessage }
        />
      </div>
    </div>
  );
}