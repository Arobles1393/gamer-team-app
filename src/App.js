import { useEffect, useState, useRef } from "react";
import { auth, db } from "./firebase/config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import CreatePost from "./components/CreatePost";
import PostList from "./components/PostList";
import Profile from "./components/Profile";
import { Avatar } from "primereact/avatar";
import Auth from "./components/Auth";
import { Menu } from "primereact/menu";
import { Routes, Route, useNavigate } from "react-router-dom"
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";

function App() {
  const menuRef = useRef(null);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
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

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          <h2 onClick={() => navigate("/")}>
            GamerMatch
          </h2>
        </div>
        <div className="header-right">
          <Button
            label="Publicar"
            icon="pi pi-plus"
            className="publish-btn-floating"
            onClick={() => setShowCreatePost(true)}
          />
          <span className="username">
            {userData?.username || user.email}
          </span>
          <Menu model={items} popup ref={menuRef} />
          <Avatar
            image={userData?.avatar}
            label={
              !userData?.avatar
                ? userData?.username?.charAt(0).toUpperCase()
                : null
            }
            shape="circle"
            style={{ backgroundColor: "#6366f1", color: "#fff", cursor: "pointer" }}
            onClick={(e) => menuRef.current.toggle(e)}
            size="large"
          />
        </div>
      </header>
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
        </Routes>
      </div>
    </>
  );
}

export default App;