import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  increment,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";

import { db } from "../../firebase/config";
import { notificationService } from "../notifications";
import { groupChatRef } from "../chat/groupChatService";

// Marca o quita "Me interesa" y, en la misma transacción, mueve
// posts/{id}.interestedCount y entra o sale del chat del grupo
// (group_chats/{postId}.participants). Los interesados nuevos usan el id
// `${postId}_${uid}`: la transacción lo lee primero, así un doble clic no
// cuenta dos veces. (Los docs anteriores tienen id aleatorio y se quitan
// por interestedDoc.id). El autor nunca sale de su propio grupo.
const toggleInterested = async ({
  post,
  interestedDoc,
  user
}) => {
  const postRef = doc(db, "posts", post.id);
  const groupRef = groupChatRef(post.id);
  const isAuthor = post.userId === user.uid;

  if (interestedDoc) {
    const interestedRef = doc(db, "post_interested", interestedDoc.id);

    await runTransaction(db, async (transaction) => {
      const [snapshot, groupSnap] = await Promise.all([
        transaction.get(interestedRef),
        transaction.get(groupRef)
      ]);

      // Ya se había quitado (p. ej. otra pestaña)
      if (!snapshot.exists()) return;

      transaction.delete(interestedRef);
      transaction.update(postRef, { interestedCount: increment(-1) });

      if (groupSnap.exists() && !isAuthor) {
        transaction.update(groupRef, { participants: arrayRemove(user.uid) });
      }
    });

    return true;
  }

  const interestedRef = doc(db, "post_interested", `${post.id}_${user.uid}`);

  const created = await runTransaction(db, async (transaction) => {
    // El grupo no se lee: quien todavía no es participante no puede leerlo
    // (trae la vista previa del último mensaje). Todo post tiene su grupo.
    const snapshot = await transaction.get(interestedRef);

    if (snapshot.exists()) return false;

    transaction.set(interestedRef, {
      postId: post.id,
      userId: user.uid,
      createdAt: serverTimestamp()
    });
    transaction.update(postRef, { interestedCount: increment(1) });

    if (!isAuthor) {
      transaction.update(groupRef, { participants: arrayUnion(user.uid) });
    }

    return true;
  });

  // TODO: aquí sería el lugar natural para programar el recordatorio "tu
  // partida empieza en 30 min" (post.scheduledAt) al marcar interés, y
  // cancelarlo al quitarlo. Requiere una Cloud Function programada (Cloud
  // Scheduler o Cloud Tasks), que necesita el plan Blaze, igual que
  // cleanupCommentMedia y la protección de syncGamingNews.

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