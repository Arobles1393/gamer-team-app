import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export const createOrGetChat = async (user1, user2) => {
  const chatId = [user1.uid, user2.uid].sort().join("_");

  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()){

    const user2Snap = await getDoc(
      doc(db, "users", user2.uid)
    );

    const user2Data =
      user2Snap.data();

    await setDoc(chatRef, {
      participants: [
        user1.uid,
        user2.uid
      ],

      participantInfo: {
        [user1.uid]: {
          username:
            user1.displayName ||
            "Usuario",
          avatar:
            user1.photoURL || ""
        },
        [user2.uid]: {
          username:
            user2Data?.username ||
            "Usuario",
          avatar:
            user2Data?.avatar || ""
        }
      },
      lastMessage: "",
      lastMessageAt: null,
      createdAt:
        serverTimestamp()
    });
  }

  return chatId;
};