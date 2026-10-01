import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch
} from "firebase/firestore";
import { db } from "../../firebase/config";

// Id `${blockerId}_${blockedId}`: firestore.rules lo usa para comprobar con
// exists() que no haya bloqueo antes de permitir chats, mensajes y amistad
const blockRef = (blockerId, blockedId) =>
  doc(db, "blocks", `${blockerId}_${blockedId}`);

// Bloquear deshace la amistad: el bloqueo y el borrado de friends van en el
// mismo batch
const blockUser = async (blockerId, blockedId) => {
  const friendsSnap = await getDocs(
    query(collection(db, "friends"), where("users", "array-contains", blockerId))
  );

  const batch = writeBatch(db);

  batch.set(blockRef(blockerId, blockedId), {
    participants: [blockerId, blockedId],
    blockerId,
    blockedId,
    createdAt: serverTimestamp()
  });

  friendsSnap.docs
    .filter((friendDoc) => friendDoc.data().users.includes(blockedId))
    .forEach((friendDoc) => batch.delete(friendDoc.ref));

  await batch.commit();
};

const unblockUser = (blockId) => deleteDoc(doc(db, "blocks", blockId));

// Bloqueos en los que participa el usuario, en cualquier dirección:
// [{ id, otherId, blockedByMe, createdAt }]
const subscribeToBlocks = (userId, onSuccess, onError) => {
  const q = query(
    collection(db, "blocks"),
    where("participants", "array-contains", userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onSuccess(
        snapshot.docs.map((blockDoc) => {
          const { blockerId, blockedId, createdAt } = blockDoc.data({ serverTimestamps: "estimate" });

          return {
            id: blockDoc.id,
            otherId: blockerId === userId ? blockedId : blockerId,
            blockedByMe: blockerId === userId,
            createdAt
          };
        })
      );
    },
    onError
  );
};

// En vivo: { blockedByMe, blockedMe, blockId } entre dos usuarios
const subscribeToBlockStatus = (userId, otherUserId, onSuccess, onError) => {
  const status = { blockedByMe: false, blockedMe: false };
  const emit = () => onSuccess({
    ...status,
    blockId: status.blockedByMe ? `${userId}_${otherUserId}` : null
  });

  const unsubMine = onSnapshot(
    blockRef(userId, otherUserId),
    (snap) => {
      status.blockedByMe = snap.exists();
      emit();
    },
    onError
  );

  const unsubTheirs = onSnapshot(
    blockRef(otherUserId, userId),
    (snap) => {
      status.blockedMe = snap.exists();
      emit();
    },
    onError
  );

  return () => {
    unsubMine();
    unsubTheirs();
  };
};

export const blockService = {
  blockUser,
  unblockUser,
  subscribeToBlocks,
  subscribeToBlockStatus
};
