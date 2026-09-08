import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit
} from "firebase/firestore";
import { db } from "../../firebase/config";

const subscribeToGamingNews = (onSuccess, onError) => {
  const q = query(
    collection(db, "gaming_news"),
    orderBy("publishedAt", "desc"),
    limit(20)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const news = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      onSuccess(news);
    },
    onError
  );
};

export const gamingNewsService = {
  subscribeToGamingNews
};