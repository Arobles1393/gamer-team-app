import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  runTransaction
} from "firebase/firestore";

import { db } from "../../firebase/config";
import { notificationService } from "../notifications";

const toggleInterested = async ({
  post,
  interestedDoc,
  user
}) => {
  const interestId =
    `${post.id}_${user.uid}`;

  const interestRef = doc(
    db,
    "post_interested",
    interestId
  );

  let created = false;

  await runTransaction(
    db,
    async (transaction) => {
      const interestSnap =
        await transaction.get(interestRef);

      if (interestSnap.exists()) {
        transaction.delete(interestRef);
        return;
      }

      transaction.set(
        interestRef,
        {
          postId: post.id,
          userId: user.uid,
          createdAt: serverTimestamp()
        }
      );

      created = true;
    }
  );

  if (
    created &&
    post.userId !== user.uid
  ) {
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
  subscribeToInterestCount,
  subscribeToUserInterest,
  subscribeToUserInterests
};