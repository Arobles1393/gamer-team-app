import { useTranslation } from "react-i18next";
import { EmptyState } from "../EmptyState";

// Sin masa crítica (ready: false): sin mapa ni números, nunca datos
// inventados. Con un juego filtrado, ofrece volver a todos los juegos.
export default function CommunityBuildingState({ gameName, onShowAll }) {
  const { t } = useTranslation("community");

  return (
    <EmptyState
      icon="pi-globe"
      title={t("building.title")}
      text={gameName ? t("building.textGame", { game: gameName }) : t("building.text")}
      actionLabel={gameName ? t("building.showAll") : null}
      onAction={onShowAll}
    />
  );
}
