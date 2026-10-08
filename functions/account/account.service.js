const admin = require("firebase-admin");
const {FieldValue} = require("firebase-admin/firestore");
const {isOwnCommentMediaPath} = require("../postComments/commentMedia");

// Eliminar cuenta: borra todo lo del usuario y lo que otros tienen ligado a
// él (Admin SDK: el cliente no puede borrar datos ajenos, subcolecciones ni
// carpetas de Storage). Cada paso es idempotente: si uno falla se detiene
// SIN borrar el usuario de Auth, para poder reintentar.
//
// Se conservan a propósito:
// - reports (los que hizo y los que lo señalan): registro de moderación
// - game_stats: agregados por juego, no personales (solo se descuenta
//   postCount por cada partida suya borrada, igual que al borrar una partida)
//
// Los logs llevan solo conteos por paso, nunca datos personales.

// Reautenticación reciente exigida en el servidor
const RECENT_LOGIN_SECONDS = 5 * 60;
const BATCH_SIZE = 400;

class RecentLoginError extends Error {}

const db = () => admin.firestore();

const assertRecentLogin = (token, nowSeconds = Math.floor(Date.now() / 1000)) => {
  const authTime = Number(token?.auth_time);
  if (!authTime || nowSeconds - authTime > RECENT_LOGIN_SECONDS) {
    throw new RecentLoginError("requires-recent-login");
  }
};

const docsOf = async (query) => (await query.get()).docs;

// Archivo de un comentario a borrar: solo si está en la carpeta de quien
// comentó (auditoría C-02; firestore.rules hace la misma comprobación)
const addCommentMedia = (paths, comment) => {
  if (isOwnCommentMediaPath(comment.mediaPath, comment.userId)) paths.add(comment.mediaPath);
};

const deleteRefs = async (refs) => {
  const unique = [...new Map(refs.map((ref) => [ref.path, ref])).values()];
  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = db().batch();
    unique.slice(i, i + BATCH_SIZE).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
  return unique.length;
};

// Notificaciones de otros que apuntan a algo que se borra (partida o chat)
const notificationsAbout = async (relatedIds) => {
  const refs = [];
  for (const relatedId of relatedIds) {
    refs.push(...(await docsOf(db().collection("notifications").where("relatedId", "==", relatedId))).map((d) => d.ref));
  }
  return refs;
};

// ---------- Storage (si el proyecto aún no tiene bucket, se omite) ----------
const createStorage = async () => {
  try {
    const bucket = admin.storage().bucket();
    const [exists] = await bucket.exists();
    return exists ? bucket : null;
  } catch (error) {
    console.warn("deleteAccount: Storage no disponible, se omiten archivos:", error.code || error.message);
    return null;
  }
};

const deleteFile = async (bucket, path) => {
  if (!bucket || !path) return 0;
  // Si cleanupCommentMedia ya lo borró, "not found" no es error
  await bucket.file(path).delete({ignoreNotFound: true});
  return 1;
};

const deletePrefix = async (bucket, prefix) => {
  if (!bucket) return 0;
  const [files] = await bucket.getFiles({prefix});
  await Promise.all(files.map((file) => file.delete({ignoreNotFound: true})));
  return files.length;
};

