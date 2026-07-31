import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebase/config";

const mapPosts = (snapshot) => snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));

export const usePosts = (
  user,
  onlyMine = false,
  joined = false
) => {
  const [posts, setPosts] = useState([]);

  const title = onlyMine
    ? "Mis publicaciones 🎮"
    : joined
      ? "Mis partidas 🎮"
      : "Partidas disponibles 🎮";

  useEffect(() => {
    if ((onlyMine || joined) && !user) {
      setPosts([]);
      return;
    }

    const base = collection(db, "posts");

    let q;

    if (onlyMine) {
      q = query(
        base,
        where("userId", "==", user.uid)
      );
    } else if (joined) {
      q = query(
        base,
        where(
          "joinedUsers",
          "array-contains",
          user.uid
        )
      );
    } else {
      q = base;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setPosts(mapPosts(snapshot));
      },
      (error) => {
        console.error(
          "Error obteniendo publicaciones:",
          error
        );
        setPosts([]);
      }
    );

    return unsubscribe;
  }, [user, onlyMine, joined]);

  return {
    posts,
    title
  };
};