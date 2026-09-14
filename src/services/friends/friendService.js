import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc
} from "firebase/firestore";

import { db } from "../../firebase/config";
import { notificationService } from "../notifications";

const sendFriendRequest = async (sender, receiverId) => {

  const q = query(
    collection(db, "friend_requests"),
    where("senderId", "==", sender.uid),
    where("receiverId", "==", receiverId),
    where("status", "==", "pending")
  );

  const existing = await getDocs(q);
  if (!existing.empty) return;

  await addDoc(collection(db, "friend_requests"), {
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
};

const acceptFriendRequest = async (
  notification,
  user
) => {
  await addDoc(
    collection(db, "friends"),
    {
      users: [
        notification.senderId,
        notification.userId
      ],
      createdAt: serverTimestamp()
    }
  );

  const q = query(
    collection(db, "friend_requests"),
    where(
      "senderId",
      "==",
      notification.senderId
    ),
    where(
      "receiverId",
      "==",
      notification.userId
    ),
    where(
      "status",
      "==",
      "pending"
    )
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return;
  }

  await updateDoc(
    snapshot.docs[0].ref,
    {
      status: "accepted"
    }
  );

  await notificationService.updateNotificationStatus(
    notification.id,
    "accepted"
  );

  await notificationService.createNotification({
    userId: notification.senderId,
    senderId: user.uid,
    type: "friend_accepted",
    read: false,
    createdAt: serverTimestamp()
  });
};

const rejectFriendRequest = async (notification) => {
  const q = query(
    collection(db, "friend_requests"),
    where(
      "senderId",
      "==",
      notification.senderId
    ),
    where(
      "receiverId",
      "==",
      notification.userId
    ),
    where(
      "status",
      "==",
      "pending"
    )
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return;
  }

  await updateDoc(
    snapshot.docs[0].ref,
    {
      status: "rejected"
    }
  );

  await notificationService.updateNotificationStatus(
    notification.id,
    "rejected"
  );
};

const getFriendIds = async (userId) => {
  const q = query(
    collection(db, "friends"),
    where("users", "array-contains", userId)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const users = docSnap.data().users;
    return users.find((uid) => uid !== userId);
  });
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

  const requestQuery = query(
    collection(db, "friend_requests"),
    where("senderId", "==", userId),
    where("receiverId", "==", otherUserId),
    where("status", "==", "pending")
  );

  const requestSnap = await getDocs(requestQuery);

  if (!requestSnap.empty) {
    return "pending";
  }

  return "none";
};

export const friendService = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendIds,
  checkFriendStatus
};