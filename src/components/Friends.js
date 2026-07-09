import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";

import {
  useEffect,
  useState
} from "react";

import { db } from "../firebase/config";

import { Card } from "primereact/card";
import { Avatar } from "primereact/avatar";

export default function Friends({
  user
}) {

  const [friends, setFriends] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    if (!user) return;

    loadFriends();

  }, [user]);

  const loadFriends =
    async () => {

      try {

        const q = query(
          collection(
            db,
            "friends"
          ),
          where(
            "users",
            "array-contains",
            user.uid
          )
        );

        const snapshot =
          await getDocs(q);

        const friendData =
          await Promise.all(

            snapshot.docs.map(
              async docSnap => {

                const users =
                  docSnap.data().users;

                const friendId =
                  users.find(
                    uid =>
                      uid !==
                      user.uid
                  );

                const userDoc =
                  await getDoc(
                    doc(
                      db,
                      "users",
                      friendId
                    )
                  );

                return {
                  uid: friendId,
                  ...userDoc.data()
                };

              }
            )

          );

        setFriends(friendData);

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);

      }

    };

  if (loading) {
    return <p>Cargando amigos...</p>;
  }

  return (
    <div>

      <h2>
        Mis amigos
      </h2>

      {friends.length === 0 ? (
        <p>
          Aún no tienes amigos.
        </p>
      ) : (
        friends.map(friend => (

          <Card
            key={friend.uid}
            style={{
              marginBottom: "1rem"
            }}
          >

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem"
              }}
            >

              <Avatar
                image={
                  friend.avatar
                }
                label={
                  friend.username?.charAt(
                    0
                  )
                }
                shape="circle"
              />

              <div>

                <strong>
                  {
                    friend.username
                  }
                </strong>

                <p>
                  {friend.region}
                </p>

              </div>

            </div>

          </Card>

        ))
      )}

    </div>
  );

}