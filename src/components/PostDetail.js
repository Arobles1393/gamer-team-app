import { useLocation, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";

export default function PostDetail({ user }) {
  const { state: post } = useLocation();
  const { id } = useParams();
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [file, setFile] = useState(null);
  const storage = getStorage();
  const fileInputRef = useRef(null);
  
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
        userId: post.userId,
        userName: post.username,
        avatar: post.avatar || null,
        mediaUrl,
        mediaType,
        createdAt: serverTimestamp()
      });
      setComment("");
    } catch (error) {
      console.error(error);
    }
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
                  <div className="comment-header">
                    <Avatar
                      image={item?.avatar}
                      label={item.userName?.charAt(0).toUpperCase()}
                      shape="circle"
                    />
                    <span>
                      {post.username}
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
    </div>
  );
}