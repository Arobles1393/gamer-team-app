import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";

export default function PostList({ user }) {
  const [posts, setPosts] = useState([]);
  const [filterGame, setFilterGame] = useState("");
  const games = [...new Set(posts.map(post => post.game))];

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "posts"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(data);
    });

    return () => unsubscribe();
  }, []);

  const handleJoin = (post) => {
    const message = `Hola ${post.username}, Quiero unirme a tu partida de ${post.game} 🎮`;
    window.open(`https://wa.me/${post.phone}?text=${encodeURIComponent(message)}`);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "posts", id));
      console.log("Eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const eliminar = async (id) => {
    if (window.confirm("¿Seguro que quieres eliminar?")) {
      handleDelete(id);
    }
  }

  const filteredPosts = posts.filter(post => {
    if (!filterGame) return true;
    return post.game === filterGame;
  });

  return (
    <div>
      <h2>Partidas disponibles {filteredPosts.length} 🎮</h2>

      <select onChange={(e) => setFilterGame(e.target.value)}>
        <option value="">Todos</option>
        {games.map((game, index) => (
          <option key={index} value={game}>{game}</option>
        ))}
      </select>

      {filteredPosts.map((post, index) => (
        <div key={index}>
          <p>Jugador: {post.username}</p>
          <p>Juego: {post.game}</p>
          <p>Jugadores: {post.playersNeeded}</p>
          <p>Comentarios: {post.comments}</p>
          {user && post.userId !== user.uid && (
            <button onClick={() => handleJoin(post)}>
              Unirme
            </button>
          )}
          {user && post.userId === user.uid && (
            <button onClick={() => eliminar(post.id)}>
              Eliminar
            </button>
          )}
        </div>
      ))}
    </div>
  );
}