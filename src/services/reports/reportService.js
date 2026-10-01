import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "../../firebase/config";

export const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "inappropriate", label: "Contenido inapropiado" },
  { value: "harassment", label: "Acoso" },
  { value: "impersonation", label: "Suplantación de identidad" },
  { value: "other", label: "Otro motivo" }
];

const createReport = ({ reporterId, targetType, targetId, reason, note = "" }) =>
  addDoc(collection(db, "reports"), {
    reporterId,
    targetType,
    targetId,
    reason,
    note: note.trim(),
    status: "pending",
    createdAt: serverTimestamp(),
    reviewedAt: null
  });

// Solo admin (firestore.rules): reportes por revisar, del más viejo al más nuevo
const subscribeToPendingReports = (onSuccess, onError) => {
  const q = query(
    collection(db, "reports"),
    where("status", "==", "pending"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onSuccess(snapshot.docs.map((reportDoc) => ({
        id: reportDoc.id,
        ...reportDoc.data({ serverTimestamps: "estimate" })
      })));
    },
    onError
  );
};

const markReportReviewed = (reportId) =>
  updateDoc(doc(db, "reports", reportId), {
    status: "reviewed",
    reviewedAt: serverTimestamp()
  });

export const reportService = {
  createReport,
  subscribeToPendingReports,
  markReportReviewed
};
