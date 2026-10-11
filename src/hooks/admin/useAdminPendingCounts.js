import { useEffect, useState } from "react";
import { reportService } from "../../services/reports";
import { guideService } from "../../services/guides";

const EMPTY = { reports: 0, guides: 0 };

// Reportes y guías por revisar, para el menú de admin. Solo se suscribe si
// `enabled` (cuenta admin): las reglas le niegan esas lecturas a los demás.
export const useAdminPendingCounts = (enabled) => {
  const [counts, setCounts] = useState(EMPTY);

  useEffect(() => {
    if (!enabled) {
      setCounts(EMPTY);
      return undefined;
    }

    const onError = (error) => console.error("Error obteniendo pendientes de admin:", error);
    const unsubscribeReports = reportService.subscribeToPendingReports(
      (reports) => setCounts((prev) => ({ ...prev, reports: reports.length })),
      onError
    );
    const unsubscribeGuides = guideService.subscribeToPendingGuides(
      (guides) => setCounts((prev) => ({ ...prev, guides: guides.length })),
      onError
    );

    return () => {
      unsubscribeReports();
      unsubscribeGuides();
    };
  }, [enabled]);

  return counts;
};
