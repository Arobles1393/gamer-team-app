import { useEffect, useState, useRef } from "react";
import { auth, db } from "./firebase/config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, query, where, orderBy, limit, addDoc, getDocs } from "firebase/firestore";
import CreatePost from "./components/CreatePost";
import PostList from "./components/PostList";
import Profile from "./components/Profile";
import ChatPage from "./chat/ChatPage";
import PostDetail from "./components/PostDetail";
import Notifications from "./components/Notifications";
import GamingNews from "./gamingNews/GamingNews";
import FindPlayers from "./components/FindPlayers";
import Friends from "./components/Friends";
import AppHeader from "./components/Header/AppHeader";
import Auth from "./components/Auth";
import { Routes, Route, useNavigate } from "react-router-dom"
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { OverlayPanel } from "primereact/overlaypanel";

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

  const items = [
    {
      label: "Mi perfil",
      icon: "pi pi-user",
      command: () => {
        navigate("/profile");
      }
    },
    {
      label: "Mis publicaciones",
      icon: "pi pi-file",
      command: () => {
        navigate("/myposts");
      }
    },
    {
      label: "Mis partidas",
      icon: "pi pi-users",
      command: () => {
        navigate("/mypartys");
      }
    },
    {
      label: "Chats",
      icon: "pi pi-comments",
      command: () => {
        navigate("/chat");
      }
    },
    {
      label: "Amigos",
      icon: "pi pi-comments",
      command: () => {
        navigate("/friends");
      }
    },
    {
      label: "Buscar jugadores",
      icon: "pi pi-comments",
      command: () => {
        navigate("/findPlayers");
      }
    },
    {
      label: "Noticias Gamer",
      icon: "pi pi-megaphone",
      command: () => {
        navigate("/news");
      }
    },
    /*{ separator: true },
    {
      label: "Configuración",
      icon: "pi pi-cog"
    },*/
    { separator: true },
    {
      label: "Cerrar sesión",
      icon: "pi pi-sign-out",
      command: handleLogout
    }
  ];

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
    notificationRef.current.toggle(e);
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
      <OverlayPanel
        ref={notificationRef}
        style={{ width: "350px" }}
      >
        {notifications.length === 0 ? (
          <p>No tienes notificaciones</p>
        ) : (
          <>
            <div
              style={{
                maxHeight: "400px",
                overflowY: "auto"
              }}
            >
              {notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: "10px",
                    borderBottom: "1px solid #eee",
                    cursor: "pointer"
                  }}
                  onClick={async () => {
                    if (n.type === "friend_request"){
                      return;
                    }
                    await markAsRead(n.id);
                    notificationRef.current?.hide();
                    if (n.type === "comment") {
                      navigate(`/post/${n.relatedId}`);
                    }
                    if (n.type === "message") {
                      navigate("/chat", {
                        state: {
                          chatId: n.relatedId
                        }
                      });
                    }
                    if (n.type === "interested") {
                      navigate(`/post/${n.relatedId}`);
                    }
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: ".5rem"
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <strong>{n.title}</strong>
                      <p
                        style={{
                          margin: "4px 0"
                        }}
                      >
                        {n.text}
                      </p>
                    </div>

                    {n.type === "friend_request" &&
                    n.status !== "accepted" &&
                    n.status !== "rejected" && (
                      <div
                        style={{
                          display: "flex",
                          gap: ".25rem"
                        }}
                      >
                        <Button
                          icon="pi pi-check"
                          rounded
                          text
                          severity="success"
                          onClick={async (
                            e
                          ) => {
                            e.stopPropagation();

                            await acceptFriendRequest(
                              n
                            );
                          }}
                        />

                        <Button
                          icon="pi pi-times"
                          rounded
                          text
                          severity="danger"
                          onClick={async (
                            e
                          ) => {
                            e.stopPropagation();

                            await rejectFriendRequest(
                              n
                            );
                          }}
                        />
                      </div>
                    )}
                    {n.status === "accepted" && (
                      <span
                        style={{
                          color: "green",
                          fontWeight: "bold"
                        }}
                      >
                        ✅ Aceptada
                      </span>
                    )}

                    {n.status === "rejected" && (
                      <span
                        style={{
                          color: "red",
                          fontWeight: "bold"
                        }}
                      >
                        ❌ Rechazada
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                paddingTop: "10px",
                textAlign: "center"
              }}
            >
              <Button
                label="Ver todas"
                text
                icon="pi pi-list"
                onClick={() => {
                  notificationRef.current?.hide();
                  navigate("/notifications");
                }}
              />
            </div>
          </>
        )}
      </OverlayPanel>
    </>
  );
}

export default App;