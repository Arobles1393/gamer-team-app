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

export const postService = {
  deletePost,
  joinPost
};