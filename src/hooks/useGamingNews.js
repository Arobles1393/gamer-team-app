import { useEffect, useState } from "react";
import { gamingNewsService } from "../services/gamingNews/gamingNewsService";

export const useGamingNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = gamingNewsService.subscribeToGamingNews(
      (data) => {
        setNews(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error obteniendo noticias gamer:", error);
        setNews([]);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return {
    news,
    loading
  };
};