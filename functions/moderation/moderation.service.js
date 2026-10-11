const admin = require("firebase-admin");
const {FieldValue} = require("firebase-admin/firestore");
const {isOwnCommentMediaPath} = require("../postComments/commentMedia");
const {
  deleteAccount,
  deletePostTree,
  decrementGameStats,
  createStorage,
  deleteFile,
  deletePrefix,
} = require("../account/account.service");

// Acciones de quien administra sobre lo reportado (panel /admin/reports).
// Cada acción queda en moderation_log (quién, qué, sobre qué y por qué
// reporte) y cierra los reportes pendientes sobre lo mismo.

class ValidationError extends Error {}
class ForbiddenTargetError extends Error {}

// acción -> tipo de lo reportado sobre el que actúa
const ACTIONS = Object.freeze({
  deletePost: "post",
  deleteComment: "comment",
  suspendUser: "user",
  unsuspendUser: "user",
  deleteUser: "user",
});

const ID = /^[A-Za-z0-9:_-]{1,128}$/;

// ---------- Pura (testeable) ----------
const parseModerationRequest = (data) => {
  const {action, targetId, reportId = null} = data ?? {};
  if (!Object.hasOwn(ACTIONS, action)) throw new ValidationError("Acción desconocida");
  if (typeof targetId !== "string" || !ID.test(targetId)) throw new ValidationError("targetId inválido");
  if (reportId !== null && (typeof reportId !== "string" || !ID.test(reportId))) {
    throw new ValidationError("reportId inválido");
  }
  return {action, targetType: ACTIONS[action], targetId, reportId};
};

const db = () => admin.firestore();

// ---------- Acciones ----------

// La partida con todo lo ligado (igual que al eliminar una cuenta)
const removePost = async (postId) => {
  const post = await db().doc(`posts/${postId}`).get();
  if (!post.exists) return {done: false, authorId: null};
  const {game, mediaPaths, prefixes} = await deletePostTree(post);
  if (game) await decrementGameStats({[game]: 1});
  const bucket = await createStorage();
  for (const path of mediaPaths) await deleteFile(bucket, path);
  for (const prefix of prefixes) await deletePrefix(bucket, prefix);
  return {done: true, authorId: post.get("userId") || null};
};

// El comentario y su archivo (cleanupCommentMedia también lo borraría)
const removeComment = async (commentId) => {
  const ref = db().doc(`post_comments/${commentId}`);
  const comment = await ref.get();
  if (!comment.exists) return {done: false, authorId: null};
  const {mediaPath, userId} = comment.data();
  await ref.delete();
  if (isOwnCommentMediaPath(mediaPath, userId)) await deleteFile(await createStorage(), mediaPath);
  return {done: true, authorId: userId || null};
};

// Suspender: no puede iniciar sesión (Auth la rechaza con user-disabled) y
// sus sesiones abiertas no se renuevan (el token actual dura hasta 1 h)
const setSuspended = async (uid, disabled) => {
  await admin.auth().updateUser(uid, {disabled});
  if (disabled) await admin.auth().revokeRefreshTokens(uid);
  return {done: true, authorId: uid};
};

const RUN = {
  deletePost: removePost,
  deleteComment: removeComment,
  suspendUser: (uid) => setSuspended(uid, true),
  unsuspendUser: (uid) => setSuspended(uid, false),
  deleteUser: async (uid) => {
    await deleteAccount(uid);
    return {done: true, authorId: uid};
  },
};

// Sobre cuentas: nunca la propia ni la de otro admin. Si la cuenta ya no
// existe, no hay nada que hacer (pero el reporte se cierra igual)
const checkUserTarget = async (adminUid, uid) => {
  if (uid === adminUid) throw new ForbiddenTargetError("No sobre la propia cuenta");
  const target = await admin.auth().getUser(uid).catch((error) => {
    if (error.code === "auth/user-not-found") return null;
    throw error;
  });
  if (target?.customClaims?.admin === true) throw new ForbiddenTargetError("No sobre otra cuenta admin");
  return Boolean(target);
};

// Reportes pendientes sobre lo mismo: revisados, con la acción tomada
const closeReports = async ({targetType, targetId, action}) => {
  const pending = await db().collection("reports")
      .where("targetType", "==", targetType)
      .where("targetId", "==", targetId)
      .where("status", "==", "pending")
      .get();
  const batch = db().batch();
  pending.docs.forEach((d) => batch.update(d.ref, {
    status: "reviewed",
    reviewedAt: FieldValue.serverTimestamp(),
    resolution: action,
  }));
  if (!pending.empty) await batch.commit();
  return pending.size;
};

// adminUid: SIEMPRE el de request.auth, ya comprobado como admin
const moderate = async (adminUid, data) => {
  const request = parseModerationRequest(data);
  const {action, targetType, targetId, reportId} = request;

  let result = {done: false, authorId: null};
  if (targetType === "user") {
    if (await checkUserTarget(adminUid, targetId)) result = await RUN[action](targetId);
  } else {
    result = await RUN[action](targetId);
  }

  // Al eliminar una cuenta, deleteAccount conserva los reportes: aquí se
  // cierran los pendientes sobre ella
  const closed = action === "unsuspendUser" ? 0 : await closeReports({targetType, targetId, action});

  await db().collection("moderation_log").add({
    adminId: adminUid,
    action,
    targetType,
    targetId,
    authorId: result.authorId,
    reportId,
    done: result.done,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Solo conteos y ids en los logs
  console.info("moderate:", action, targetType, {done: result.done, closed});
  return {done: result.done, closedReports: closed};
};

module.exports = {
  moderate,
  parseModerationRequest,
  ACTIONS,
  ValidationError,
  ForbiddenTargetError,
};
