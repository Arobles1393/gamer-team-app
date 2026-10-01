import { useCallback, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";
import { Toast } from "primereact/toast";
import { ProfileHero } from "../ProfileHero";
import { FavoriteGames } from "../FavoriteGames";
import { SocialLinks } from "../SocialLinks";
import { SteamSection } from "../Steam";
import PersonalInfo from "./PersonalInfo/PersonalInfo";
import ProfileAbout from "./ProfileAbout";
import ProfileSaveBar from "./ProfileSaveBar";
import BlockedUsers from "./BlockedUsers";
import { useProfileForm, useGameSearch, useProfileImages } from "../../hooks";
import { countries } from "../../data/countries";
import { useCurrentUser, useCurrentUserData } from "../../context";
import "./Profile.css";

function ProfileSkeleton() {
  return (
    <div className="profile-page" aria-busy="true" aria-label="Cargando perfil">
      <Skeleton height="220px" borderRadius="16px" className="profile-skeleton" />
      <div className="profile-page__grid">
        <Skeleton height="260px" borderRadius="16px" className="profile-skeleton" />
        <Skeleton height="260px" borderRadius="16px" className="profile-skeleton" />
      </div>
    </div>
  );
}

export default function Profile() {
  const user = useCurrentUser();
  const userData = useCurrentUserData();
  const [gameQuery, setGameQuery] = useState("");
  const bannerInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const toast = useRef(null);

  const showError = useCallback((detail) => {
    toast.current?.show({ severity: "error", summary: "Error", detail, life: 3000 });
  }, []);

  const showSuccess = useCallback((detail) => {
    toast.current?.show({ severity: "success", summary: "Listo", detail, life: 2500 });
  }, []);

  const {
    isEditing,
    setIsEditing,
    saving,
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
  } = useProfileForm(user, userData, showError, showSuccess);

  const { suggestions, handleSearch } = useGameSearch();

  const { preview, bannerPreview, uploading, handleImageChange } = useProfileImages(
    user,
    showError,
    showSuccess
  );

  const handleAddGame = (game) => {
    addGame(game);
    setGameQuery("");
  };

  const handleCancelEdit = () => {
    handleCancel();
    setGameQuery("");
  };

  if (!userData) {
    return <ProfileSkeleton />;
  }

  const country = countries.find((c) => c.value === userData.region);

  return (
    <div className={`profile-page${isEditing ? " profile-page--editing" : ""}`}>
      <input
        type="file"
        accept="image/*"
        ref={avatarInputRef}
        hidden
        onChange={(e) => handleImageChange(e, "avatar")}
      />
      <input
        type="file"
        accept="image/*"
        ref={bannerInputRef}
        hidden
        onChange={(e) => handleImageChange(e, "banner")}
      />

      <ProfileHero
        userData={userData}
        country={country}
        eyebrow="Mi perfil"
        editable
        avatarPreview={preview}
        bannerPreview={bannerPreview}
        uploading={uploading}
        onAvatarEdit={() => avatarInputRef.current?.click()}
        onBannerEdit={() => bannerInputRef.current?.click()}
        actions={
          isEditing ? (
            <span className="profile-hero__editing">
              <i className="pi pi-pencil" aria-hidden="true" />
              Editando perfil
            </span>
          ) : (
            <Button
              label="Editar perfil"
              icon="pi pi-pencil"
              className="gm-btn gm-btn--primary profile-hero__edit"
              onClick={() => setIsEditing(true)}
            />
          )
        }
      />

      <div className="profile-page__grid">
        <div className="profile-page__column">
          <ProfileAbout
            description={description}
            isEditing={isEditing}
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
            emptyText="Aún no agregas juegos favoritos."
            onEmptyAction={() => setIsEditing(true)}
          />
          {/* Usa los links guardados, no los que se están editando */}
          <SteamSection
            links={userData.links}
            isOwnProfile
            onConnect={() => setIsEditing(true)}
          />
        </div>

        <div className="profile-page__column">
          <PersonalInfo
            email={email}
            username={username}
            phone={phone}
            region={region}
            countries={countries}
            isEditing={isEditing}
            onEmailChange={setEmail}
            onUsernameChange={setUsername}
            onPhoneChange={setPhone}
            onRegionChange={setRegion}
          />
          <SocialLinks
            links={links}
            isEditing={isEditing}
            onLinksChange={setLinks}
            emptyText="Aún no agregas tus redes."
          />
          {/* Solo aparece si bloqueaste a alguien */}
          <BlockedUsers user={user} onError={showError} />
        </div>
      </div>

      {isEditing && (
        <ProfileSaveBar
          hasChanges={hasChanges()}
          saving={saving}
          onCancel={handleCancelEdit}
          onSave={handleSave}
        />
      )}

      <Toast ref={toast} />
    </div>
  );
}