// ---------- Pasos ----------
const steps = (uid, bucket) => {
  const prefixes = new Set([`avatars/${uid}`, `banners/${uid}`, `comments/${uid}/`, `guides/${uid}/`]);
  const mediaPaths = new Set();

  return [
    // a. Partidas propias: comentarios (y su medio), intereses, chat del
    //    grupo y su carpeta, avisos que apuntan a ellas y -1 en game_stats
    ["partidas propias", async () => {
      const posts = await docsOf(db().collection("posts").where("userId", "==", uid));
      const perGame = {};
      for (const post of posts) {
        const [comments, interests] = await Promise.all([
          docsOf(db().collection("post_comments").where("postId", "==", post.id)),
          docsOf(db().collection("post_interested").where("postId", "==", post.id)),
        ]);
        comments.forEach((c) => addCommentMedia(mediaPaths, c.data()));
        await deleteRefs([...comments, ...interests].map((d) => d.ref));
        await db().recursiveDelete(db().doc(`group_chats/${post.id}`));
        prefixes.add(`group_chats/${post.id}/`);
        await deleteRefs(await notificationsAbout([post.id]));
        const game = post.data().game;
        if (game) perGame[game] = (perGame[game] || 0) + 1;
        await post.ref.delete();
      }
      for (const [game, count] of Object.entries(perGame)) {
        const stats = db().doc(`game_stats/${encodeURIComponent(game)}`);
        if ((await stats.get()).exists) await stats.update({postCount: FieldValue.increment(-count)});
      }
      return posts.length;
    }],

    // b. Sus comentarios en partidas ajenas (y su medio)
    ["comentarios", async () => {
      const comments = await docsOf(db().collection("post_comments").where("userId", "==", uid));
      comments.forEach((c) => addCommentMedia(mediaPaths, c.data()));
      return deleteRefs(comments.map((c) => c.ref));
    }],

    // c. Sus "Quiero jugar": -1 en el contador y fuera del chat del grupo
    ["intereses", async () => {
      const interests = await docsOf(db().collection("post_interested").where("userId", "==", uid));
      for (const interest of interests) {
        const {postId} = interest.data();
        const postRef = db().doc(`posts/${postId}`);
        const groupRef = db().doc(`group_chats/${postId}`);
        await db().runTransaction(async (tx) => {
          const [post, group] = await Promise.all([tx.get(postRef), tx.get(groupRef)]);
          if (post.exists) tx.update(postRef, {interestedCount: FieldValue.increment(-1)});
          if (group.exists) tx.update(groupRef, {participants: FieldValue.arrayRemove(uid)});
          tx.delete(interest.ref);
        });
      }
      return interests.length;
    }],

    // d. Sus mensajes en chats de partida (también donde ya no participa)
    ["mensajes de partida", async () => {
      const messages = await docsOf(db().collectionGroup("messages").where("senderId", "==", uid));
      messages.forEach((m) => {
        const [root, postId] = m.ref.path.split("/");
        if (root === "group_chats") prefixes.add(`group_chats/${postId}/${uid}/`);
      });
      return deleteRefs(messages.map((m) => m.ref));
    }],

    // e. Chats 1:1: se borran para las dos personas, con sus archivos
    ["chats", async () => {
      const chats = await docsOf(db().collection("chats").where("participants", "array-contains", uid));
      for (const chat of chats) {
        await db().recursiveDelete(chat.ref);
        prefixes.add(`chats/${chat.id}/`);
        await deleteRefs(await notificationsAbout([chat.id]));
      }
      return chats.length;
    }],

    // f. Amistades, solicitudes y bloqueos
    ["amistades y bloqueos", async () => {
      const groups = await Promise.all([
        docsOf(db().collection("friends").where("users", "array-contains", uid)),
        docsOf(db().collection("friend_requests").where("senderId", "==", uid)),
        docsOf(db().collection("friend_requests").where("receiverId", "==", uid)),
        docsOf(db().collection("blocks").where("participants", "array-contains", uid)),
      ]);
      return deleteRefs(groups.flat().map((d) => d.ref));
    }],

    // g. Notificaciones recibidas y enviadas
    ["notificaciones", async () => {
      const groups = await Promise.all([
        docsOf(db().collection("notifications").where("userId", "==", uid)),
        docsOf(db().collection("notifications").where("senderId", "==", uid)),
      ]);
      return deleteRefs(groups.flat().map((d) => d.ref));
    }],

    // h. Guías, preferencias de compatibilidad y perfil público
    ["guías y perfil", async () => {
      const [guides, usernames] = await Promise.all([
        docsOf(db().collection("guides").where("authorId", "==", uid)),
        // Su nombre de usuario queda libre (auditoría M-08)
        docsOf(db().collection("usernames").where("uid", "==", uid)),
      ]);
      return deleteRefs([
        ...guides.map((g) => g.ref),
        ...usernames.map((u) => u.ref),
        db().doc(`matchProfiles/${uid}`),
        db().doc(`publicProfiles/${uid}`),
      ]);
    }],

    // i. Archivos (si hay bucket)
    ["archivos", async () => {
      if (!bucket) return "sin bucket";
      let count = 0;
      for (const path of mediaPaths) count += await deleteFile(bucket, path);
      for (const prefix of prefixes) count += await deletePrefix(bucket, prefix);
      return count;
    }],

    // j. users/{uid} (con subcolecciones, si alguna vez las tiene)
    ["users", async () => {
      await db().recursiveDelete(db().doc(`users/${uid}`));
      return 1;
    }],

    // k. Último: la cuenta de Firebase Auth
    ["auth", async () => {
      await admin.auth().deleteUser(uid).catch((error) => {
        if (error.code !== "auth/user-not-found") throw error;
      });
      return 1;
    }],
  ];
};

// uid: SIEMPRE el de request.auth (lo pasa la callable)
const deleteAccount = async (uid) => {
  const bucket = await createStorage();
  const counts = {};
  for (const [name, run] of steps(uid, bucket)) {
    try {
      counts[name] = await run();
    } catch (error) {
      console.error(`deleteAccount: falló el paso "${name}"; la cuenta de Auth se conserva para reintentar`, error.code || error.message);
      console.info("deleteAccount: pasos completados", counts);
      throw error;
    }
  }
  console.info("deleteAccount: completado", counts);
  return {success: true};
};

module.exports = {deleteAccount, assertRecentLogin, RecentLoginError, RECENT_LOGIN_SECONDS};
