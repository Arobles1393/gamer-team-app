import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  increment
} from "firebase/firestore";

import { db } from "../../firebase/config";
import { notificationService } from "../notifications";

// Marca o quita "Me interesa" y mueve posts/{id}.interestedCount en la misma
// transacción. Los interesados nuevos usan el id `${postId}_${uid}`: la
// transacción lo lee primero, así un doble clic no cuenta dos veces.
// (Los docs anteriores tienen id aleatorio y se quitan por interestedDoc.id)
const toggleInterested = async ({
  post,
  interestedDoc,
  user
}) => {
  const postRef = doc(db, "posts", post.id);

  if (interestedDoc) {
    const interestedRef = doc(db, "post_interested", interestedDoc.id);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(interestedRef);

      // Ya se había quitado (p. ej. otra pestaña)
      if (!snapshot.exists()) return;

      transaction.delete(interestedRef);
      transaction.update(postRef, { interestedCount: increment(-1) });
    });

    return true;
  }

  const interestedRef = doc(db, "post_interested", `${post.id}_${user.uid}`);

  const created = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(interestedRef);

    if (snapshot.exists()) return false;

    transaction.set(interestedRef, {
      postId: post.id,
      userId: user.uid,
      createdAt: serverTimestamp()
    });
    transaction.update(postRef, { interestedCount: increment(1) });

    return true;
  });

  if (created && post.userId !== user.uid) {
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