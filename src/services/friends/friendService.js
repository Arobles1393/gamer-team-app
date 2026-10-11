import {
  collection,
  serverTimestamp,
  query,
  where,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  doc,
  onSnapshot,
  deleteDoc
} from "firebase/firestore";

import { db } from "../../firebase/config";
import { notificationService } from "../notifications";

// Ids deterministas: firestore.rules los usa para exigir consentimiento.
// - friend_requests/{senderId}_{receiverId}: una solicitud por dirección
// - friends/{uidMenor}_{uidMayor}: una amistad por pareja; solo se crea en
//   el mismo batch en que quien la recibió acepta la solicitud
const requestRef = (senderId, receiverId) =>
  doc(db, "friend_requests", `${senderId}_${receiverId}`);

const friendPair = (uid1, uid2) => [uid1, uid2].sort();

const friendRef = (uid1, uid2) =>
  doc(db, "friends", friendPair(uid1, uid2).join("_"));

const getPendingRequest = async (senderId, receiverId) => {
  const snapshot = await getDoc(requestRef(senderId, receiverId));

  return snapshot.exists() && snapshot.data().status === "pending" ? snapshot : null;
};

// Tras un rechazo, cuánto hay que esperar para reenviar (lo mismo que
// firestore.rules en friend_requests)
export const FRIEND_REQUEST_RETRY_HOURS = 24;
const RETRY_MS = FRIEND_REQUEST_RETRY_HOURS * 60 * 60 * 1000;

// Error con las horas que faltan, para que la interfaz lo explique
export class FriendRequestRetryError extends Error {
  constructor(hoursLeft) {
    super("friends/retry-later");
    this.code = "friends/retry-later";
    this.hoursLeft = hoursLeft;
  }
}

// Devuelve el nuevo estado de amistad: "pending" o "friends"
const sendFriendRequest = async (sender, receiverId) => {

  // Si el otro ya nos envió una solicitud, se acepta en vez de crear otra al revés
  const incoming = await getPendingRequest(receiverId, sender.uid);

  if (incoming) {
    const notificationQuery = query(
      collection(db, "notifications"),
      where("userId", "==", sender.uid),
      where("senderId", "==", receiverId),
      where("type", "==", "friend_request"),
      where("status", "==", "pending")
    );

    const notificationSnap = await getDocs(notificationQuery);

    await acceptFriendRequest(
      {
        id: notificationSnap.docs[0]?.id,
        senderId: receiverId,
        userId: sender.uid
      },
      sender
    );

    return "friends";
  }

  const existing = await getDoc(requestRef(sender.uid, receiverId));
  const previous = existing.exists() ? existing.data() : null;
  if (previous?.status === "pending") return "pending";

  // Rechazada hace menos de 24 h: las reglas no dejan reenviarla todavía
  const sentAt = previous?.createdAt?.toMillis?.();
  if (previous?.status === "rejected" && sentAt && Date.now() - sentAt < RETRY_MS) {
    throw new FriendRequestRetryError(Math.ceil((sentAt + RETRY_MS - Date.now()) / (60 * 60 * 1000)));
  }

  // Crea la solicitud o reabre una anterior (rechazada, o aceptada de una
  // amistad que ya terminó) con el mismo id
  await setDoc(requestRef(sender.uid, receiverId), {
    senderId: sender.uid,
    receiverId,
    status: "pending",
    createdAt: serverTimestamp()
  });

  await notificationService.createNotification({
    userId: receiverId,
    senderId: sender.uid,
    type: "friend_request",
    status: "pending",
    read: false,
    createdAt: serverTimestamp()
  });

  return "pending";
};

// notification: { id?, senderId (quien envió la solicitud), userId (quien acepta) }
const acceptFriendRequest = async (
  notification,
  user
) => {
  const pending = await getPendingRequest(notification.senderId, notification.userId);

  if (!pending) {
    return;
  }

  const batch = writeBatch(db);

  batch.set(
    friendRef(notification.senderId, notification.userId),
    {
      users: friendPair(notification.senderId, notification.userId),
      createdAt: serverTimestamp()
    }
  );

  batch.update(
    pending.ref,
    {
      status: "accepted"
    }
  );

  // La notificación puede no existir (p. ej. si se borraron todas)
  if (notification.id) {
    batch.update(
      doc(db, "notifications", notification.id),
      {
        status: "accepted",
        read: true
      }
    );
  }

  const acceptedNotificationRef = doc(
    collection(db, "notifications")
  );

  batch.set(
    acceptedNotificationRef,
    {
      userId: notification.senderId,
      senderId: user.uid,
      type: "friend_accepted",
      read: false,
      createdAt: serverTimestamp()
    }
  );

  await batch.commit();
};

const rejectFriendRequest = async (notification) => {
  const pending = await getPendingRequest(notification.senderId, notification.userId);

  if (!pending) {
    return;
  }

  await updateDoc(
    pending.ref,
    {
      status: "rejected"
    }
  );

  await notificationService.updateNotificationStatus(
    notification.id,
    "rejected"
  );
};

const subscribeToFriends = (
  userId,
  onSuccess,
  onError
) => {
  const q = query(
    collection(db, "friends"),
    where("users", "array-contains", userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const friendIds = snapshot.docs.map((docSnap) => {
        const users = docSnap.data().users;

        return users.find((uid) => uid !== userId);
      });

      onSuccess(friendIds);
    },
    onError
  );
};

const checkFriendStatus = async (userId, otherUserId) => {
  const friendsQuery = query(
    collection(db, "friends"),
    where("users", "array-contains", userId)
  );

  const friendsSnap = await getDocs(friendsQuery);

  const isFriend = friendsSnap.docs.some((doc) =>
    doc.data().users.includes(otherUserId)
  );

  if (isFriend) {
    return "friends";
  }

  if (await getPendingRequest(userId, otherUserId)) {
    return "pending";
  }

  if (await getPendingRequest(otherUserId, userId)) {
    return "received";
  }

  return "none";
};

// Termina la amistad (cualquiera de los dos puede hacerlo)
const removeFriend = async (userId, otherUserId) => {
  const snapshot = await getDocs(
    query(collection(db, "friends"), where("users", "array-contains", userId))
  );

  const friendDocs = snapshot.docs.filter((friendDoc) =>
    friendDoc.data().users.includes(otherUserId)
  );

  await Promise.all(friendDocs.map((friendDoc) => deleteDoc(friendDoc.ref)));
};

export const friendService = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  subscribeToFriends,
  checkFriendStatus,
  removeFriend
};
