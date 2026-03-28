import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function Profile({ user }) {
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const fields = [
    { name: "username", label: "Nickname" },
    { name: "phone", label: "Teléfono" },
    { name: "email", label: "Correo" },
    { name: "steam", label: "Steam", type: "link" },
    { name: "xbox", label: "Xbox", type: "link" },
    { name: "playstation", label: "PlayStation", type: "link" }
  ];

  useEffect(() => {
    const getUserData = async () => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    };

    getUserData();
  }, [user]);

  const handleUpdate = async () => {
    const docRef = doc(db, "users", user.uid);

    await updateDoc(docRef, userData);

    setIsEditing(false);
    alert("Perfil actualizado 🔥");
  };

  if (!userData) return <p>Cargando perfil...</p>;

  return (
    <div>
      <h2>Perfil 👤</h2>

      {fields.map((field) => (
        <div key={field.name}>
            {isEditing ? (
                <input
                    placeholder={field.label}
                    value={userData[field.name] || ""}
                    onChange={(e) =>
                        setUserData({
                            ...userData,
                            [field.name]: e.target.value
                        })
                    }
                />
            ) : (
                userData[field.name] && (
                    <p>
                        <strong>{field.label}:</strong>{" "}
                        {field.type === "link" ? (
                            <a href={userData[field.name]} target="_blank" rel="noopener noreferrer">
                                Ver perfil
                            </a>
                        ) : (
                            userData[field.name]
                        )}
                    </p>
                )
            )}
        </div>
      ))}
      {isEditing ? (
        <button onClick={handleUpdate}>Guardar</button>
        ) : (
        <button onClick={() => setIsEditing(true)}>Editar</button>
        )
      }
    </div>
  );
}