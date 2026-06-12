import { useLocation, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { platformIcons } from "../utils/platformIcons";
import UserProfile from "./UserProfile";
import { Dialog } from "primereact/dialog";
import { createOrGetChat } from "../services/chatService";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";

export default function PostDetail({ user, userData }) {
  const { state: post } = useLocation();
  const { id } = useParams();
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [file, setFile] = useState(null);
  const [interestedCount, setInterestedCount] = useState(0);
  const [isInterested, setIsInterested] = useState(false);
  const [interestDocId, setInterestDocId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const storage = getStorage();
  const fileInputRef = useRef(null);
  const toast = useRef(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, "post_comments"),
      where("postId", "==", id),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(data);
    });

    return () => unsubscribe();

  }, [id]);

  useEffect(() => {

    const q = query(
      collection(db, "post_interested"),
      where("postId", "==", id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {

      setInterestedCount(snapshot.size);

    });

    return () => unsubscribe();

  }, [id]);

  useEffect(() => {

    if (!user || !id) return;

    const q = query(
      collection(db, "post_interested"),
      where("postId", "==", id),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {

      if (!snapshot.empty) {

        setIsInterested(true);

        setInterestDocId(
          snapshot.docs[0].id
        );

      } else {

        setIsInterested(false);

        setInterestDocId(null);

      }

    });

    return () => unsubscribe();

  }, [id, user]);

  const handlePublish = async () => {
    if (!comment.trim()) return;
    try {
      let mediaUrl = "";
      let mediaType = "";

      if (file) {

        const fileRef = ref(
          storage,
          `comments/${Date.now()}_${file.name}`
        );

        await uploadBytes(fileRef, file);

        mediaUrl = await getDownloadURL(fileRef);

        mediaType = file.type.startsWith("image")
          ? "image"
          : "video";
      }
      await addDoc(collection(db, "post_comments"), {
        postId: id,
        text: comment,
        userId: user.uid,
        userName: userData.username,
        avatar: userData.avatar || null,
        mediaUrl,
        mediaType,
        createdAt: serverTimestamp()
      });
      if (post.userId !== user.uid) {
        await addDoc(collection(db, "notifications"), {
          userId: post.userId,
          senderId: user.uid,
          senderName: userData.username,
          senderAvatar: userData.avatar || null,
          type: "comment",
          title: "Nuevo comentario",
          text: `${userData.username} comentó tu publicación`,
          read: false,
          createdAt: serverTimestamp(),
          relatedId: id
        });
      }
      setComment("");
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar la publicacion " + error + " user " + JSON.stringify(user),
        life: 3000
      });
      console.error("Error al eliminar:", error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteDoc(
        doc(db, "post_comments", commentId)
      );
    } catch (error) {
      console.error(error);
    }
  };

  const confirmDelete = (id) => {
    confirmDialog({
      message: "¿Seguro que quieres eliminar este comentario?",
      header: "Advertencia",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "eliminar",
      rejectLabel: "Cancelar",

      accept: () => {
        handleDeleteComment(id);
        toast.current.show({
          severity: "success",
          summary: "Eliminado",
          detail: "Comentario eliminado correctamente",
          life: 3000
        });
      },
      reject: () => {}
    });
  };

  const handleInterested = async () => {

    try {

      if (isInterested && interestDocId) {

        await deleteDoc(
          doc(db, "post_interested", interestDocId)
        );

        return;
      }

      await addDoc(
        collection(db, "post_interested"),
        {
          postId: id,
          userId: user.uid,
          userName: userData.username,
          createdAt: serverTimestamp()
        }
      );

      if (post.userId !== user.uid) {
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
          relatedId: id
        });
      }

    } catch (error) {

      console.error(error);

    }

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

  const uniquePlatforms = [
    ...new Set(
      (post.platforms || [])
        .map(getPlatformKey)
        .filter(Boolean)
    )
  ];

  const handleChat = async () => {
    const chatId = await createOrGetChat(user, {
      uid: selectedUserId
    });

    navigate("/chat", {
      state: { chatId }
    });

    setShowProfile(false);
  };

  return (
    <div className="post-detail">  
      <div className="hero">  
        {post.gameClip ? (  
          <video  
            className="hero-video"  
            src={post.gameClip}  
            autoPlay  
            loop  
            muted  
          />  
        ) : (  
          <div   
            className="hero-video"  
            style={{  
              backgroundImage: `url(${post.image})`,  
              backgroundSize: "cover"  
            }}  
          />  
        )}  
        <div className="hero-overlay" />  
      </div>  
      <div className="post-content">
        <div className="left-panel">
          <img src={!post.portada ? post.image : post.portada} className="game-cover" />
          {!post.portada && (
            <h2>{post.game}</h2>
          )}
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
          <div className="game-info-card">

            <div className="info-row">
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

            <div className="info-row">
              <i className="pi pi-clock"></i>
              <span>{formatDate(post.createdAt)}</span>
            </div>

            <div className="info-row">
              <i className="pi pi-globe"></i>
              <span>{post.region}</span>
            </div>

            <div className="info-row">
              <i className="pi pi-comments"></i>
              <span>{comments.length} comentarios</span>
            </div>

            <div className="info-row">
              <i className="pi pi-users"></i>
              <span>{interestedCount} jugadores interesados</span>
            </div>

            {
              post.userId != user.uid && (
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
                      ? "p-button-danger"
                      : "p-button-success"
                  }
                  onClick={handleInterested}
                />
              )
            }

          </div>
        </div>
        <div className="right-panel">
          <div className="community-section">
            <h3>Publicaciones</h3>
            <div className="comment-input-card">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escribe algo..."
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files[0])}
              />

              <div className="comment-footer">

                <Button
                  icon="pi pi-image"
                  className="p-button-text upload-btn"
                  onClick={() => fileInputRef.current.click()}
                  tooltip="Subir imagen o video"
                />

                <Button
                  label="Publicar"
                  icon="pi pi-send"
                  onClick={handlePublish}
                />
              </div>
            </div>
            <div className="comments-list">
              {comments.map((item) => (
                <div
                  key={item.id}
                  className="comment-card"
                >
                  {item.userId === user.uid && (
                    <Button
                      icon="pi pi-times"
                      className="p-button-rounded p-button-text p-button-danger delete-comment-btn"
                      onClick={() => confirmDelete(item.id)}
                    />
                  )}
                  <div className="comment-header">
                    <Avatar
                      image={item?.avatar}
                      label={item.userName?.charAt(0).toUpperCase()}
                      shape="circle"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUserId(item.userId);
                        setShowProfile(true);
                      }}
                    />
                    <span>
                      {item.userName}
                    </span>
                  </div>
                  {item.text && (
                    <p>{item.text}</p>
                  )}
                  {item.mediaType === "image" && (
                    <img
                      src={item.mediaUrl}
                      className="comment-image"
                    />
                  )}
                  {item.mediaType === "video" && (
                    <video
                      controls
                      className="comment-video"
                    >
                      <source src={item.mediaUrl} />
                    </video>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
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

function formatDate(timestamp) {

  if (!timestamp) return "";

  const date = new Date(
    timestamp.seconds * 1000
  );

  const diff = Date.now() - date.getTime();

  const minutes = Math.floor(diff / 60000);

  if (minutes < 60) {
    return `Hace ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `Hace ${hours} h`;
  }

  const days = Math.floor(hours / 24);

  return `Hace ${days} días`;
}