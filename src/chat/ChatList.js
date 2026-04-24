import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

export default function ChatList({ user, setActiveChat }) {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setChats(data);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="chat-list">
      <h3>Chats</h3>

      {chats.length === 0 && <p>No tienes chats aún</p>}

      {chats.map(chat => (
        <div
          key={chat.id}
          className="chat-item"
          onClick={() => setActiveChat(chat.id)}
        >
          <p>Chat: {chat.id}</p>
        </div>
      ))}
    </div>
  );
}