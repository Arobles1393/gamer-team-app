import { Button } from "primereact/button";
import { useTranslation } from "react-i18next";

// Icono y si lleva botón; los textos en chat:empty.{variante}
const STATES = {
  noChats: { icon: "pi-comments", hasAction: true },
  noGroupChats: { icon: "pi-users", hasAction: true },
  noMatch: { icon: "pi-search", hasAction: true },
  noGroupMatch: { icon: "pi-search", hasAction: true },
  error: { icon: "pi-exclamation-triangle", hasAction: true },
  noSelection: { icon: "pi-comment", hasAction: false },
  noMessages: { icon: "pi-send", hasAction: false }
};

// Variante sin borde: dentro de los paneles del chat.
// detail: búsqueda (noMatch) o nombre del otro usuario (noMessages)
export default function ChatEmptyState({ variant, detail = "", onAction }) {
  const { t } = useTranslation("chat");
  const { icon, hasAction } = STATES[variant];
  const value = detail.trim();

  const text = variant === "noMessages"
    ? (value ? t("empty.noMessages.textTo", { username: value }) : t("empty.noMessages.text"))
    : t(`empty.${variant}.text`, { search: value });

  return (
    <div className="feed-empty feed-empty--plain" role={variant === "error" ? "alert" : "status"}>
      <span className="feed-empty__icon">
        <i className={`pi ${icon}`} aria-hidden="true" />
      </span>
      <p className="feed-empty__title">{t(`empty.${variant}.title`)}</p>
      <p className="feed-empty__text">{text}</p>
      {hasAction && (
        <Button label={t(`empty.${variant}.action`)} className="feed-empty__btn" onClick={onAction} />
      )}
    </div>
  );
}
