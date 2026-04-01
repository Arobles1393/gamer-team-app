import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Avatar } from "primereact/avatar";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import UserProfile from "./UserProfile";

export default function PostList({ user }) {
  const [posts, setPosts] = useState([]);
  const [filterGame, setFilterGame] = useState("");
  const games = [...new Set(posts.map(post => post.game))];
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const gameOptions = [
    { label: "Todos", value: "" },
    ...games.map((game) => ({
      label: game,
      value: game
    }))
  ];

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
    console.log("Filtro:", filterGame);
    console.log("Posts:", posts);
    if (!filterGame || filterGame === "") return true;
    return post.game === filterGame;
  });

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem"
        }}
      >
        <h2 style={{ margin: 0 }}>
          Partidas disponibles 🎮
          <span style={{ marginLeft: "8px", color: "#666", fontSize: "16px" }}>
            ({filteredPosts.length})
          </span>
        </h2>
        <Dropdown
          value={filterGame}
          options={gameOptions}
          onChange={(e) => setFilterGame(e.value)}
          optionLabel="label"
          optionValue="value"
          placeholder="Filtrar por juego"
          style={{ width: "200px" }}
        />
      </div>
      {filteredPosts.map((post) => (
        <Card
          key={post.id}
          style={{
            marginBottom: "1rem",
            borderRadius: "8px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>{post.game}</h3>
            <Tag value={`${post.playersNeeded} jugadores`} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
            <Avatar
              label={post.username?.charAt(0).toUpperCase()}
              shape="circle"
              size="normal"
            />
            <span 
              style={{ cursor: "pointer", color: "#3b82f6" }}
              onClick={() => {
                setSelectedUserId(post.userId);
                setShowProfile(true);
              }}
            >
              {post.username}
            </span>
          </div>
          {post.comments && (
            <p style={{ marginTop: "0.8rem", color: "#444" }}>
              {post.comments}
            </p>
          )}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginTop: "1rem"
            }}
          >
            {post.userId !== user.uid && (
              <Button
                label="Unirme"
                icon="pi pi-users"
                className="p-button-success"
                onClick={() => handleJoin(post)}
              />
            )}
            {post.userId === user.uid && (
              <Button
                label="Eliminar"
                icon="pi pi-trash"
                className="p-button-danger"
                onClick={() => eliminar(post.id)}
              />
            )}
          </div>
        </Card>
      ))}
      <Dialog
        header="Perfil de usuario"
        visible={showProfile}
        style={{ width: "400px" }}
        onHide={() => setShowProfile(false)}
        breakpoints={{ "960px": "75vw", "640px": "90vw" }}
        dismissableMask
        draggable={false}
      >
        {selectedUserId && (
          <UserProfile userId={selectedUserId} />
        )}
      </Dialog>
    </div>
  );
}