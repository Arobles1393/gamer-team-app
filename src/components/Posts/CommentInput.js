import { useEffect, useRef, useState } from "react";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";

const MAX_LENGTH = 500;
// Mismo límite que storage.rules para comments/{userId}
const MAX_FILE_MB = 20;

export default function CommentInput({ currentUser, onPublish, onError }) {
  const [comment, setComment] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const fileInputRef = useRef(null);

  const canPublish = Boolean(comment.trim()) && !publishing;
  const isVideo = file?.type.startsWith("video/");

  // La vista previa se libera al cambiar de archivo o al desmontar
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
  };

  const handleFileChange = (event) => {
    const selected = event.target.files[0];
    // Permite volver a elegir el mismo archivo después
    event.target.value = "";

    if (!selected) return;

    if (!selected.type.startsWith("image/") && !selected.type.startsWith("video/")) {
      onError?.("Solo puedes adjuntar imágenes o videos.");
      return;
    }

    if (selected.size > MAX_FILE_MB * 1024 * 1024) {
      onError?.(`El archivo debe pesar máximo ${MAX_FILE_MB} MB.`);
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handlePublish = async () => {
    if (!canPublish) return;

    setPublishing(true);

    try {
      const success = await onPublish(comment, file);

      if (success) {
        setComment("");
        clearFile();
      }
    } finally {
      setPublishing(false);
    }
  };

  const handleKeyDown = (event) => {
    // Ctrl/Cmd + Enter publica
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handlePublish();
    }
  };

  const initial = currentUser?.username?.charAt(0).toUpperCase() || "?";

  return (
    <div className="comment-composer">
      <Avatar
        image={currentUser?.avatar}
        label={currentUser?.avatar ? undefined : initial}
        shape="circle"
        className="comment-composer__avatar"
      />

      <div className="comment-composer__body">
        <InputTextarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un comentario… ¿a qué hora juegan?"
          aria-label="Escribe un comentario"
          rows={2}
          autoResize
          maxLength={MAX_LENGTH}
          className="gm-input"
          disabled={publishing}
        />

        {file && (
          <div className="comment-composer__attachment">
            {isVideo ? (
              <video src={previewUrl} muted className="comment-composer__preview" />
            ) : (
              <img src={previewUrl} alt="" className="comment-composer__preview" />
            )}
            <span className="comment-composer__file">
              <i className={`pi ${isVideo ? "pi-video" : "pi-image"}`} aria-hidden="true" />
              <span className="comment-composer__file-name">{file.name}</span>
            </span>
            <button
              type="button"
              className="comment-composer__remove"
              aria-label="Quitar archivo adjunto"
              onClick={clearFile}
              disabled={publishing}
            >
              <i className="pi pi-times" aria-hidden="true" />
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          hidden
          onChange={handleFileChange}
        />

        <div className="comment-composer__footer">
          <button
            type="button"
            className="comment-composer__attach"
            onClick={() => fileInputRef.current?.click()}
            disabled={publishing}
          >
            <i className="pi pi-image" aria-hidden="true" />
            <span>Imagen o video</span>
          </button>

          <span className="comment-composer__counter">
            {comment.length}/{MAX_LENGTH}
          </span>

          <Button
            label={publishing ? "Publicando…" : "Comentar"}
            icon="pi pi-send"
            className="gm-btn gm-btn--primary"
            loading={publishing}
            disabled={!canPublish}
            onClick={handlePublish}
          />
        </div>
      </div>
    </div>
  );
}
