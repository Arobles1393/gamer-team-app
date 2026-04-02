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
  const [filterGame, setFilterGame] = useState(null);
  const games = [...new Set(posts.map(post => post.game))];
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState(null);
  const gameOptions = [
    { label: "Todos", value: "" },
    ...games.map((game) => ({
      label: game,
      value: game
    }))
  ];
  const platformOptions = [
    { label: "Todas", value: "" },
    { label: "🎮 PlayStation", value: "playstation" },
    { label: "🟢 Xbox", value: "xbox" },
    { label: "💻 PC", value: "pc" },
    { label: "📱 Mobile", value: "mobile" }
  ]

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

  const filteredPosts = posts.filter((post) => {
    const matchGame = !filterGame || post.game === filterGame;
    const matchPlatform = !filterPlatform || post.platform === filterPlatform;
    return matchGame && matchPlatform;
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
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <Dropdown
            value={filterGame}
            options={gameOptions}
            onChange={(e) => setFilterGame(e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="🎮 Juego"
          />
          <Dropdown
            value={filterPlatform}
            options={platformOptions}
            onChange={(e) => setFilterPlatform(e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="🕹 Plataforma"
          />
        </div>
      </div>
      <div className="post-grid">
      {filteredPosts.map((post) => (
        <Card
          key={post.id}
          className="post-card-grid"
        >
          <div className="post-container">
            <div className="post-main">
              <h3 className="post-game">{post.game}</h3>
              <div className="post-meta">
                <Tag value={`${post.playersNeeded} jugadores`} />
                <span className="platform">
                  {post.platform}
                </span>
              </div>
              {post.comments && (
                <p style={{ marginTop: "0.8rem", color: "#444" }}>
                  {post.comments}
                </p>
              )}
            </div>
            <div className="post-side">
              <div className="user-info">
                <Avatar
                  label={post.username?.charAt(0).toUpperCase()}
                  shape="circle"
                  size="normal"
                />
                <span 
                  className="user-name"
                  onClick={() => {
                    setSelectedUserId(post.userId);
                    setShowProfile(true);
                  }}
                >
                  {post.username}
                </span>
              </div>
              <div className="post-actions">
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
            </div>
          </div>
        </Card>
      ))}
      </div>
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