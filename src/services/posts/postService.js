import {
  doc,
  deleteDoc,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
  addDoc
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

export const postService = {
  deletePost,
  getExistingMedia,
  createPost,
  updatePost
};