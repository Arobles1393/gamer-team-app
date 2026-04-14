import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
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
    { label: "PlayStation", value: "playstation" },
    { label: "Xbox", value: "xbox" },
    { label: "Switch", value: "switch" },
    { label: "PC", value: "pc" },
    { label: "Mobile", value: "mobile" }
  ]
  const platformIcons = {
    pc: "/icons/pc.png",
    playstation: "/icons/playstation.png",
    xbox: "/icons/xbox.png",
    switch: "/icons/switch.png",
    mobile: "/icons/mobile.png"
  };

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
          <Card key={post.id} className="rawg-card">
            <div className="rawg-image-container">
              <img
                src={post.image || "/imagenotfound.png"}
                alt={post.game}
                className="rawg-image"
              />
            </div>
            <div>
              <h3>{post.game}</h3>
              <div className="rawg-meta">
                <div className="meta-item">
                  <img
                    src={platformIcons[post.platform]}
                    alt={post.platform}
                    className="platform-icon"
                  />
                  <span>{post.platform}</span>
                </div>
                <div className="meta-item">
                  <i className="pi pi-users"></i>
                  <span>{post.playersNeeded} jugadores</span>
                </div>
              </div>
              {/* 🔥 CONTENIDO OCULTO */}
              <div className="rawg-extra">
                {post.comments && (
                  <p>{post.comments}</p>
                )}
                <div className="user-row">
                  <Avatar
                    label={post.username?.charAt(0).toUpperCase()}
                    shape="circle"
                    onClick={() => {
                      setSelectedUserId(post.userId);
                      setShowProfile(true);
                    }}
                  />
                  <span>
                    {post.username}
                  </span>
                </div>
                <div className="post-actions">
                  {post.userId !== user.uid && (
                    <Button
                      label="Unirme"
                      icon="pi pi-users"
                      className="p-button-success p-button-sm"
                      onClick={() => handleJoin(post)}
                    />
                  )}
                  {post.userId === user.uid && (
                    <Button
                      label="Eliminar"
                      icon="pi pi-trash"
                      className="p-button-danger p-button-sm"
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