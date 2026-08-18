import { useState, useEffect, useRef } from "react";
import { functions } from "../../firebase/config";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { AutoComplete } from "primereact/autocomplete";
import { Toast } from "primereact/toast";
import { httpsCallable } from "firebase/functions";
import { Checkbox } from "primereact/checkbox";
import { postService } from "../../services/posts";
import { useGameSearch } from "../../hooks";

export default function CreatePost({ user, userData, onClose, editingPost }) {
  const [game, setGame] = useState({});
  const [players, setPlayers] = useState("");
  const [comments, setComments] = useState("");
  const [platform, setPlatform] = useState("");
  const [multiplatform, setMultiplatform] = useState(false);
  const toast = useRef(null);
  const platforms = [
    { label: "PlayStation", value: "playstation" },
    { label: "Xbox", value: "xbox" },
    { label: "Switch", value: "switch" },
    { label: "PC", value: "pc" },
    { label: "Mobile", value: "mobile" },
    { label: "Wii", value: "wii" }
  ];
  const getGameLogo = httpsCallable(
    functions,
    "getGameLogo"
  );
  const getGamePortada = httpsCallable(
    functions,
    "getGamePortada"
  );

  const {
    suggestions,
    handleSearch
  } = useGameSearch();

  useEffect(() => {
    if (editingPost) {
      setGame(editingPost.game || "");
      setPlatform(editingPost.platform || "");
      setPlayers(editingPost.playersNeeded || "");
      setComments(editingPost.comments || "");
      setMultiplatform(editingPost.multiplatform)
    }
  }, [editingPost]);

  const resetForm = () => {
    setGame({});
    setPlayers("");
    setComments("");
    setPlatform("");
    setMultiplatform(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const state = editingPost ? "actualizar" : "guardar";

    try {
      if (
        !game ||
        !players ||
        !comments?.trim() ||
        (!multiplatform && !platform)
      ) {
        alert("Completa todos los campos");
        return;
      }

      const gameName = game.value ?? game;

      const media = await postService.getExistingMedia(gameName);

      let image = media.image;
      let clip = media.clip;
      let logo = media.logo;
      let portada = media.portada;

      if (!image) {
        image = game.image ?? editingPost?.image ?? null;
      }

      if (!clip) {
        clip = game.clip ?? editingPost?.clip ?? null;
      }

      if (!logo) {
        const result = await getGameLogo({
          steamAppId: game.steamAppId ?? editingPost?.steamAppId,
          gameName
        });

        logo = result?.data?.logo ?? null;
      }

      if (!portada) {
        const result = await getGamePortada({
          steamAppId: game.steamAppId ?? editingPost?.steamAppId,
          gameName
        });

        portada = result?.data?.portada ?? null;
      }

      const postData = {
        game: gameName,
        platform,
        playersNeeded: players,
        comments,
        image,
        logo: logo ?? editingPost?.logo ?? null,
        clip,
        portada: portada ?? editingPost?.portada ?? null,
        platforms: game.platforms ?? editingPost?.platforms ?? null,
        multiplatform
      };

      if (editingPost) {

        await postService.updatePost(
          editingPost.id,
          postData
        );

        toast.current.show({
          severity: "success",
          summary: "Actualizada",
          detail: "Publicación actualizada correctamente",
          life: 3000
        });

      } else {

        await postService.createPost({
          ...postData,
          userId: user.uid,
          username: userData?.username,
          region: userData?.region,
          phone: userData?.phone,
          createdAt: new Date()
        });

        toast.current.show({
          severity: "success",
          summary: "Creada",
          detail: "Publicación creada correctamente",
          life: 3000
        });
      }

      resetForm();
      onClose();

    } catch (error) {

      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: `No se pudo ${state} la publicación`,
        life: 3000
      });

      console.error("Error:", error);
    }
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

  const cancel = () => {
    resetForm();
    onClose();
  }

  return (
    <Card style={{ marginTop: "1.2rem", borderRadius: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ marginTop: -15, color: "#666", textAlign:"center" }}>
              ¿Buscas equipo? Publica una partida y encuentra jugadores rapidamente.
            </p>
      </div>
      <div className="p-fluid" style={{ marginTop: "1rem" }}>
        {/* Inputs en fila */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <AutoComplete
            value={game}
            suggestions={suggestions}
            completeMethod={handleSearch}
            onChange={(e) => setGame(e.value)}
            field="value"
            itemTemplate={itemTemplate}
            placeholder="Nombre del juego"
            style={{ flex: 1 }}
          />
          <Checkbox
            inputId="multiplatform"
            checked={multiplatform}
            style={{position: "relative", top: "10px"}}
            onChange={(e) => setMultiplatform(e.checked)}
          />
          <label htmlFor="multiplatform" style={{position: "relative", top: "10px"}}>
            Multiplataforma
          </label>
          {!multiplatform && (
            <Dropdown
              value={platform}
              options={platforms}
              onChange={(e) => setPlatform(e.value)}
              placeholder="Selecciona plataforma"
              style={{ width: "200px" }}
            />
          )}
          <InputText
            placeholder="Cant. jugadores"
            value={players}
            onChange={(e) => setPlayers(e.target.value)}
            style={{ width: "120px" }}
          />
        </div>
        {/* Descripción */}
        <InputTextarea
          placeholder="Describe tu partida..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={3}
          autoResize
          style={{ marginBottom: "1rem" }}
        />
        {/* Botones */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            label="Publicar"
            icon="pi pi-check"
            onClick={handleSubmit}
            className="p-button-success"
          />
          <Button
            label="Cancelar"
            className="p-button-text"
            onClick={cancel}
          />
        </div>
      </div>
      <Toast ref={toast} />
    </Card>
  );
}