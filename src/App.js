import { useEffect, useState } from "react";
import { auth, db } from "./firebase/config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Login from "./components/Login";
import Register from "./components/Register";
import CreatePost from "./components/CreatePost";
import PostList from "./components/PostList";
import Profile from "./components/Profile";
import { Toolbar } from "primereact/toolbar";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async(currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        } catch (error) {
          console.error("Error obteniendo userData:", error);
        }
      } else {
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!user) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "100%",
            transition: "all 0.6s cubic-bezier(0.25, 1, 0.5, 1)",
            transform: showLogin ? "translateX(0%)" : "translateX(-100%)",
            opacity: showLogin ? 1 : 0
          }}
        >
          <Login setShowLogin={setShowLogin} />
        </div>
        <div
          style={{
            position: "absolute",
            width: "100%",
            transition: "all 0.6s cubic-bezier(0.25, 1, 0.5, 1)",
            transform: showLogin ? "translateX(100%)" : "translateX(0%)",
            opacity: showLogin ? 0 : 1
          }}
        >
          <Register setShowLogin={setShowLogin} />
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowLogin(true);
      console.log("Sesión cerrada");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <div 
      style={{
        maxWidth: "1200px",
        margin: "auto",
        padding: "1rem"
      }}
    >
      <Toolbar
        style={{
          marginBottom: "2rem",
          padding: "1rem",
          borderRadius: "8px"
        }}
        start={<h2 style={{ margin: 0 }}>🎮 GamerMatch</h2>}
        end={
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <span>{userData?.username || user.email}</span>
            <Avatar
              label={userData?.username?.charAt(0).toUpperCase()}
              shape="circle"
              style={{ backgroundColor: "#6366f1", color: "#fff", cursor: "pointer" }}
              onClick={() => setShowProfile(!showProfile)}
              size="large"
            />
            <Button
              icon="pi pi-sign-out"
              className="p-button-danger"
              onClick={handleLogout}
            />
          </div>
        }
      />
      {showProfile ? (
        <Profile user={user} userData={userData} />
      ) : (
        <>
          <CreatePost user={user} userData={userData} />
          <PostList user={user} />
        </>
      )}
    </div>
  );
}

export default App;