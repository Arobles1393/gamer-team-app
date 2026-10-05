import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
import LanguageSection from "./LanguageSection";
import DangerZone from "./DangerZone";
import { LegalLinks } from "../Legal";
import { MyGuides } from "../Guides";
import { MatchPreferences, MATCH_PREFERENCES_ID } from "../Matching";
import { useLocation, useNavigate } from "react-router-dom";
import { useProfileForm, useGameSearch, useProfileImages } from "../../hooks";
import { countries } from "../../data/countries";
import { getCountryOptions } from "../../utils";
import { useCurrentUser, useCurrentUserData } from "../../context";
import "./Profile.css";

function ProfileSkeleton() {
  const { t } = useTranslation("profile");

  return (
    <div className="profile-page" aria-busy="true" aria-label={t("page.loading")}>
      <Skeleton height="220px" borderRadius="16px" className="profile-skeleton" />
      <div className="profile-page__grid">
        <Skeleton height="260px" borderRadius="16px" className="profile-skeleton" />
        <Skeleton height="260px" borderRadius="16px" className="profile-skeleton" />
      </div>
    </div>
  );
}

export default function Profile() {
  const { t, i18n } = useTranslation("profile");
  const user = useCurrentUser();
  const userData = useCurrentUserData();
  const [gameQuery, setGameQuery] = useState("");
  const bannerInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const toast = useRef(null);

  const showError = useCallback((detail) => {
    toast.current?.show({ severity: "error", summary: t("common:status.error"), detail, life: 3000 });
  }, [t]);

  const showSuccess = useCallback((detail) => {
    toast.current?.show({ severity: "success", summary: t("common:status.done"), detail, life: 2500 });
  }, [t]);

  const {
    isEditing,
    setIsEditing,
    saving,
    email,
    canChangeEmail,
    username,
    description,
    links,
    games,
    region,
    preferences,
    setEmail,
    setUsername,
    setDescription,
    setLinks,
    setRegion,
    setPreferences,
    addGame,
    removeGame,
    handleSave,
    handleCancel,
    hasChanges
  } = useProfileForm(user, userData, showError, showSuccess);

  const { suggestions, handleSearch } = useGameSearch();

  // Desde "Compatibles contigo": entra en modo edición y baja a las
  // preferencias. El state se limpia para que recargar no lo repita.
  const location = useLocation();
  const navigate = useNavigate();
  const editPreferences = Boolean(location.state?.editPreferences);
  const hasUserData = Boolean(userData);

  const openPreferences = useCallback(() => {
    setIsEditing(true);
    requestAnimationFrame(() => {
      document.getElementById(MATCH_PREFERENCES_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [setIsEditing]);

  useEffect(() => {
    if (!editPreferences || !hasUserData) return;
    openPreferences();
    navigate(location.pathname, { replace: true, state: null });
  }, [editPreferences, hasUserData, openPreferences, navigate, location.pathname]);

  // Nombres de países en el idioma actual
  const countryOptions = useMemo(
    () => getCountryOptions(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.resolvedLanguage]
  );

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
        eyebrow={t("page.eyebrow")}
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
              {t("page.editing")}
            </span>
          ) : (
            <Button
              label={t("page.edit")}
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
            emptyText={t("page.emptyGames")}
            onEmptyAction={() => setIsEditing(true)}
          />
          <MatchPreferences
            preferences={preferences}
            isEditing={isEditing}
            onChange={setPreferences}
            onConfigure={openPreferences}
          />
          <MyGuides user={user} />
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
            region={region}
            countries={countryOptions}
            canChangeEmail={canChangeEmail}
            isEditing={isEditing}
            onEmailChange={setEmail}
            onUsernameChange={setUsername}
            onRegionChange={setRegion}
          />
          <SocialLinks
            links={links}
            isEditing={isEditing}
            onLinksChange={setLinks}
            emptyText={t("page.emptyLinks")}
          />
          {/* Fuera del modo edición: el idioma se aplica y guarda al momento */}
          <LanguageSection user={user} onError={showError} />
          {/* Solo aparece si bloqueaste a alguien */}
          <BlockedUsers user={user} onError={showError} />
        </div>
      </div>

      <DangerZone user={user} username={userData.username} onError={showError} />

      <LegalLinks className="profile-page__legal" />

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
