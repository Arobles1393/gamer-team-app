import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase/config";

const callable = httpsCallable(functions, "moderate");

// Acciones del panel de reportes que pide cada tipo de lo reportado
export const MODERATION_ACTIONS = {
  post: ["deletePost"],
  comment: ["deleteComment"],
  user: ["suspendUser", "deleteUser"]
};

// Cloud Function moderate (solo admin): hace la acción, cierra los reportes
// pendientes sobre lo mismo y lo anota en moderation_log.
// Devuelve { done, closedReports }; done false = ya no existía
const moderate = async ({ action, targetId, reportId = null }) => {
  const { data } = await callable({ action, targetId, reportId });
  return data;
};

export const moderationService = { moderate };
