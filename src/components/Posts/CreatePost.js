import { useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { AutoComplete } from "primereact/autocomplete";
import { Toast } from "primereact/toast";
import { Checkbox } from "primereact/checkbox";
import { useGameSearch, useCreatePost } from "../../hooks";
import { platforms } from "../../constants";

export default function CreatePost({ user, userData, onClose, editingPost }) {

  const toast = useRef(null);

  const {
    game,
    setGame,
    players,
    setPlayers,
    comments,
    setComments,
    platform,
    setPlatform,
    multiplatform,
    setMultiplatform,
    loading,
    resetForm,
    handleSubmit
  } = useCreatePost({
    user,
    userData,
    editingPost,
    onSuccess: (action) => {
      toast.current.show({
        severity: "success",
        summary: action === "actualizar"
          ? "Actualizada"
          : "Creada",
        detail: action === "actualizar"
          ? "Publicación actualizada correctamente"
          : "Publicación creada correctamente",
        life: 3000
      });

      onClose();
    },
    onError: (message) => {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: message,
        life: 3000
      });
    }
  });

  const {
    suggestions,
    handleSearch
  } = useGameSearch();

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
            onChange={(e) => {
              setMultiplatform(e.checked);

              if (e.checked) {
                setPlatform("");
              }
            }}
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
            label={editingPost ? "Actualizar" : "Publicar"}
            icon="pi pi-check"
            onClick={handleSubmit}
            loading={loading}
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