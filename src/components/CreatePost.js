import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";

export default function CreatePost({ user }) {
  const [game, setGame] = useState("");
  const [players, setPlayers] = useState("");
  const [comments, setComments] = useState("");
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const getUserData = async () => {
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    };

    getUserData();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try{

      if (!game || !players || !comments) {
        alert("Completa todos los campos");
        return;
      }

      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        username: userData.username,
        game,
        playersNeeded: players,
        phone: userData.phone,
        createdAt: new Date(),
        comments
      });

      setGame("");
      setPlayers("");
      setComments("");
      alert("Publicación creada 🚀");
    }catch (error) {
        console.error("Error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>

      <input
        placeholder="Juego (Warzone, Fortnite...)"
        value={game}
        onChange={(e) => setGame(e.target.value)}
      />

      <input
        placeholder="Jugadores necesarios"
        value={players}
        onChange={(e) => setPlayers(e.target.value)}
      />

      <input
        placeholder="Comentarios"
        value={comments}
        onChange={(e) => setComments(e.target.value)}
      />

      <button type="submit">Crear</button>
    </form>
  );
}