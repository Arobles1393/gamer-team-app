import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import { Avatar } from "primereact/avatar";

export default function ChatList({ user, setActiveChat }) {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      //orderBy("lastMessageAt","desc")
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

  const formatChatTime = (timestamp) => {

    if (!timestamp?.seconds) return "";

    const diff =
      Date.now() -
      timestamp.seconds * 1000;

    const minutes =
      Math.floor(diff / 60000);

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours =
      Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} h`;
    }

    const days =
      Math.floor(hours / 24);

    return `${days} d`;
  };

  return (
    <div className="chat-list">
      <h3>Chats</h3>

      {chats.length === 0 && <p>No tienes chats aún</p>}

      {chats.map((chat) => {

        const otherUserId = chat.participants.find(
          (id) => id !== user.uid
        );

        const otherUser = chat.participantInfo?.[otherUserId];

        return (
          <div
            key={chat.id}
            className="chat-item"
            onClick={() => setActiveChat(chat.id)}
          >
            <Avatar
              image={otherUser?.avatar}
              label={
                otherUser?.username
                  ?.charAt(0)
                  ?.toUpperCase()
              }
              shape="circle"
            />
            <div className="chat-info">
              <strong>
                {otherUser?.username}
              </strong>
              <p>
                {chat.lastMessage}
              </p>
              <small>
                {formatChatTime(chat.lastMessageAt)}
              </small>
            </div>
          </div>
        );
      })}
    </div>
  );
}