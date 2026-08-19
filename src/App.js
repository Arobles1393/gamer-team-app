import { useState, useRef } from "react";
import { logout } from "./services/auth";
import { AppHeader, createHeaderMenu } from "./components/Header";
import { NotificationOverlay } from "./components/Notifications";
import { notificationService } from "./services/notifications";
import { friendService } from "./services/friends";
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
  const handleAcceptFriendRequest = (notification) => {
    return friendService.acceptFriendRequest(
      notification,
      user,
      userData
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
        onAccept={handleAcceptFriendRequest}
        onReject={handleRejectFriendRequest}
        onMarkAsRead={handleMarkNotificationAsRead}
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