import { useEffect, useState, useRef } from "react";
import { db, storage } from "../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { Card } from "primereact/card";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { updateEmail } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { platformIcons } from "../utils/platformIcons";
import { getPlatform } from "../utils/getPlatform";
import { getLabel } from "../utils/getLabel"
import { InputTextarea } from "primereact/inputtextarea";
import { AutoComplete } from "primereact/autocomplete";
import { searchGames } from "../utils/searchGames";

export default function Profile({ user, userData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [links, setLinks] = useState([]);
  const [games, setGames] = useState([]);
  const [gameQuery, setGameQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
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
      setGames(userData.games || []);
      setDescription(userData.description || []);
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
        links,
        description,
        games
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error actualizando perfil:", error);
    }
  };

  const isValidLink = (url) => {
    return url.startsWith("https://");
  };

  const handleCancel = () => {
    setEmail(userData.email || "");
    setUsername(userData.username || "");
    setPhone(userData?.phone || "");
    setLinks(userData?.links || []);
    setGames(userData?.games || []);
    setDescription(userData?.description || []);
    setIsEditing(false);
  };

  const hasChanges = () => {
    return (
      email !== (userData?.email || "") ||
      username !== (userData?.username || "") ||
      phone !== (userData?.phone || "") ||
      description !== (userData?.description || "") ||
      JSON.stringify(links) !== JSON.stringify(userData?.links || []) ||
      JSON.stringify(games) !== JSON.stringify(userData?.games || [])
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

  const handleAddGame = (game) => {
    const newGame = {
      id: game.id,
      name: game.value,
      image: game.image
    };

    setGames(prev => {
      if (prev.some(g => g.id === game.id)) return prev;
      return [...prev, newGame];
    });
    setGameQuery("");
  };

  let timeout = null;

  const handleSearch = async (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      const results = await searchGames(e.query);
      setSuggestions(results);
    }, 300);
  };

  const itemTemplate = (item) => (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <img
        src={item.image}
        alt={item.label}
        style={{ width: "40px", borderRadius: "6px" }}
      />
      <span>{item.label}</span>
    </div>
  );

  const handleRemoveGame = (id) => {
    setGames(prev => prev.filter(game => game.id !== id));
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
      <div className="profile-section">
        <h4>Datos personales</h4>
        <div className="form-row">
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
      </div>
      <div className="profile-section" style={{marginTop:0}}>
        <div className="form-group">
          <InputTextarea
            placeholder="Cuentanos sobre ti..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            autoResize
            disabled={!isEditing}
          />
        </div>
      </div>
      <div className="profile-section">
        <h4>Juegos favoritos</h4>
        {isEditing ? (
          <>
            <AutoComplete
              value={gameQuery}
              suggestions={suggestions}
              completeMethod={handleSearch}
              onChange={(e) => setGameQuery(e.value)}
              onSelect={(e) => handleAddGame(e.value)}
              field="name"
              itemTemplate={itemTemplate}
              placeholder="Nombre del juego"
              style={{ flex: 1, marginBottom: "2rem" }}
            />
            {games.length > 0 ? (
              <div className="games-grid">
                {games.map((game, index) => (
                  <div key={game.id} className="game-card">
                    <img src={game.image} alt={game.name} />
                    <div className="game-card-overlay">{game.name}</div>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveGame(game.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#888" }}>No hay juegos que mostrar</p>
            )}
          </>
        ) : (
          <>
            {userData?.games?.length > 0 ? (
              <div className="games-grid">
                {userData.games.map((game, index) => (
                  <div key={game.id} className="game-card">
                    <img src={game.image} alt={game.name} />
                    <div className="game-card-overlay">{game.name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#888" }}>No hay juegos que mostrar</p>
            )}
          </>
        )}
      </div>
      {/* LINKS */}
      <div className="profile-section">
        <h4>Redes sociales</h4>
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
                  return(
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="gamer-link"
                    >
                      {platformIcons[platform]?.()}
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