import { useEffect, useState, useRef } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, deleteDoc, doc, query, where, updateDoc, arrayUnion, addDoc, serverTimestamp } from "firebase/firestore";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import UserProfile from "./UserProfile";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";
import { createOrGetChat } from "../services/chatService";
import { platformIcons } from "../utils/platformIcons";

export default function PostList({ user, userData, setEditingPost, setShowCreatePost, onlyMine = false, joined = false }) {
  const [posts, setPosts] = useState([]);
  const [filterGame, setFilterGame] = useState(null);
  const games = [...new Set(posts.map(post => post.game))];
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState(null);
  const [title, setTitle] = useState("");
  const [interestedPosts, setInterestedPosts] = useState([]);
  const toast = useRef(null);
  const navigate = useNavigate();
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

  useEffect(() => {
    if (onlyMine && !user) return;

    const base = collection(db, "posts");

    let q;

    if (onlyMine) {
      q = query(
        base, 
        where("userId", "==", user.uid)
      );
      setTitle("Mis publicaciones 🎮");
    } else if (joined) {
      q = query(
        base,
        where("joinedUsers", "array-contains", user.uid)
      );
      setTitle("Mis partidas 🎮");
    } else {
      setTitle("Partidas disponibles 🎮");
      q = base;
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setPosts(data);
    });

    return () => unsubscribe();
  }, [user, onlyMine, joined]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "post_interested")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setInterestedPosts(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleJoin = async(post) => {
    const ref = doc(db, "posts", post.id);
    await updateDoc(ref, {
      joinedUsers: arrayUnion(user.uid)
    });
    const message = `Hola ${post.username}, Quiero unirme a tu partida de ${post.game} 🎮`;
    window.open(`https://wa.me/${post.phone}?text=${encodeURIComponent(message)}`);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "posts", id));
      console.log("Eliminado correctamente");
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar la publicacion",
        life: 3000
      });
      console.error("Error al eliminar:", error);
    }
  };

  const confirmDelete = (id) => {
    confirmDialog({
      message: "¿Seguro que quieres eliminar esta publicación?",
      header: "Advertencia",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "eliminar",
      rejectLabel: "Cancelar",

      accept: () => {
        handleDelete(id);
        toast.current.show({
          severity: "success",
          summary: "Eliminado",
          detail: "Publicación eliminada correctamente",
          life: 3000
        });
      },
      reject: () => {}
    });
  };

  const filteredPosts = posts.filter((post) => {
    const matchGame = !filterGame || post.game === filterGame;
    const matchPlatform = !filterPlatform || post.platform === filterPlatform;
    return matchGame && matchPlatform;
  });

  const handleChat = async () => {
    const chatId = await createOrGetChat(user, {
      uid: selectedUserId
    });

    navigate("/chat", {
      state: { chatId }
    });

    setShowProfile(false);
  };

  const getPlatformKey = (platform) => {
    const name = platform.toLowerCase();
    if (name.includes("xbox")) {
      return "xbox";
    }
    if (name.includes("playstation")) {
      return "playstation";
    }
    if (name.includes("switch")) {
      return "switch";
    }
    if (name.includes("pc")) {
      return "pc";
    }
    if (name.includes("mobile")) {
      return "mobile";
    }
    return null;
  };

  const handleInterested = async (post, interestedDoc) => {
    try {
      if (interestedDoc) {
        await deleteDoc(
          doc(
            db,
            "post_interested",
            interestedDoc.id
          )
        );
        return;
      }
      await addDoc(
        collection(db, "post_interested"),
        {
          postId: post.id,
          userId: user.uid,
          userName: userData.username,
          createdAt: new Date()
        }
      );
      await addDoc(collection(db, "notifications"), {
        userId: post.userId,
        senderId: user.uid,
        senderName: userData.username,
        senderAvatar: userData.avatar || null,
        type: "interested",
        title: "Nuevo interesado",
        text: `${userData.username} esta interesado en tu partida`,
        read: false,
        createdAt: serverTimestamp(),
        relatedId: post.id
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar el interes " + error,
        life: 3000
      });
      console.error(error);
    }
  };

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
          {title}
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
        {filteredPosts.map((post) => {
          const uniquePlatforms = [
            ...new Set(
              (post.platforms || [])
                .map(getPlatformKey)
                .filter(Boolean)
            )
          ];
          const isInterested = interestedPosts.some(
            (item) =>
              item.postId === post.id &&
              item.userId === user.uid
          );
          const interestedDoc = interestedPosts.find(
            (item) =>
              item.postId === post.id &&
              item.userId === user.uid
          );
          return(
            <Card key={post.id}
              className="rawg-card"
              onClick={() => navigate(`/post/${post.id}`, { state: post })}
            >
              <div className="rawg-image-container">
                {
                  post.userId !== user.uid &&
                  isInterested && (
                    <div style={{ marginBottom: "1rem" }}>
                      <span className="joined-badge">
                        Te interesa esta publicación
                      </span>
                    </div>
                  )
                }
                <img
                  src={post.image || "/imagenotfound.png"}
                  alt={post.game}
                  className="rawg-image"
                />
              </div>
              <div>
                {post.logo ? (
                  <img src={post.logo} alt={post.game} className="logo-game" />
                ) : (
                  <h3>{post.game}</h3>
                )}
                <div className="rawg-meta">
                  <div className="meta-item">
                    {
                      post.multiplatform ? (
                        uniquePlatforms.map((platform) => (
                          <span key={platform}>
                            {platformIcons[platform]?.()}
                          </span>
                        ))
                      ) : (
                        platformIcons[post.platform]?.()
                      )
                    }
                  </div>
                  <div className="meta-item" style={{ marginLeft: "auto" }}>
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
                      image={post?.avatar}
                      label={post.username?.charAt(0).toUpperCase()}
                      shape="circle"
                      onClick={(e) => {
                        e.stopPropagation();
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
                        label={
                          isInterested
                            ? "Ya no me interesa"
                            : "Quiero jugar"
                        }

                        icon={
                          isInterested
                            ? "pi pi-times"
                            : "pi pi-users"
                        }

                        className={
                          isInterested
                            ? "p-button-danger p-button-sm"
                            : "p-button-success p-button-sm"
                        }

                        onClick={(e) => {
                          e.stopPropagation();
                          handleInterested(post, interestedDoc);
                          if(!isInterested){
                            handleJoin(post); 
                          }
                        }}
                      />
                    )}
                    {post.userId === user.uid && (
                      <>
                        <Button
                          label="Editar"
                          icon="pi pi-pencil"
                          className="p-button-success p-button-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPost(post);
                            setShowCreatePost(true);
                          }}
                        />
                        <Button
                          label="Eliminar"
                          icon="pi pi-trash"
                          className="p-button-danger p-button-sm"
                          onClick={(e) => {e.stopPropagation(); confirmDelete(post.id);}}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <Dialog
        pt={{
          header: { style: { padding: 0 } }
        }}
        visible={showProfile}
        style={{ width: "1100px" }}
        onHide={() => setShowProfile(false)}
        breakpoints={{ "960px": "75vw", "640px": "90vw" }}
        dismissableMask
        draggable={false}
      >
        {selectedUserId && (
          <div className="profile-container">
            <UserProfile userId={selectedUserId} user={user} />
            {user.uid !== selectedUserId && (
              <Button
                icon="pi pi-comments"
                className="chat-fab p-button-rounded p-button-success"
                onClick={handleChat}
              />
            )}
          </div>
        )}
      </Dialog>
      <ConfirmDialog />
      <Toast ref={toast} />
    </div>
  );
}