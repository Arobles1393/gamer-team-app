import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  addDoc
} from "firebase/firestore";

import { db } from "../../firebase/config";
import { notificationService } from "../notifications";

const toggleInterested = async ({
  post,
  interestedDoc,
  user
}) => {
  if (interestedDoc) {
    await deleteDoc(
      doc(
        db,
        "post_interested",
        interestedDoc.id
      )
    );

    return true;
  }

  await addDoc(
    collection(db, "post_interested"),
    {
      postId: post.id,
      userId: user.uid,
      createdAt: serverTimestamp()
    }
  );

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

// Ids de los usuarios interesados en un post, del primero al último en unirse
const subscribeToPostInterested = (postId, onSuccess, onError) => {
  const q = query(
    collection(db, "post_interested"),
    where("postId", "==", postId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const interested = snapshot.docs
        .map((doc) => doc.data({ serverTimestamps: "estimate" }))
        .sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));

      onSuccess(interested.map((item) => item.userId));
    },
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

const subscribeToUserInterests = (userId, onSuccess, onError) => {
  const q = query(
    collection(db, "post_interested"),
    where("userId", "==", userId)
  );

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

export const interestService = {
  toggleInterested,
  subscribeToPostInterested,
  subscribeToUserInterest,
  subscribeToUserInterests
};