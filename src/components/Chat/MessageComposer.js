import { useState } from "react";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";

// autoResize de PrimeReact lee el max-height del estilo inline para activar el scroll
const TEXTAREA_STYLE = { maxHeight: 140 };

export default function MessageComposer({ onSend, disabled = false }) {
  const [text, setText] = useState("");

  const canSend = !disabled && Boolean(text.trim());

  // Se limpia al instante; si el envío falla, el texto vuelve al input
  const handleSubmit = async (event) => {
    event?.preventDefault();
    if (!canSend) return;

    const value = text;
    setText("");

    try {
      await onSend(value);
    } catch {
      setText((current) => current || value);
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
      <InputTextarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escribe un mensaje…"
        aria-label="Escribe un mensaje"
        rows={1}
        autoResize
        maxLength={1000}
        style={TEXTAREA_STYLE}
        className="chat-composer__input"
        disabled={disabled}
      />
      <Button
        type="submit"
        icon="pi pi-send"
        className="chat-composer__send"
        aria-label="Enviar mensaje"
        disabled={!canSend}
      />
    </form>
  );
}
