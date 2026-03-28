import { useEffect, useState } from "react";
import { auth } from "./firebase/config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Login from "./components/Login";
import Register from "./components/Register";
import CreatePost from "./components/CreatePost";
import PostList from "./components/PostList";
import Profile from "./components/Profile";

function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  if (!user) {
    return showLogin ? (
      <Login setShowLogin={setShowLogin} />
    ) : (
      <Register setShowLogin={setShowLogin} />
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
    <div>
      <button onClick={() => setShowProfile(!showProfile)}>
        Ver perfil
      </button>
      {showProfile ? (
        <Profile user={user} />
      ) : (
        <>
          <h1>Encuentra equipo gamer 🎮</h1>
          <CreatePost user={user} />
          <PostList user={user} />
        </>
      )}
      <button onClick={handleLogout}>
        Cerrar sesión
      </button>
    </div>
  );
}

export default App;