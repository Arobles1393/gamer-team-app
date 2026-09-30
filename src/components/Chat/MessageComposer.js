import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { OverlayPanel } from "primereact/overlaypanel";
import {
  CHAT_FILE_ACCEPT,
  MAX_MEDIA_BYTES,
  MAX_MEDIA_MB,
  formatFileSize,
  getMediaType
} from "../../utils";

// El picker pesa ~76 kB: se descarga solo al abrir el panel de emojis
const EmojiPicker = lazy(() => import("emoji-picker-react"));

// autoResize de PrimeReact lee el max-height del estilo inline para activar el scroll
const TEXTAREA_STYLE = { maxHeight: 140 };
const MAX_LENGTH = 1000;

// Vista previa del adjunto antes de enviar, con X para quitarlo
function AttachmentPreview({ file, previewUrl, uploading, onRemove }) {
  const type = getMediaType(file.type);

  return (
    <div className="chat-attachment" aria-busy={uploading}>
      {type === "image" ? (
        <img src={previewUrl} alt="" className="chat-attachment__thumb" />
      ) : (
        <span className="chat-attachment__icon" aria-hidden="true">
          <i className={`pi ${type === "video" ? "pi-video" : "pi-file"}`} />
        </span>
      )}

      <span className="chat-attachment__info">
        <span className="chat-attachment__name">{file.name}</span>
        <span className="chat-attachment__size">
          {uploading ? "Subiendo…" : formatFileSize(file.size)}
        </span>
      </span>

      <button
        type="button"
        className="chat-attachment__remove"
        aria-label="Quitar adjunto"
        disabled={uploading}
        onClick={onRemove}
      >
        <i className="pi pi-times" aria-hidden="true" />
      </button>
    </div>
  );
}

export default function MessageComposer({ onSend, onError, disabled = false }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [sending, setSending] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPanelRef = useRef(null);

  // Texto o adjunto: no hace falta ambos
  const canSend = !disabled && !sending && (Boolean(text.trim()) || Boolean(file));

  // La vista previa se libera al cambiar de archivo o al desmontar
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const attach = (selected) => {
    setFile(selected);
    setPreviewUrl(
      selected && getMediaType(selected.type) === "image"
        ? URL.createObjectURL(selected)
        : null
    );
  };

  const handleFileChange = (event) => {
    const selected = event.target.files[0];
    // Permite volver a elegir el mismo archivo después
    event.target.value = "";

    if (!selected) return;

    if (selected.size > MAX_MEDIA_BYTES) {
      onError?.(`El archivo debe pesar máximo ${MAX_MEDIA_MB} MB.`);
      return;
    }

    attach(selected);
  };

  // Inserta el emoji donde está el cursor (o reemplaza la selección)
  const handleEmojiClick = ({ emoji }) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const next = (text.slice(0, start) + emoji + text.slice(end)).slice(0, MAX_LENGTH);
    const caret = Math.min(start + emoji.length, next.length);

    setText(next);

    // Tras el render: foco de vuelta al textarea con el cursor después del emoji
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  };

  // El texto se limpia al instante; el adjunto se queda (bloqueado) hasta
  // que el envío termina. Si falla, el texto vuelve y el adjunto sigue ahí
  // para reintentar.
  const handleSubmit = async (event) => {
    event?.preventDefault();
    if (!canSend) return;

    const value = text;

    setSending(true);
    setText("");

    try {
      await onSend(value, file);
      attach(null);
    } catch {
      setText((current) => current || value);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    // Enter envía, Shift+Enter hace salto de línea
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      handleSubmit(event);
    }
  };

  return (
    <form className="chat-composer" onSubmit={handleSubmit}>
      {file && (
        <AttachmentPreview
          file={file}
          previewUrl={previewUrl}
          uploading={sending}
          onRemove={() => attach(null)}
        />
      )}

      <div className="chat-composer__row">
        <input
          ref={fileInputRef}
          type="file"
          accept={CHAT_FILE_ACCEPT}
          hidden
          onChange={handleFileChange}
        />

        <Button
          type="button"
          icon="pi pi-paperclip"
          className="chat-composer__tool"
          aria-label="Adjuntar archivo"
          disabled={disabled || sending}
          onClick={() => fileInputRef.current?.click()}
        />

        <Button
          type="button"
          icon="pi pi-face-smile"
          className="chat-composer__tool"
          aria-label="Insertar emoji"
          aria-haspopup="dialog"
          disabled={disabled}
          onClick={(e) => emojiPanelRef.current?.toggle(e)}
        />

        <InputTextarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje…"
          aria-label="Escribe un mensaje"
          rows={1}
          autoResize
          maxLength={MAX_LENGTH}
          style={TEXTAREA_STYLE}
          className="chat-composer__input"
          disabled={disabled}
        />

        <Button
          type="submit"
          icon={sending ? "pi pi-spin pi-spinner" : "pi pi-send"}
          className="chat-composer__send"
          aria-label="Enviar mensaje"
          disabled={!canSend}
        />
      </div>

      <OverlayPanel ref={emojiPanelRef} className="chat-emoji-panel">
        <Suspense fallback={<div className="chat-emoji-panel__loading"><i className="pi pi-spin pi-spinner" /></div>}>
          <EmojiPicker
            theme="dark"
            // Emojis nativos del sistema: no descarga imágenes de un CDN
            emojiStyle="native"
            lazyLoadEmojis
            searchPlaceholder="Buscar emoji"
            previewConfig={{ showPreview: false }}
            width={320}
            height={380}
            onEmojiClick={handleEmojiClick}
          />
        </Suspense>
      </OverlayPanel>
    </form>
  );
}
