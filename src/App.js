import { useState, useRef } from "react";
import { logout } from "./services/auth";
import { AppHeader, createHeaderMenu } from "./components/Header";
import { NotificationOverlay } from "./components/Notifications";
import { markNotificationAsRead } from "./services/notifications";
import { acceptFriendRequest, rejectFriendRequest } from "./services/friends";
import { useNotifications, useUserPresence, useAuth } from "./hooks";
import { AppRoutes } from "./routes";
import { CreatePostDialog } from "./components/Posts";
import Auth from "./components/Auth";
import { useNavigate } from "react-router-dom"
import "./styles/variables.css";

function App() {
  // UI State
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  // Refs
  const notificationRef = useRef(null);

  // Navigation
  const navigate = useNavigate();

  // Hooks
  const { user, userData } = useAuth();
  const { notifications, unreadCount } = useNotifications(user);
  useUserPresence(user);

  // UI Handlers
  const handleToggleNotifications = (e) => { notificationRef.current?.toggle(e); }
  const handleCloseCreatePost = () => { setShowCreatePost(false); setEditingPost(null); };

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
        user={user}
        userData={userData}
        unreadCount={unreadCount}
        items={items}
        onToggleNotifications={handleToggleNotifications}
        onCreatePost={() => setShowCreatePost(true)}
        onHome={() => navigate("/")}
      />
      <NotificationOverlay
        notificationRef={notificationRef}
        notifications={notifications}
        onAccept={(notification) => acceptFriendRequest(notification, user, userData)}
        onReject={(notification) => rejectFriendRequest(notification)}
        onMarkAsRead={markNotificationAsRead}
      />
      <CreatePostDialog
        visible={showCreatePost}
        editingPost={editingPost}
        user={user}
        userData={userData}
        onHide={handleCloseCreatePost}
        onClose={handleCloseCreatePost}
      />
      <div className="app-content">
        <AppRoutes
          user={user}
          userData={userData}
          setEditingPost={setEditingPost}
          setShowCreatePost={setShowCreatePost}
        />
      </div>
    </>
  );
}

export default App;