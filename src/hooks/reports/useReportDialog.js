import { useCallback, useState } from "react";
import { useRequireAuth } from "../auth/useRequireAuth";

// Estado del ReportDialog: qué se está reportando ({ targetType, targetId,
// label }). Sin sesión, reportar manda al login.
export const useReportDialog = (user) => {
  const [target, setTarget] = useState(null);
  const requireAuth = useRequireAuth(user);

  const openReport = useCallback((targetType, targetId, label) => {
    if (!requireAuth()) return;
    setTarget({ targetType, targetId, label });
  }, [requireAuth]);

  const closeReport = useCallback(() => setTarget(null), []);

  return {
    reportTarget: target,
    openReport,
    closeReport
  };
};
