import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/config";
import { Avatar } from "primereact/avatar";
import { Card } from "primereact/card";

export default function Notifications({ user }) {

  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {

    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setNotifications(data);

    });

    return () => unsubscribe();

  }, [user]);

  const handleNotificationClick = async (notification) => {

    if (!notification.read) {
      await updateDoc(
        doc(db, "notifications", notification.id),
        {
          read: true
        }
      );
    }

    if (
      notification.type === "comment" ||
      notification.type === "interested"
    ) {
      navigate(`/post/${notification.relatedId}`);
    }

    if (notification.type === "message") {
      navigate("/chat", {
        state: {
          chatId: notification.relatedId
        }
      });
    }

  };

  return (
    <div>
      <h2>Notificaciones</h2>

      {notifications.length === 0 && (
        <p>No tienes notificaciones</p>
      )}

      {notifications.map((notification) => (

        <Card
          key={notification.id}
          style={{
            marginBottom: "1rem",
            cursor: "pointer",
            opacity: notification.read ? 0.7 : 1
          }}
          onClick={() =>
            handleNotificationClick(notification)
          }
        >

          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "center"
            }}
          >

            <Avatar
              image={notification.senderAvatar}
              label={
                notification.senderName?.charAt(0)
              }
              shape="circle"
            />

            <div>
              <strong>
                {notification.title}
              </strong>

              <p style={{ margin: 0 }}>
                {notification.text}
              </p>

              <small>
                {formatDate(
                  notification.createdAt
                )}
              </small>
            </div>

          </div>

        </Card>

      ))}
    </div>
  );
}

function formatDate(timestamp) {

  if (!timestamp?.seconds) return "";

  const diff =
    Date.now() -
    timestamp.seconds * 1000;

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "Hace unos segundos";
  }

  if (minutes < 60) {
    return `Hace ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `Hace ${hours} h`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `Hace ${days} días`;
  }

  const weeks = Math.floor(days / 7);

  if (weeks < 4) {
    return `Hace ${weeks} semanas`;
  }

  const months = Math.floor(days / 30);

  if (months < 12) {
    return `Hace ${months} meses`;
  }

  const years = Math.floor(days / 365);

  return `Hace ${years} años`;
}