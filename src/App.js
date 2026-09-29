import { useState, useRef } from "react";
import { logout } from "./services/auth";
import { AppHeader, createHeaderMenu } from "./components/Header";
import { NotificationOverlay } from "./components/Notifications";
import { notificationService } from "./services/notifications";
import { friendService } from "./services/friends";
import { useNotifications, useUserPresence } from "./hooks";
import { useCurrentUser } from "./context";
import { AppRoutes } from "./routes";
import { CreatePostDialog } from "./components/Posts";
import { Auth } from "./components/Auth";
import { useNavigate } from "react-router-dom"
import "./styles/variables.css";
import "./styles/theme.css";
import "./styles/layout.css";

function App() {
  // UI State
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  // Refs
  const notificationRef = useRef(null);

  // Navigation
  const navigate = useNavigate();

  // Hooks
  const user = useCurrentUser();
  const { notifications, unreadCount } = useNotifications(user, { limitCount: 10 });
  useUserPresence(user);

  // Punto rosa en "Chats" del rail: hay notificaciones de mensaje sin leer
  const hasUnreadMessages = notifications.some(
    (notification) => notification.type === "message" && !notification.read
  );

  // UI Handlers
  const handleToggleNotifications = (e) => { notificationRef.current?.toggle(e); }
  const handleCloseCreatePost = () => { setShowCreatePost(false); setEditingPost(null); };
  const handleAcceptFriendRequest = (notification) => {
    return friendService.acceptFriendRequest(
      notification,
      user
    );
  };

  const handleRejectFriendRequest = (notification) => {
    return friendService.rejectFriendRequest(
      notification
    );
  };

  const handleMarkNotificationAsRead = (notificationId) => {
    return notificationService.markNotificationAsRead(
      notificationId
    );
  };

  if (!user) {
    return (
      <Auth/>
    );
  }

  const items = createHeaderMenu(
    navigate,
    logout
  );

  return (
    <>
      <AppHeader
        unreadCount={unreadCount}
        hasUnreadMessages={hasUnreadMessages}
        items={items}
        onToggleNotifications={handleToggleNotifications}
      />
      <NotificationOverlay
        notificationRef={notificationRef}
        notifications={notifications}
        onAccept={handleAcceptFriendRequest}
        onReject={handleRejectFriendRequest}
        onMarkAsRead={handleMarkNotificationAsRead}
      />
      <CreatePostDialog
        visible={showCreatePost}
        editingPost={editingPost}
        onHide={handleCloseCreatePost}
        onClose={handleCloseCreatePost}
      />
      <main className="app-content">
        <AppRoutes
          setEditingPost={setEditingPost}
          setShowCreatePost={setShowCreatePost}
        />
      </main>
    </>
  );
}

export default App;
