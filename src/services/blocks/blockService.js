import {
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { groupChatRef } from "../chat/groupChatService";
import { interestService } from "../posts/interestService";

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

  // El bloqueo ya está hecho; separarlos de los grupos es un extra que no
  // debe deshacerlo si falla
  try {
    await separateFromGroups(blockerId, blockedId);
  } catch (error) {
    console.error("No se pudo separar del chat de partida al bloquear:", error.code || error.message);
  }
};

// Tras bloquear, ya no comparten chats de partida (auditoría M-07): quien
// bloqueó saca a la otra persona de sus partidas (las reglas solo se lo
// permiten porque existe el bloqueo) y se sale de las partidas de ella.
// La otra persona no puede volver a entrar: con bloqueo no se puede marcar
// "Quiero jugar".
const separateFromGroups = async (blockerId, blockedId) => {
  const postOf = async (postId) => {
    const snap = await getDoc(doc(db, "posts", postId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  };

  // 1. Sus "Quiero jugar" en partidas mías: fuera del grupo, sin interés, -1
  const theirInterests = await getDocs(
    query(collection(db, "post_interested"), where("userId", "==", blockedId))
  );
  for (const interest of theirInterests.docs) {
    const post = await postOf(interest.data().postId);
    if (post?.userId !== blockerId) continue;

    const group = await getDoc(groupChatRef(post.id));
    if (!group.exists() || !group.data().participants?.includes(blockedId)) continue;

    const batch = writeBatch(db);
    batch.delete(interest.ref);
    batch.update(doc(db, "posts", post.id), { interestedCount: increment(-1) });
    batch.update(groupChatRef(post.id), { participants: arrayRemove(blockedId) });
    await batch.commit();
  }

  // 2. Mis "Quiero jugar" en partidas suyas: me salgo como al quitarlo a mano
  const myInterests = await getDocs(
    query(collection(db, "post_interested"), where("userId", "==", blockerId))
  );
  for (const interest of myInterests.docs) {
    const post = await postOf(interest.data().postId);
    if (post?.userId !== blockedId) continue;

    await interestService.toggleInterested({
      post,
      interestedDoc: { id: interest.id },
      user: { uid: blockerId }
    });
  }
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
