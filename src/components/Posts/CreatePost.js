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
import "./CreatePost.css";

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
    <div className="create-post__div-itemTemplate">
      <img
        src={item.image}
        alt={item.label}
        className="create-post__itemTemplate-image"
      />
      <span>{item.label}</span>
    </div>
  );

  const cancel = () => {
    resetForm();
    onClose();
  }

  return (
    <Card className="create-post">
      <div className="create-post__header">
        <p className="create-post__description-text">
          ¿Buscas equipo? Publica una partida y encuentra jugadores rapidamente.
        </p>
      </div>
      <div className="p-fluid create-post__div-inputs">
        {/* Inputs en fila */}
        <div className="create-post__inputs">
          <AutoComplete
            value={game}
            suggestions={suggestions}
            completeMethod={handleSearch}
            onChange={(e) => setGame(e.value)}
            field="value"
            itemTemplate={itemTemplate}
            placeholder="Nombre del juego"
            className="create-post__autocomplete"
          />
          <Checkbox
            inputId="multiplatform"
            checked={multiplatform}
            className="create-post__multiplatform"
            onChange={(e) => {
              setMultiplatform(e.checked);

              if (e.checked) {
                setPlatform("");
              }
            }}
          />
          <label htmlFor="multiplatform" className="create-post__multiplatform">
            Multiplataforma
          </label>
          {!multiplatform && (
            <Dropdown
              value={platform}
              options={platforms}
              onChange={(e) => setPlatform(e.value)}
              placeholder="Selecciona plataforma"
              className="create-post__platform"
            />
          )}
          <InputText
            placeholder="Cant. jugadores"
            value={players}
            onChange={(e) => setPlayers(e.target.value)}
            className="create-post__players"
          />
        </div>
        {/* Descripción */}
        <InputTextarea
          placeholder="Describe tu partida..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={3}
          autoResize
          className="create-post__description"
        />
        {/* Botones */}
        <div className="create-post__actions">
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