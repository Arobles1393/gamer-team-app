import { useState, useRef } from "react";
import { auth } from "./firebase/config";
import { signOut } from "firebase/auth";
import { AppHeader, createHeaderMenu } from "./components/Header";
import { NotificationOverlay } from "./components/Notifications";
import { markNotificationAsRead } from "./services/notifications";
import { acceptFriendRequest, rejectFriendRequest } from "./services/friends";
import { useNotifications, useUserPresence, useAuth } from "./hooks";
import { AppRoutes } from "./routes";
import CreatePost from "./components/CreatePost";
import Auth from "./components/Auth";
import { useNavigate } from "react-router-dom"
import { Dialog } from "primereact/dialog";
import "./styles/variables.css";

function App() {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  const {
    user,
    userData
  } = useAuth();

  const {
    notifications,
    unreadCount
  } = useNotifications(user);

  useUserPresence(user);

  if (!user) {
    return (
      <Auth/>
    );
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Sesión cerrada");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const items = createHeaderMenu(
    navigate,
    handleLogout
  );

  const handleToggleNotifications=(e)=>{
    notificationRef.current?.toggle(e);
  }

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
      <Dialog
        header= { editingPost ? "✏️ Editar publicación" :"🎮 Crear publicación" }
        visible={showCreatePost}
        style={{ width: "1000px" }}
        onHide={() => {setShowCreatePost(false); setEditingPost(null);}}
      >
        <CreatePost
          user={user}
          userData={userData}
          editingPost={editingPost}
          onClose={() => {
            setShowCreatePost(false);
            setEditingPost(null);
          }}
        />
      </Dialog>
      <div 
        style={{
          maxWidth: "1200px",
          margin: "auto",
          padding: "1.5rem"
        }}
      >
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