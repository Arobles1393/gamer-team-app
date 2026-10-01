import { useTranslation } from "react-i18next";
import { EmptyState } from "../EmptyState";

// Icono y si lleva botón; los textos en chat:empty.{variante}
const STATES = {
  noChats: { icon: "pi-comments", hasAction: true },
  noGroupChats: { icon: "pi-users", hasAction: true },
  noMatch: { icon: "pi-search", hasAction: true },
  noGroupMatch: { icon: "pi-search", hasAction: true },
  error: { icon: "pi-exclamation-triangle", hasAction: true },
  messagesError: { icon: "pi-exclamation-triangle", hasAction: true },
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
    <EmptyState
      icon={icon}
      title={t(`empty.${variant}.title`)}
      text={text}
      actionLabel={hasAction ? t(`empty.${variant}.action`) : null}
      onAction={onAction}
      alert={variant === "error" || variant === "messagesError"}
      plain
    />
  );
}
