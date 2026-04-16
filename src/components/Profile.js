import { useEffect, useState, useRef } from "react";
import { db, storage } from "../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { Card } from "primereact/card";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { updateEmail } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Profile({ user, userData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [links, setLinks] = useState([]);
  const [preview, setPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const bannerInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userData) {
      setEmail(userData.email || "");
      setUsername(userData.username || "");
      setPhone(userData.phone || "");
      setLinks(userData.links || []);
    }
  }, [userData]);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  useEffect(() => {
    return () => {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [bannerPreview]);

  const handleSave = async () => {
    try {
      const userRef = doc(db, "users", user.uid);
      const invalid = links.some((link) => link && !isValidLink(link));
      if (invalid) {
        alert("Todos los links deben comenzar con https://");
        return;
      }

      if (email !== user.email) {
        if (!email.includes("@")) {
          alert("Correo inválido");
          return;
        }
        await updateEmail(user, email);
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
    setEmail(userData.email || "");
    setUsername(userData.username || "");
    setPhone(userData?.phone || "");
    setLinks(userData?.links || []);
    setIsEditing(false);
  };

  const hasChanges = () => {
    return (
      email !== (userData?.email || "") ||
      username !== (userData?.username || "") ||
      phone !== (userData?.phone || "") ||
      JSON.stringify(links) !== JSON.stringify(userData?.links || [])
    );
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Solo imágenes");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Máximo 5MB");
      return;
    }

    setPreview(URL.createObjectURL(file));

    try {
      const storageRef = ref(storage, `avatars/${user.uid}`);

      // subir archivo
      await uploadBytes(storageRef, file);

      // obtener URL
      const url = await getDownloadURL(storageRef);

      // guardar en firestore
      await updateDoc(doc(db, "users", user.uid), {
        avatar: url
      });

    } catch (error) {
      console.error("Error subiendo imagen:", error);
    }
  };

  const handleBannerChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Solo imágenes");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Máximo 5MB");
      return;
    }

    setBannerPreview(URL.createObjectURL(file));

    try {
      const storageRef = ref(storage, `banners/${user.uid}`);

      await uploadBytes(storageRef, file);

      const url = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "users", user.uid), {
        banner: url
      });

    } catch (error) {
      console.error("Error subiendo banner:", error);
    }
  };
  
  return (
    <Card style={{ borderRadius: "8px" }}>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <input
        type="file"
        accept="image/*"
        ref={bannerInputRef}
        style={{ display: "none" }}
        onChange={handleBannerChange}
      />
      <div className="profile-header">
        <div className="profile-banner-container">
          <div className="profile-banner" 
            style={
              bannerPreview || userData?.banner
                ? {
                    backgroundImage: `url(${bannerPreview || userData?.banner})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }
                : {
                    background: "linear-gradient(90deg, #38bdf8, #a855f7)"
                  }
            }
          />
          {isEditing && (
            <div
              className="banner-edit-icon"
              onClick={() => bannerInputRef.current.click()}
            >
              <i className="pi pi-pencil"></i>
            </div>
          )}
        </div>
        <div className="profile-avatar-wrapper">
          <Avatar
            image={preview || userData?.avatar || undefined}
            label={
              !preview && !userData?.avatar
                ? userData?.username?.charAt(0).toUpperCase()
                : null
            }
            size="xlarge"
            shape="circle"
            className="profile-avatar"
          />
          {isEditing && (
            <div className="avatar-edit-icon" onClick={() => fileInputRef.current.click()}>
              <i className="pi pi-pencil"></i>
            </div>
          )}
        </div>
      </div>
      <div className="profile-section form-row">
        <div className="form-group">
          <label>Correo</label>
          <InputText
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!isEditing}
          />
        </div>
        <div className="form-group">
          <label>NickName</label>
          <InputText
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={!isEditing}
          />
        </div>
        <div className="form-group">
          <label>Teléfono</label>
          <InputText
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={!isEditing}
          />
        </div>
      </div>
      {/* LINKS */}
      <div className="profile-section">
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
              <div className="gamer-links">
                {userData.links.map((link, index) => {
                  const platform = getPlatform(link);
                  const icon = getIcon(platform);
                  return(
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="gamer-link"
                    >
                      <img
                        src={icon}
                        alt={platform}
                        style={{ width: "20px", height: "20px" }}
                      />
                      {getLabel(platform)}
                    </a>
                  )
                })}
              </div>
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