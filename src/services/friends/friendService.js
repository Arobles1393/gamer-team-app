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

const sendFriendRequest = async (
  sender,
  senderData,
  receiverId
) => {

  const q = query(
    collection(db, "friend_requests"),
    where("senderId", "==", sender.uid),
    where("receiverId", "==", receiverId),
    where("status", "==", "pending")
  );

  const existing = await getDocs(q);

  if (!existing.empty) {
    return;
  }

  await addDoc(
    collection(db, "friend_requests"),
    {
      senderId: sender.uid,
      senderName: senderData.username,
      senderAvatar: senderData.avatar || "",
      receiverId,
      status: "pending",
      createdAt: serverTimestamp()
    }
  );

  await notificationService.createNotification({
    userId: receiverId,
    senderId: sender.uid,
    senderName: senderData.username,
    senderAvatar: senderData.avatar || "",
    type: "friend_request",
    status: "pending",
    title: "Solicitud de amistad",
    text: `${senderData.username} quiere agregarte`,
    read: false,
    createdAt: serverTimestamp()
  });
};

const acceptFriendRequest = async (
  notification,
  user,
  userData
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
    senderName: userData.username,
    senderAvatar: userData.avatar || null,
    type: "friend_accepted",
    title: "Solicitud aceptada",
    text: `${userData.username} aceptó tu solicitud de amistad`,
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

export const friendService = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest
};