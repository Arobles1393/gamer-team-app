import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDoc
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";
import { db, storage } from "../../firebase/config";
import { notificationService } from "../notifications";

const subscribeToComments = (postId, onSuccess, onError) => {
  const q = query(
    collection(db, "post_comments"),
    where("postId", "==", postId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      // "estimate": el comentario recién publicado ya trae hora aunque el servidor no haya respondido
      onSuccess(snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data({ serverTimestamps: "estimate" })
      })));
    },
    onError
  );
};

const uploadCommentMedia = async (file, userId) => {
  const path = `comments/${userId}/${Date.now()}_${file.name}`;
  const fileRef = ref(storage, path);

  await uploadBytes(fileRef, file);

  const mediaUrl = await getDownloadURL(fileRef);
  const mediaType = file.type.startsWith("image") ? "image" : "video";

  return { mediaUrl, mediaType, mediaPath: path };
};

const addComment = async ({ postId, postOwnerId, userId, text, file }) => {
  let mediaUrl = "";
  let mediaType = "";
  let mediaPath = "";

  if (file) {
    const uploaded = await uploadCommentMedia(file, userId);
    mediaUrl = uploaded.mediaUrl;
    mediaType = uploaded.mediaType;
    mediaPath = uploaded.mediaPath;
  }

  await addDoc(collection(db, "post_comments"), {
    postId,
    text,
    userId,
    mediaUrl,
    mediaType,
    mediaPath,
    createdAt: serverTimestamp()
  });

  if (postOwnerId !== userId) {
    await notificationService.createNotification({
      userId: postOwnerId,
      senderId: userId,
      type: "comment",
      read: false,
      createdAt: serverTimestamp(),
      relatedId: postId
    });
  }
};

const deleteComment = (commentId) => {
  return deleteDoc(doc(db, "post_comments", commentId));
};

// Un comentario por id (p. ej. para ir a su post desde un reporte)
const getComment = async (commentId) => {
  const snap = await getDoc(doc(db, "post_comments", commentId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const commentsService = {
  subscribeToComments,
  addComment,
  deleteComment,
  getComment
};