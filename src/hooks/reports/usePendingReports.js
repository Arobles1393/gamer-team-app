import { useEffect, useState } from "react";
import { reportService } from "../../services/reports";

// Reportes por revisar (panel de admin)
export const usePendingReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    return reportService.subscribeToPendingReports(
      (data) => {
        setReports(data);
        setLoading(false);
        setError(false);
      },
      (err) => {
        console.error("Error obteniendo reportes:", err);
        setError(true);
        setLoading(false);
      }
    );
  }, []);

  return { reports, loading, error };
};
