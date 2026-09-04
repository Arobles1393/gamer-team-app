import { useEffect, useState, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import ProfileHeader from "../ProfileHeader/ProfileHeader";
import FavoriteGames from "../FavoriteGames/FavoriteGames";
import SocialLinks from "../SocialLinks/SocialLinks";
import PersonalInfo from "./PersonalInfo/PersonalInfo";
import { profileImageService } from "../../services/profile";
import { useProfileForm, useGameSearch } from "../../hooks";
import { countries } from "../../data/countries";

export default function Profile({ user, userData }) {
  const [gameQuery, setGameQuery] = useState("");
  const [preview, setPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const bannerInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const {
    isEditing,
    setIsEditing,
    email,
    username,
    phone,
    description,
    links,
    games,
    region,
    setEmail,
    setUsername,
    setPhone,
    setDescription,
    setLinks,
    setRegion,
    addGame,
    removeGame,
    handleSave,
    handleCancel,
    hasChanges
  } = useProfileForm(user, userData);

  const {
    suggestions,
    handleSearch
  } = useGameSearch();

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
      await profileImageService.uploadProfileImage(
        user.uid,
        file,
        "avatar"
      );
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
      await profileImageService.uploadProfileImage(
        user.uid,
        file,
        "banner"
      );
    } catch (error) {
      console.error("Error subiendo banner:", error);
    }
  };

  const handleAddGame = (game) => {
    addGame(game);
    setGameQuery("");
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
      <ProfileHeader
        userData={userData}
        isEditing={isEditing}
        avatarPreview={preview}
        bannerPreview={bannerPreview}
        onAvatarEdit={() => fileInputRef.current.click()}
        onBannerEdit={() => bannerInputRef.current.click()}
        showUsername={false}
      />
      <PersonalInfo
        email={email}
        username={username}
        phone={phone}
        region={region}
        description={description}
        countries={countries}
        isEditing={isEditing}
        onEmailChange={setEmail}
        onUsernameChange={setUsername}
        onPhoneChange={setPhone}
        onRegionChange={setRegion}
        onDescriptionChange={setDescription}
      />
      <FavoriteGames
        games={games}
        isEditing={isEditing}
        gameQuery={gameQuery}
        suggestions={suggestions}
        onSearch={handleSearch}
        onGameQueryChange={setGameQuery}
        onAddGame={handleAddGame}
        onRemoveGame={removeGame}
      />
      <SocialLinks
        links={links}
        isEditing={isEditing}
        onLinksChange={setLinks}
      />
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