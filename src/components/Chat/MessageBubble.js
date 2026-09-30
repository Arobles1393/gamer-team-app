import { formatFileSize } from "../../utils";

// Adjunto de un mensaje según mediaType
function MessageMedia({ mediaUrl, mediaType, fileName, fileSize }) {
  if (mediaType === "image") {
    return (
      <a
        href={mediaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="chat-media chat-media--image"
        aria-label="Abrir imagen en una pestaña nueva"
      >
        <img src={mediaUrl} alt={fileName || "Imagen"} loading="lazy" />
      </a>
    );
  }

  if (mediaType === "video") {
    return (
      <video
        src={mediaUrl}
        controls
        preload="metadata"
        className="chat-media chat-media--video"
      />
    );
  }

  return (
    <a
      href={mediaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="chat-file"
      download={fileName}
    >
      <span className="chat-file__icon" aria-hidden="true">
        <i className="pi pi-file" />
      </span>
      <span className="chat-file__info">
        <span className="chat-file__name">{fileName || "Archivo"}</span>
        <span className="chat-file__size">{formatFileSize(fileSize)}</span>
      </span>
      <i className="pi pi-download chat-file__action" aria-hidden="true" />
    </a>
  );
}

// Burbuja de un mensaje: texto, adjunto o ambos
export default function MessageBubble({ message }) {
  const hasMedia = Boolean(message.mediaUrl);

  if (!hasMedia) {
    return <p className="chat-bubble">{message.text}</p>;
  }

  return (
    <div className={`chat-bubble chat-bubble--media${message.text ? "" : " chat-bubble--media-only"}`}>
      <MessageMedia {...message} />
      {message.text && <p className="chat-bubble__text">{message.text}</p>}
    </div>
  );
}
