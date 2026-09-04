import { useEffect, useState } from "react";
import { updateEmail } from "firebase/auth";
import { profileService } from "../services/profile";

export const useProfileForm = (user, userData) => {
  const [isEditing, setIsEditing] = useState(false);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState([]);
  const [games, setGames] = useState([]);
  const [region, setRegion] = useState("");

  useEffect(() => {
    if (!userData) return;

    setEmail(userData.email || "");
    setUsername(userData.username || "");
    setPhone(userData.phone || "");
    setDescription(userData.description || "");
    setLinks(userData.links || []);
    setGames(userData.games || []);
    setRegion(userData.region || "");
  }, [userData]);

  const isValidLink = (url) => {
    return url.startsWith("https://");
  };

  const handleSave = async () => {
    try {
      const invalid = links.some(
        (link) => link && !isValidLink(link)
      );

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

      await profileService.updateUserProfile(user.uid, {
        username,
        phone,
        links,
        description,
        games,
        region
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Error actualizando perfil:", error);
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