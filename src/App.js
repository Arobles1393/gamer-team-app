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

function App() {
  const menuRef = useRef(null);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showMyPosts, setShowMyPosts] = useState(false)

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
      setShowProfile(false)
      console.log("Sesión cerrada");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const items = [
    {
      label: "Mi perfil",
      icon: "pi pi-user",
      command: () => setShowProfile(true)
    },
    {
      label: "Mis publicaciones",
      icon: "pi pi-file"
    },
    {
      label: "Mis partidas",
      icon: "pi pi-users"
    },
    { separator: true },
    {
      label: "Configuración",
      icon: "pi pi-cog"
    },
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
          <h2
            onClick={() => {
              setShowProfile(false);
              setShowMyPosts(false);
            }}
            >
              GamerMatch
            </h2>
        </div>
        <div className="header-right">
          <span className="username">
            {userData?.username || user.email}
          </span>
          <Menu model={items} popup ref={menuRef} />
          <Avatar
            image={userData?.avatar}
            label={userData?.username?.charAt(0).toUpperCase()}
            shape="circle"
            style={{ backgroundColor: "#6366f1", color: "#fff", cursor: "pointer" }}
            onClick={(e) => menuRef.current.toggle(e)}
            size="large"
          />
        </div>
      </header>
      <div 
        style={{
          maxWidth: "1200px",
          margin: "auto",
          padding: "1.5rem"
        }}
      >
      {showProfile ? (
        <Profile user={user} userData={userData} />
      ) : (
        <>
          <CreatePost user={user} userData={userData} />
          <PostList user={user} />
        </>
      )}
    </div>
    </>
  );
}

export default App;