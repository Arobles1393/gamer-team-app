import { useEffect, useState } from "react";
import { updateEmail } from "firebase/auth";
import i18n from "../../i18n";
import { profileService } from "../../services/profile";

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

  useEffect(() => {
    if (!userData) return;
    if (isEditing) return;

    setEmail(userData.email || "");
    setUsername(userData.username || "");
    setPhone(userData.phone || "");
    setDescription(userData.description || "");
    setLinks(userData.links || []);
    setGames(userData.games || []);
    setRegion(userData.region || "");
  }, [userData, isEditing]);

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

      if (nextEmail !== (user.email ?? "")) {
        if (!nextEmail.includes("@")) {
          onError?.(i18n.t("profile:form.invalidEmail"));
          return;
        }

        await updateEmail(user, nextEmail);
      }

      await profileService.updateUserProfile(user.uid, {
        username: username.trim(),
        phone,
        // Los renglones vacíos no se guardan
        links: links.map((link) => link.trim()).filter(Boolean),
        description,
        games,
        region
      });

      setIsEditing(false);
      onSuccess?.(i18n.t("profile:form.updated"));
    } catch (error) {
      console.error("Error actualizando perfil:", error);

      const message =
        error.code === "auth/requires-recent-login"
          ? i18n.t("profile:form.reloginEmail")
          : i18n.t("profile:form.saveError");

      onError?.(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEmail(userData?.email || "");
    setUsername(userData?.username || "");
    setPhone(userData?.phone || "");
    setDescription(userData?.description || "");
    setLinks(userData?.links || []);
    setGames(userData?.games || []);
    setRegion(userData?.region || "");

    setIsEditing(false);
  };

  const hasChanges = () => {
    return (
      email !== (userData?.email || "") ||
      username !== (userData?.username || "") ||
      phone !== (userData?.phone || "") ||
      region !== (userData?.region || "") ||
      description !== (userData?.description || "") ||
      JSON.stringify(links) !==
        JSON.stringify(userData?.links || []) ||
      JSON.stringify(games) !==
        JSON.stringify(userData?.games || [])
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

    handleSave,
    handleCancel,
    hasChanges,
    addGame,
    removeGame
  };
}