import { useEffect, useState, useRef, useMemo } from "react";
import { db } from "../../firebase/config";
import { collection, onSnapshot, deleteDoc, doc, query, updateDoc, arrayUnion, addDoc, serverTimestamp } from "firebase/firestore";
import { Dropdown } from "primereact/dropdown";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";
import { createOrGetChat } from "../../services/chatService";
import { sendFriendRequest } from "../../services/friendService";
import PostCard from "./PostCard";
import { UserProfileDialog } from "../UserProfile";
import { useFriendStatus, usePosts } from "../../hooks";

export default function PostList({ user, userData, setEditingPost, setShowCreatePost, onlyMine = false, joined = false }) {

  const {
    posts,
    title
  } = usePosts(
    user,
    onlyMine,
    joined
  );

  const [filterGame, setFilterGame] = useState(null);
  const games = [...new Set(posts.map(post => post.game))];
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState(null);
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

  const {
    friendStatus,
    setFriendStatus
  } = useFriendStatus(
      user,
      selectedUserId
  );

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

  const handleContactOwner = async(post) => {
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

  const handleInterested = async (post, interestedDoc) => {
  try {

    if(interestedDoc){
      await deleteDoc(
        doc(db,"post_interested",interestedDoc.id)
      );

      return true;
    }


    await addDoc(
      collection(db,"post_interested"),
      {
        postId:post.id,
        userId:user.uid,
        userName:userData.username,
        createdAt:new Date()
      }
    );


    await addDoc(
      collection(db,"notifications"),
      {
        userId:post.userId,
        senderId:user.uid,
        senderName:userData.username,
        senderAvatar:userData.avatar || null,
        type:"interested",
        title:"Nuevo interesado",
        text:`${userData.username} está interesado en tu partida`,
        read:false,
        createdAt:serverTimestamp(),
        relatedId:post.id
      }
    );

    return true;

  } catch(error){

    toast.current.show({
      severity:"error",
      summary:"Error",
      detail:"No se pudo guardar el interés",
      life:3000
    });

    return false;
  }
};

  const handleEditPost = (post) => {
    setEditingPost(post);
    setShowCreatePost(true);
  };

  const handleFriendRequest = async () => {
    await sendFriendRequest(
      user,
      userData,
      selectedUserId
    );

    setFriendStatus("pending");
  };

  const interestedMap = useMemo(() => {
    const map = new Map();

    interestedPosts.forEach(item => {
      map.set(`${item.postId}_${item.userId}`, item);
    });

    return map;
  }, [interestedPosts]);

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
        {filteredPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            user={user}
            interestedDoc={ interestedMap.get(`${post.id}_${user.uid}`) }
            onToggleInterested={handleInterested}
            onEdit={handleEditPost}
            onDelete={confirmDelete}
            onShowProfile={(userId) => {
              setSelectedUserId(userId);
              setShowProfile(true);
            }}
            onContactOwner={handleContactOwner}
          />
        ))}
      </div>
      <UserProfileDialog
        visible={showProfile}
        onHide={() => setShowProfile(false)}
        selectedUserId={selectedUserId}
        user={user}
        friendStatus={friendStatus}
        onSendFriendRequest={handleFriendRequest}
        onChat={handleChat}
      />
      <ConfirmDialog />
      <Toast ref={toast} />
    </div>
  );
}