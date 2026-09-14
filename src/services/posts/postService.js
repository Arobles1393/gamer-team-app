import {
  doc,
  deleteDoc,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
  addDoc,
  onSnapshot
} from "firebase/firestore";
import { db } from "../../firebase/config";

const deletePost = (postId) => {
  return deleteDoc(doc(db, "posts", postId));
};

const getExistingMedia = async (game) => {

  const q = query(
    collection(db, "posts"),
    where("game", "==", game)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return {
      image: null,
      clip: null,
      logo: null,
      portada: null
    };
  }

  const data = snapshot.docs[0].data();

  return {
    image: data.image || null,
    clip: data.clip || null,
    logo: data.logo || null,
    portada: data.portada || null
  };
};

const createPost = (postData) => {
  return addDoc(
    collection(db, "posts"),
    postData
  );
};


const updatePost = (postId, postData) => {
  return updateDoc(
    doc(db, "posts", postId),
    postData
  );
};

const subscribeToPost = (postId, onSuccess, onError) => {
  return onSnapshot(
    doc(db, "posts", postId),
    (snap) => {
      onSuccess(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    },
    onError
  );
};

const subscribeToPosts = (
  { userId, onlyMine, joined },
  onSuccess,
  onError
) => {
  const base = collection(db, "posts");

  let q;

  if (onlyMine) {
    q = query(base, where("userId", "==", userId));
  } else if (joined) {
    q = query(base, where("joinedUsers", "array-contains", userId));
  } else {
    q = base;
  }

  return onSnapshot(
    q,
    (snapshot) => {
      onSuccess(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    },
    onError
  );
};

export const postService = {
  deletePost,
  getExistingMedia,
  createPost,
  updatePost,
  subscribeToPost,
  subscribeToPosts
};