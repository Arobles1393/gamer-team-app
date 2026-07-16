import { useEffect } from "react";
import { doc, serverTimestamp, updateDoc} from "firebase/firestore";
import { db } from "../firebase/config";

export const useUserPresence = (user) => {

  useEffect(() => {

    if (!user) return;

    const updatePresence = async () => {
      try {
        await updateDoc(
          doc(db, "users", user.uid),
          {
            lastSeen: serverTimestamp()
          }
        );
      } catch (error) {
        console.error(error);
      }
    };

    updatePresence();

    const interval = setInterval(
      updatePresence,
      30000
    );

    return () => clearInterval(interval);

  }, [user]);
};