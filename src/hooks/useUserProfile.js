import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

export const useUserProfile = (userId) => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!userId) {
      setUserData(null);
      return;
    }

    const userRef = doc(db, "users", userId);

    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          setUserData(null);
        }
      },
      (error) => {
        console.error(
          "Error al obtener el perfil del usuario:",
          error
        );

        setUserData(null);
      }
    );

    return unsubscribe;
  }, [userId]);

  return {
    userData
  };
};