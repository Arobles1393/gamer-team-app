import { useEffect, useState } from "react";
import { gamingNewsService } from "../services/gamingNews/gamingNewsService";

export const useGamingNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(false);

    const unsubscribe = gamingNewsService.subscribeToGamingNews(
      (data) => {
        setNews(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error obteniendo noticias gamer:", error);
        setNews([]);
        setError(true);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [retryKey]);

  const retry = () => setRetryKey((key) => key + 1);

  return {
    news,
    loading,
    error,
    retry
  };
};
