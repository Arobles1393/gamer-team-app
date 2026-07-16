import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";

export const useAuth = () => {

  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {

    let unsubscribeUserDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {

			setUser(currentUser);

			if (currentUser) {

				const docRef = doc(
					db,
					"users",
					currentUser.uid
				);

				unsubscribeUserDoc = onSnapshot(
					docRef,
					(docSnap) => {

						if (docSnap.exists()) {
							setUserData(docSnap.data());
						}

					}
				);

			} else {

				setUserData(null);

				if (unsubscribeUserDoc) {
					unsubscribeUserDoc();
				}

			}

		}
	);

	return () => {

		unsubscribeAuth();

		if (unsubscribeUserDoc) {
			unsubscribeUserDoc();
		}

	};

  }, []);

  return {
    user,
    userData
  };
};