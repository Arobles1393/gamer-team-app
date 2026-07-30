import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebase/config";

export const usePosts = (
  user,
  onlyMine = false,
  joined = false
) => {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");

  const getTitle = () => {
    if (onlyMine) return "Mis publicaciones 🎮";
    if (joined) return "Mis partidas 🎮";
    return "Partidas disponibles 🎮";
  };

  useEffect(() => {
    if ((onlyMine || joined) && !user) {
      setPosts([]);
      setTitle("");
      return;
    }

    const base = collection(db, "posts");

    let postsQuery;

    if (onlyMine) {
      postsQuery = query(
        base,
        where("userId", "==", user.uid)
      );

      setTitle(getTitle());
    } else if (joined) {
      postsQuery = query(
        base,
        where(
          "joinedUsers",
          "array-contains",
          user.uid
        )
      );

      setTitle(getTitle());
    } else {
      postsQuery = base;
      setTitle(getTitle());
    }

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        setPosts(
          snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        );
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