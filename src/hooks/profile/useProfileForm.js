import { useEffect, useState } from "react";
import i18n from "../../i18n";
import { authService } from "../../services/auth";
import { profileService } from "../../services/profile";
import { getAuthErrorMessage } from "../../utils";
import { EMPTY_MATCH_PREFERENCES } from "../../constants";
import { useMatchProfile } from "../matching/useMatchProfile";

// Errores del cambio de correo con mensaje propio
const EMAIL_ERRORS = ["auth/email-already-in-use", "auth/invalid-email", "auth/too-many-requests"];

const getSaveErrorMessage = (error) => {
  if (error.code === "auth/requires-recent-login") return i18n.t("profile:form.reloginEmail");
  if (EMAIL_ERRORS.includes(error.code)) return getAuthErrorMessage(error);
  return i18n.t("profile:form.saveError");
};

export const useProfileForm = (user, userData, onError, onSuccess) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState([]);
  const [games, setGames] = useState([]);
  const [region, setRegion] = useState("");
  // Preferencias de juego (matchProfiles): se guardan con el resto del perfil
  const { profile: matchProfile } = useMatchProfile(user);
  const savedPreferences = matchProfile?.preferences ?? EMPTY_MATCH_PREFERENCES;
  const [preferences, setPreferences] = useState(EMPTY_MATCH_PREFERENCES);

  // El correo sale de Firebase Auth (users.email es una copia que puede ir
  // atrasada hasta que se confirma un cambio). Solo las cuentas con
  // contraseña lo cambian desde aquí.
  const savedEmail = user?.email ?? userData?.email ?? "";
  const canChangeEmail = authService.hasPasswordSignIn(user);

  useEffect(() => {
    if (!userData) return;
    if (isEditing) return;

    setEmail(savedEmail);
    setUsername(userData.username || "");
    setPhone(userData.phone || "");
    setDescription(userData.description || "");
    setLinks(userData.links || []);
    setGames(userData.games || []);
    setRegion(userData.region || "");
  }, [userData, isEditing, savedEmail]);

  useEffect(() => {
    if (!matchProfile || isEditing) return;
    setPreferences(matchProfile.preferences);
  }, [matchProfile, isEditing]);

  const isValidLink = (url) => {
    return url.startsWith("https://");
  };

  const handleSave = async () => {
    if (!username.trim()) {
      onError?.(i18n.t("profile:form.usernameRequired"));
      return;
    }

    setSaving(true);

    try {
      const invalid = links.some(
        (link) => link.trim() && !isValidLink(link.trim())
      );

      if (invalid) {
        onError?.(i18n.t("profile:form.linksHttps"));
        return;
      }

      // Las cuentas de Steam no tienen correo (user.email es null): un campo
      // vacío no es un cambio
      const nextEmail = email.trim();
      const emailChanged = canChangeEmail && nextEmail !== (user.email ?? "");

      if (emailChanged) {
        if (!nextEmail.includes("@")) {
          onError?.(i18n.t("profile:form.invalidEmail"));
          return;
        }

        // El correo no cambia todavía: llega un enlace al nuevo para confirmarlo
        await authService.requestEmailChange(user, nextEmail);
      }

      await profileService.updateUserProfile(user.uid, {
        username: username.trim(),
        phone,
        // Los renglones vacíos no se guardan
        links: links.map((link) => link.trim()).filter(Boolean),
        description,
        games,
        region,
        // Si todavía no se cargaron, matchProfiles no se toca (undefined)
        matchPreferences: matchProfile ? preferences : undefined
      });

      setIsEditing(false);
      onSuccess?.(
        emailChanged
          ? i18n.t("profile:form.emailVerificationSent", { email: nextEmail })
          : i18n.t("profile:form.updated")
      );
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      onError?.(getSaveErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEmail(savedEmail);
    setUsername(userData?.username || "");
    setPhone(userData?.phone || "");
    setDescription(userData?.description || "");
    setLinks(userData?.links || []);
    setGames(userData?.games || []);
    setRegion(userData?.region || "");
    setPreferences(savedPreferences);

    setIsEditing(false);
  };

  const hasChanges = () => {
    return (
      email !== savedEmail ||
      username !== (userData?.username || "") ||
      phone !== (userData?.phone || "") ||
      region !== (userData?.region || "") ||
      description !== (userData?.description || "") ||
      JSON.stringify(links) !==
        JSON.stringify(userData?.links || []) ||
      JSON.stringify(games) !==
        JSON.stringify(userData?.games || []) ||
      JSON.stringify(preferences) !== JSON.stringify(savedPreferences)
    );
  };

  const addGame = (game) => {
    const newGame = {
      id: game.id,
      name: game.value,
      image: game.image
    };

    setGames(prev => {
      if (prev.some(g => g.id === game.id)) {
        return prev;
      }

      return [...prev, newGame];
    });
  };

  const removeGame = (id) => {
    setGames(prev => prev.filter(game => game.id !== id));
  };

  return {
    isEditing,
    setIsEditing,
    saving,

    email,
    canChangeEmail,
    username,
    phone,
    description,
    links,
    games,
    region,
    preferences,

    setEmail,
    setUsername,
    setPhone,
    setDescription,
    setLinks,
    setRegion,
    setPreferences,

    handleSave,
    handleCancel,
    hasChanges,
    addGame,
    removeGame
  };
}