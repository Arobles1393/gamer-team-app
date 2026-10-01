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

// Motivos de reporte. El texto está en reports:reasons.{value}
export const REPORT_REASONS = ["spam", "inappropriate", "harassment", "impersonation", "other"];

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
