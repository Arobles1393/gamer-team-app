import {
  doc,
  deleteDoc,
  updateDoc,
  arrayUnion
} from "firebase/firestore";
import { db } from "../../firebase/config";

const deletePost = (postId) => {
  return deleteDoc(doc(db, "posts", postId));
};

const joinPost = (postId, userId) => {
  return updateDoc(
    doc(db, "posts", postId),
    {
      joinedUsers: arrayUnion(userId)
    }
  );
};

const contactOwner = async (post, userId) => {
  await joinPost(post.id, userId);

  const message = `Hola ${post.username}, Quiero unirme a tu partida de ${post.game} 🎮`;

  window.open(
    `https://wa.me/${post.phone}?text=${encodeURIComponent(message)}`
  );
};

export const postService = {
  deletePost,
  joinPost,
  contactOwner
};