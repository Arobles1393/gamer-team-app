import { useRef, useState } from "react";
import { Button } from "primereact/button";

export default function CommentInput({ onPublish }) {
  const [comment, setComment] = useState("");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handlePublish = async () => {
    await onPublish(comment, file);
    setComment("");
    setFile(null);
  };

  return (
    <div className="comment-input-card">
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Escribe algo..."
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: "none" }}
        onChange={(e) => setFile(e.target.files[0])}
      />

      <div className="comment-footer">
        <Button
          icon="pi pi-image"
          className="p-button-text upload-btn"
          onClick={() => fileInputRef.current.click()}
          tooltip="Subir imagen o video"
        />

        <Button label="Publicar" icon="pi pi-send" onClick={handlePublish} />
      </div>
    </div>
  );
}