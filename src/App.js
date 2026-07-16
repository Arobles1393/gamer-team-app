import { useState, useRef } from "react";
import { auth } from "./firebase/config";
import { signOut } from "firebase/auth";
import { AppHeader, createHeaderMenu } from "./components/Header";
import { NotificationOverlay, Notifications } from "./components/Notifications";
import { markNotificationAsRead } from "./services/notifications";
import { acceptFriendRequest, rejectFriendRequest } from "./services/friends";
import { useNotifications, useUserPresence, useAuth } from "./hooks";
import CreatePost from "./components/CreatePost";
import PostList from "./components/PostList";
import Profile from "./components/Profile";
import ChatPage from "./chat/ChatPage";
import PostDetail from "./components/PostDetail";
import GamingNews from "./gamingNews/GamingNews";
import FindPlayers from "./components/FindPlayers";
import Friends from "./components/Friends";
import Auth from "./components/Auth";
import { Routes, Route, useNavigate } from "react-router-dom"
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
        <Routes>
          <Route
            path="/"
            element={
              <PostList user={user} 
                userData={userData}
                setEditingPost={setEditingPost}
                setShowCreatePost={setShowCreatePost}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <Profile user={user} 
                userData={userData} 
              />
            }
          />
          <Route
            path="/myposts"
            element={
              <PostList user={user} 
                setEditingPost={setEditingPost}
                setShowCreatePost={setShowCreatePost}
                onlyMine
              />
            }
          />
          <Route
            path="/mypartys"
            element={
              <PostList user={user}
                setShowCreatePost={setShowCreatePost}
                joined
              />
            }
          />
          <Route
            path="/chat"
            element={
              <ChatPage user={user} userData={userData}/>
            }
          />
          <Route
            path="/post/:id" 
            element={
              <PostDetail user={user} userData={userData}/>
            }
          />
          <Route
            path="/notifications"
            element={<Notifications user={user} userData={userData}/>}
          />
          <Route
            path="/friends"
            element={<Friends user={user} userData={userData}/>}
          />
          <Route
            path="/findPlayers"
            element={<FindPlayers user={user} userData={userData}/>}
          />
          <Route
            path="/news"
            element={<GamingNews />}
          />
        </Routes>
      </div>
    </>
  );
}

export default App;