import { useEffect, useState, useRef } from "react";
import { auth, db } from "./firebase/config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, query, where, orderBy, limit, addDoc, getDocs } from "firebase/firestore";
import { AppHeader, createHeaderMenu  } from "./components/Header";
import { NotificationOverlay, Notifications } from "./components/Notifications";
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
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribeUserDoc = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          unsubscribeUserDoc = onSnapshot(docRef, (docSnap) => {
            console.log("🔥 SNAPSHOT:", docSnap.data());
            if (docSnap.exists()) {
              setUserData(docSnap.data());
            }
          });
        } catch (error) {
          console.error("Error obteniendo userData:", error);
        }
      } else {
        setUserData(null);
        if (unsubscribeUserDoc) unsubscribeUserDoc();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  useEffect(() => {
    
    if (!user) return;

    const updatePresence = async () => {
      try {
        await updateDoc(
          doc(db, "users", user.uid),
          {
            lastSeen: serverTimestamp()
          }
        );
      } catch (error) {
        console.error(error);
      }
    };

    updatePresence();

    const interval = setInterval(
      updatePresence,
      30000
    );

    return () => clearInterval(interval);

  }, [user]);

  useEffect(() => {

    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribe =
      onSnapshot(q, (snapshot) => {

        const data =
          snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

        setNotifications(data);

      });

    return unsubscribe;

  }, [user]);

  if (!user) {
    return (
      <Auth/>
    );
  }

  const unreadCount = notifications.filter(
    n => !n.read
  ).length;

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(
        doc(db, "notifications", notificationId),
        {
          read: true
        }
      );
    } catch (error) {
      console.error(error);
    }
  };

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

  const acceptFriendRequest = async (
    notification
  ) => {

    await addDoc(
      collection(db, "friends"),
      {
        users: [
          notification.senderId,
          notification.userId
        ],
        createdAt:
          serverTimestamp()
      }
    );

    // actualizar solicitud

    const q = query(
      collection(db, "friend_requests"),
      where(
        "senderId",
        "==",
        notification.senderId
      ),
      where(
        "receiverId",
        "==",
        notification.userId
      ),
      where(
        "status",
        "==",
        "pending"
      )
    );

    const snapshot =
      await getDocs(q);

    if (!snapshot.empty) {

      await updateDoc(
        snapshot.docs[0].ref,
        {
          status: "accepted"
        }
      );

      await updateDoc(
        doc(db, "notifications", notification.id),
        {
          status: "accepted",
          read: true
        }
      );

      await addDoc(
        collection(db, "notifications"),
        {
          userId: notification.senderId,
          senderId: user.uid,
          senderName: userData.username,
          senderAvatar: userData.avatar || null,
          type: "friend_accepted",
          title: "Solicitud aceptada",
          text: `${userData.username} aceptó tu solicitud de amistad`,
          read: false,
          createdAt: serverTimestamp()
        }
      );

    }
  };

  const rejectFriendRequest = async (
    notification
  ) => {

    const q = query(
      collection(db, "friend_requests"),
      where(
        "senderId",
        "==",
        notification.senderId
      ),
      where(
        "receiverId",
        "==",
        notification.userId
      ),
      where(
        "status",
        "==",
        "pending"
      )
    );

    const snapshot =
      await getDocs(q);

    if (!snapshot.empty) {

      await updateDoc(
        snapshot.docs[0].ref,
        {
          status: "rejected"
        }
      );

      await updateDoc(
        doc(db, "notifications", notification.id),
        {
          status: "rejected",
          read: true
        }
      );

    }
  };

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
        onAccept={acceptFriendRequest}
        onReject={rejectFriendRequest}
        onMarkAsRead={markAsRead}
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