import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { db, storage, functions } from "../../firebase/config";
import { sanitizeGuideHtml } from "../../utils/guideHtml";

// guides/{guideId}: guías escritas en la app ("original") o links a guías de
// otros sitios ("external"). Entran como "pending" y solo se ven en /guias
// cuando un admin las aprueba (firestore.rules). El autor se resuelve en
// vivo con useUserProfile: aquí solo se guarda authorId.

// Imágenes de las guías (portada e insertadas en el texto): las mismas que
// valida storage.rules
export const GUIDE_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MAX_GUIDE_IMAGE_MB = 5;

const LIST_LIMIT = 60;

const guidesRef = collection(db, "guides");

const withId = (snapshot) =>
  snapshot.docs.map((guideDoc) => ({
    id: guideDoc.id,
    ...guideDoc.data({ serverTimestamps: "estimate" })
  }));

// Sube una imagen a guides/{authorId}/... y devuelve su URL (Storage)
const uploadGuideImage = async (authorId, file) => {
  if (!GUIDE_IMAGE_TYPES.includes(file.type) || file.size >= MAX_GUIDE_IMAGE_MB * 1024 * 1024) {
    throw new Error("invalid-guide-image");
  }

  const fileRef = ref(storage, `guides/${authorId}/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file, { contentType: file.type });
  return getDownloadURL(fileRef);
};

// Campos comunes; firestore.rules exige que estén todos
const baseGuide = ({ authorId, game, title }) => ({
  authorId,
  game: game.trim(),
  title: title.trim(),
  status: "pending",
  reviewNote: null,
  reviewedAt: null,
  createdAt: serverTimestamp()
});

const createOriginalGuide = ({ authorId, game, title, content, coverImage, youtubeVideoId }) =>
  addDoc(guidesRef, {
    ...baseGuide({ authorId, game, title }),
    type: "original",
    // Se sanitiza al guardar y otra vez al mostrar
    content: sanitizeGuideHtml(content),
    coverImage: coverImage || null,
    youtubeVideoId: youtubeVideoId || null,
    externalUrl: null,
    externalPreview: null
  });

// Vista previa de un link (Cloud Function). Si no se puede generar,
// devuelve la vista previa vacía en vez de fallar.
const fetchLinkPreview = async (url) => {
  const callable = httpsCallable(functions, "fetchLinkPreview");
  const { data } = await callable({ url });
  return data;
};

const hasPreview = (preview) => Boolean(preview?.title || preview?.description || preview?.image);

// preview: la que ya se mostró al usuario (si no, se pide aquí)
const createExternalGuide = async ({ authorId, game, title, externalUrl, preview }) => {
  const resolved = preview ?? await fetchLinkPreview(externalUrl).catch(() => null);

  return addDoc(guidesRef, {
    ...baseGuide({ authorId, game, title }),
    type: "external",
    content: null,
    coverImage: null,
    youtubeVideoId: null,
    externalUrl: externalUrl.trim(),
    externalPreview: hasPreview(resolved)
      ? { title: resolved.title ?? null, description: resolved.description ?? null, image: resolved.image ?? null }
      : null
  });
};

// Guías aprobadas, de la más nueva a la más vieja; game: filtra por juego
const subscribeToApprovedGuides = ({ game } = {}, onSuccess, onError) => {
  const constraints = [where("status", "==", "approved")];

  if (game) constraints.push(where("game", "==", game));
  constraints.push(orderBy("createdAt", "desc"), limit(LIST_LIMIT));

  return onSnapshot(query(guidesRef, ...constraints), (snapshot) => onSuccess(withId(snapshot)), onError);
};

// Las del autor, en cualquier estado (Mi perfil)
const subscribeToMyGuides = (userId, onSuccess, onError) =>
  onSnapshot(
    query(guidesRef, where("authorId", "==", userId), orderBy("createdAt", "desc")),
    (snapshot) => onSuccess(withId(snapshot)),
    onError
  );

// Solo admin (firestore.rules): por revisar, de la más vieja a la más nueva
const subscribeToPendingGuides = (onSuccess, onError) =>
  onSnapshot(
    query(guidesRef, where("status", "==", "pending"), orderBy("createdAt", "asc")),
    (snapshot) => onSuccess(withId(snapshot)),
    onError
  );

// Una guía; null si no existe o no se puede ver (pendiente de otro autor)
const subscribeToGuide = (guideId, onSuccess, onError) =>
  onSnapshot(
    doc(db, "guides", guideId),
    (snap) => onSuccess(snap.exists() ? { id: snap.id, ...snap.data({ serverTimestamps: "estimate" }) } : null),
    onError
  );

// Solo admin: aprobar o rechazar, con nota opcional
const reviewGuide = (guideId, status, reviewNote) =>
  updateDoc(doc(db, "guides", guideId), {
    status,
    reviewNote: reviewNote?.trim() || null,
    reviewedAt: serverTimestamp()
  });

export const guideService = {
  uploadGuideImage,
  createOriginalGuide,
  fetchLinkPreview,
  createExternalGuide,
  subscribeToApprovedGuides,
  subscribeToMyGuides,
  subscribeToPendingGuides,
  subscribeToGuide,
  reviewGuide
};
