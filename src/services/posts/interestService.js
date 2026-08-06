import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../../firebase/config";

const toggleInterested = async ({
  post,
  interestedDoc,
  user,
  userData
}) => {

  if (interestedDoc) {
    await deleteDoc(
      doc(db, "post_interested", interestedDoc.id)
    );

    return true;
  }

  await addDoc(
    collection(db, "post_interested"),
    {
      postId: post.id,
      userId: user.uid,
      userName: userData.username,
      createdAt: new Date()
    }
  );

  await addDoc(
    collection(db, "notifications"),
    {
      userId: post.userId,
      senderId: user.uid,
      senderName: userData.username,
      senderAvatar: userData.avatar || null,
      type: "interested",
      title: "Nuevo interesado",
      text: `${userData.username} está interesado en tu partida`,
      read: false,
      createdAt: serverTimestamp(),
      relatedId: post.id
    }
  );

  return true;
};

export const interestService = {
  toggleInterested
};