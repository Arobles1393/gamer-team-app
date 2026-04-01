import { useEffect, useState } from "react";
import { auth, db } from "./firebase/config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import CreatePost from "./components/CreatePost";
import PostList from "./components/PostList";
import Profile from "./components/Profile";
import { Toolbar } from "primereact/toolbar";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import Auth from "./components/Auth";

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
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
        start={<h2 style={{ margin: 0 }}>GamerMatch</h2>}
        end={
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <h4>{userData?.username || user.email}</h4>
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