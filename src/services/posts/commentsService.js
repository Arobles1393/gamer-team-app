import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
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
      onSuccess(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    },
    onError
  );
};

const uploadCommentMedia = async (file) => {
  const fileRef = ref(storage, `comments/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);

  const mediaUrl = await getDownloadURL(fileRef);
  const mediaType = file.type.startsWith("image") ? "image" : "video";

  return { mediaUrl, mediaType };
};

const addComment = async ({ postId, postOwnerId, userId, text, file }) => {
  let mediaUrl = "";
  let mediaType = "";

  if (file) {
    const uploaded = await uploadCommentMedia(file);
    mediaUrl = uploaded.mediaUrl;
    mediaType = uploaded.mediaType;
  }

  await addDoc(collection(db, "post_comments"), {
    postId,
    text,
    userId,
    mediaUrl,
    mediaType,
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

export const commentsService = {
  subscribeToComments,
  addComment,
  deleteComment
};