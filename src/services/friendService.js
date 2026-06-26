import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../firebase/config";

export const sendFriendRequest = async (
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

  await addDoc(
    collection(db, "notifications"),
    {
      userId: receiverId,
      senderId: sender.uid,
      senderName: senderData.username,
      senderAvatar: senderData.avatar || "",
      type: "friend_request",
      title: "Solicitud de amistad",
      text: `${senderData.username} quiere agregarte`,
      read: false,
      createdAt: serverTimestamp()
    }
  );
};