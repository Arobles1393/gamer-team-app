import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { Card } from "primereact/card";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

export default function Profile({ user, userData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [links, setLinks] = useState([]);

  useEffect(() => {
    if (userData) {
      setUsername(userData.username || "");
      setPhone(userData.phone || "");
      setLinks(userData.links || []);
    }
  }, [userData]);

  const handleSave = async () => {
    try {
      const userRef = doc(db, "users", user.uid);
      const invalid = links.some((link) => link && !isValidLink(link));
      if (invalid) {
        alert("Todos los links deben comenzar con https://");
        return;
      }
      await updateDoc(userRef, {
        username,
        phone,
        links
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error actualizando perfil:", error);
    }
  };

  const isValidLink = (url) => {
    return url.startsWith("https://");
  };

  const getPlatform = (url) => {
    if (url.includes("steam")) return "steam";
    if (url.includes("discord")) return "discord";
    if (url.includes("xbox")) return "xbox";
    if (url.includes("playstation") || url.includes("psn")) return "playstation";
    if (url.includes("epicgames")) return "epic";
    return "other";
  };

  const getIcon = (platform) => {
    switch (platform) {
      case "steam":
        return "https://cdn-icons-png.flaticon.com/512/5968/5968705.png";
      case "discord":
        return "https://cdn-icons-png.flaticon.com/512/2111/2111370.png";
      case "xbox":
        return "https://cdn-icons-png.flaticon.com/512/5968/5968885.png";
      case "playstation":
        return "https://cdn-icons-png.flaticon.com/512/5968/5968753.png";
      default:
        return "https://cdn-icons-png.flaticon.com/512/709/709496.png";
      }
  };

  const getLabel = (platform) => {
    switch (platform) {
      case "steam": return "Steam";
      case "discord": return "Discord";
      case "xbox": return "Xbox";
      case "playstation": return "PlayStation";
      default: return "Perfil";
    }
  };

  const handleCancel = () => {
    setPhone(userData?.phone || "");
    setLinks(userData?.links || []);
    setIsEditing(false);
  };

  const hasChanges = () => {
    return (
      phone !== (userData?.phone || "") ||
      JSON.stringify(links) !== JSON.stringify(userData?.links || [])
    );
  };
  
  return (
    <Card style={{ borderRadius: "8px" }}>
      {/* HEADER */}
      <div style={{ textAlign: "center" }}>
        <Avatar
          label={userData?.username?.charAt(0).toUpperCase()}
          size="xlarge"
          shape="circle"
          style={{ marginBottom: "1rem", backgroundColor: "#6366f1", color: "#fff" }}
        />
        <h2 style={{ margin: 0 }}>
          {userData?.username || "Gamer"}
        </h2>
        <p style={{ color: "#666", marginTop: "0.3rem" }}>
          {user?.email}
        </p>
      </div>
      {/* INFO */}
      <div style={{ marginTop: "1.5rem" }}>
        {isEditing ? (
          <InputText value={phone} onChange={(e) => setPhone(e.target.value)} />
        ) : (
          <p><strong>📞 Teléfono:</strong> {userData?.phone || "No agregado"}</p>
        )}
      </div>
      {/* LINKS */}
      <div style={{ marginTop: "1rem" }}>
        <h4>🎮 Perfiles gamer</h4>
        {isEditing ? (
          <>
            {links.length > 0 ? (
              links.map((link, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginBottom: "0.5rem"
                  }}
                >
                  <InputText
                    value={link}
                    onChange={(e) => {
                      const newLinks = [...links];
                      newLinks[index] = e.target.value;
                      setLinks(newLinks);
                    }}
                    style={{ flex: 1 }}
                  />
                  <Button
                    icon="pi pi-trash"
                    className="p-button-danger p-button-text"
                    onClick={() => {
                      const newLinks = links.filter((_, i) => i !== index);
                      setLinks(newLinks);
                    }}
                  />
                </div>
              ))
            ) : (
              <p style={{ color: "#888" }}>No hay links</p>
            )}
            {/* ➕ Agregar link */}
            <Button
              label="Agregar link"
              icon="pi pi-plus"
              className="p-button-text"
              onClick={() => setLinks([...links, ""])}
            />
          </>
        ) : (
          <>
            {userData?.links?.length > 0 ? (
              userData.links.map((link, index) => {
                const platform = getPlatform(link);
                const icon = getIcon(platform);
                return(
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.5rem",
                      color: "#3b82f6",
                      textDecoration: "none"
                    }}
                  >
                    <img
                      src={icon}
                      alt={platform}
                      style={{ width: "20px", height: "20px" }}
                    />
                    {getLabel(platform)}
                  </a>
                )
              })
            ) : (
              <p style={{ color: "#888" }}>No hay links</p>
            )}
          </>
        )}
      </div>
      {/* BOTÓN */}
      <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
        <Button
          label={isEditing ? "Guardar" : "Editar perfil"}
          icon={isEditing ? "pi pi-check" : "pi pi-pencil"}
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          disabled={isEditing ? !hasChanges() : false} // 👈 clave
        />
        {isEditing && (
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-text"
            onClick={handleCancel}
          />
        )}
      </div>
    </Card>
  );
}