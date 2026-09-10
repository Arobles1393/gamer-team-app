import { useNavigate, useParams } from "react-router-dom";
import { useState, useRef } from "react";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { platformIcons } from "../../utils/platformIcons";
import { UserProfile } from "../UserProfile";
import { Dialog } from "primereact/dialog";
import { chatService } from "../../services/chat";
import { friendService } from "../../services/friends";
import CommentItem from "./CommentItem";
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { formatDates } from "../../utils";
import {
  usePost,
  usePostComments,
  usePostInterestStatus,
  usePostInterest,
  useUserProfile
} from "../../hooks";

export default function PostDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const { post } = usePost(id);

  const { userData: postAuthor } = useUserProfile(post?.userId);

  const { comments, publishComment, removeComment } = usePostComments(
    id,
    post?.userId,
    user.uid
  );

  const { interestedCount, isInterested, interestedDoc } =
    usePostInterestStatus(id, user.uid);

  const { handleInterested } = usePostInterest(user, (error) => {
    console.error("Error al actualizar interés:", error);
  });

  const [comment, setComment] = useState("");
  const [file, setFile] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [friendStatus, setFriendStatus] = useState("none");

  const fileInputRef = useRef(null);
  const toast = useRef(null);

  if (!post) {
    return <div>Cargando...</div>;
  }

  // Punto 4 pendiente: esto duplica useFriendStatus, se resuelve en el
  // siguiente paso junto con el modal.
  const checkFriendStatus = async () => {

    const friendsQuery = query(
      collection(db, "friends"),
      where("users", "array-contains", user.uid)
    );

    const friendsSnap = await getDocs(friendsQuery);

    const isFriend = friendsSnap.docs.some((doc) =>
      doc.data().users.includes(selectedUserId)
    );

    if (isFriend) {
      setFriendStatus("friends");
      return;
    }

    const requestQuery = query(
      collection(db, "friend_requests"),
      where("senderId", "==", user.uid),
      where("receiverId", "==", selectedUserId),
      where("status", "==", "pending")
    );

    const requestSnap = await getDocs(requestQuery);

    if (!requestSnap.empty) {
      setFriendStatus("pending");
      return;
    }

    setFriendStatus("none");
  };

  const openProfile = (userId) => {
    setSelectedUserId(userId);
    setShowProfile(true);
    checkFriendStatus();
  };

  const handlePublish = async () => {
    try {
      await publishComment(comment, file);
      setComment("");
      setFile(null);
    } catch (error) {
      console.error("Error al publicar comentario:", error);

      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar el comentario. Intenta de nuevo.",
        life: 3000
      });
    }
  };

  const confirmDelete = (commentId) => {
    confirmDialog({
      message: "¿Seguro que quieres eliminar este comentario?",
      header: "Advertencia",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "eliminar",
      rejectLabel: "Cancelar",

      accept: async () => {
        try {
          await removeComment(commentId);

          toast.current.show({
            severity: "success",
            summary: "Eliminado",
            detail: "Comentario eliminado correctamente",
            life: 3000
          });
        } catch (error) {
          console.error("Error al eliminar comentario:", error);
        }
      },
      reject: () => {}
    });
  };

  // Punto 5 pendiente: mover a utils/getPlatformKey
  const getPlatformKey = (platform) => {
    const name = platform.toLowerCase();
    if (name.includes("xbox")) return "xbox";
    if (name.includes("playstation")) return "playstation";
    if (name.includes("switch")) return "switch";
    if (name.includes("pc")) return "pc";
    if (name.includes("mobile")) return "mobile";
    return null;
  };

  const uniquePlatforms = [
    ...new Set(
      (post.platforms || [])
        .map(getPlatformKey)
        .filter(Boolean)
    )
  ];

  // Punto 4 pendiente: duplica useProfileChat
  const handleChat = async () => {
    const chatId = await chatService.createOrGetChat(user, {
      uid: selectedUserId
    });

    navigate("/chat", { state: { chatId } });
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
          <img
            src={!post.portada ? post.image : post.portada}
            className="game-cover"
          />
          {!post.portada && <h2>{post.game}</h2>}

          <div className="meta-item">
            {post.multiplatform ? (
              uniquePlatforms.map((platform) => (
                <span key={platform}>{platformIcons[platform]?.()}</span>
              ))
            ) : (
              platformIcons[post.platform]?.()
            )}
          </div>

          <div className="game-info-card">
            <div className="info-row">
              <Avatar
                image={postAuthor?.avatar}
                label={postAuthor?.username?.charAt(0).toUpperCase()}
                shape="circle"
                onClick={(e) => {
                  e.stopPropagation();
                  openProfile(post.userId);
                }}
              />
              <span>{postAuthor?.username}</span>
            </div>

            <div className="info-row">
              <i className="pi pi-clock"></i>
              <span>{formatDates.formatDateN(post.createdAt)}</span>
            </div>

            <div className="info-row">
              <i className="pi pi-globe"></i>
              <span>{postAuthor?.region}</span>
            </div>

            <div className="info-row">
              <i className="pi pi-comments"></i>
              <span>{comments.length} comentarios</span>
            </div>

            <div className="info-row">
              <i className="pi pi-users"></i>
              <span>{interestedCount} jugadores interesados</span>
            </div>

            {post.userId !== user.uid && (
              <Button
                label={isInterested ? "Ya no me interesa" : "Quiero jugar"}
                icon={isInterested ? "pi pi-times" : "pi pi-users"}
                className={
                  isInterested ? "p-button-danger" : "p-button-success"
                }
                onClick={() => handleInterested(post, interestedDoc)}
              />
            )}
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
                <CommentItem
                  key={item.id}
                  comment={item}
                  currentUserId={user.uid}
                  onDelete={confirmDelete}
                  onOpenProfile={openProfile}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog
        pt={{ header: { style: { padding: 0 } } }}
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
              <>
                {friendStatus === "none" && (
                  <Button
                    label="Agregar amigo"
                    icon="pi pi-user-plus"
                    onClick={async () => {
                      await friendService.sendFriendRequest(
                        user,
                        selectedUserId
                      );
                      setFriendStatus("pending");
                    }}
                  />
                )}

                {friendStatus === "pending" && (
                  <Button
                    label="Solicitud enviada"
                    icon="pi pi-clock"
                    disabled
                  />
                )}

                {friendStatus === "friends" && (
                  <Button
                    label="Amigos"
                    icon="pi pi-check"
                    severity="success"
                    disabled
                  />
                )}

                <Button
                  icon="pi pi-comments"
                  className="chat-fab p-button-rounded p-button-success"
                  onClick={handleChat}
                />
              </>
            )}
          </div>
        )}
      </Dialog>

      <ConfirmDialog />
      <Toast ref={toast} />
    </div>
  );
}