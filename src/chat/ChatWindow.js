import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase/config";

export default function ChatWindow({ user, chatId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

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

  // 🚀 enviar mensaje
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: newMessage,
      senderId: user.uid,
      createdAt: serverTimestamp()
    });

    setNewMessage("");
  };

  if (!chatId) return null;

  return (
    <div className="chat-window">
      <div className="chat-messages">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={
              msg.senderId === user.uid ? "my-msg" : "other-msg"
            }
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
        />

        <button onClick={sendMessage}>Enviar</button>
      </div>
    </div>
  );
}