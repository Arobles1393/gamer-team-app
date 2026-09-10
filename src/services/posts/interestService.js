import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../../firebase/config";
import { notificationService } from "../notifications";

const toggleInterested = async ({ post, interestedDoc, user }) => {

  if (interestedDoc) {
    await deleteDoc(doc(db, "post_interested", interestedDoc.id));
    return true;
  }

  await addDoc(collection(db, "post_interested"), {
    postId: post.id,
    userId: user.uid,
    createdAt: serverTimestamp()
  });

  if (post.userId !== user.uid) {
    await notificationService.createNotification({
      userId: post.userId,
      senderId: user.uid,
      type: "interested",
      read: false,
      createdAt: serverTimestamp(),
      relatedId: post.id
    });
  }

  return true;
};

const subscribeToInterestCount = (postId, onSuccess, onError) => {
  const q = query(
    collection(db, "post_interested"),
    where("postId", "==", postId)
  );

  return onSnapshot(
    q,
    (snapshot) => onSuccess(snapshot.size),
    onError
  );
};

const subscribeToUserInterest = (postId, userId, onSuccess, onError) => {
  const q = query(
    collection(db, "post_interested"),
    where("postId", "==", postId),
    where("userId", "==", userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const docSnap = snapshot.docs[0];
      onSuccess(docSnap ? { id: docSnap.id, ...docSnap.data() } : null);
    },
    onError
  );
};

export const interestService = {
  toggleInterested,
  subscribeToInterestCount,
  subscribeToUserInterest
};