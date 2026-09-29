import { confirmDestructive } from "./confirmDestructive";

export const confirmDeletePost = ({ onAccept }) => {
  confirmDestructive({
    header: "Eliminar publicación",
    message: "Se eliminará la partida y ya no aparecerá en el feed. Esta acción no se puede deshacer.",
    acceptLabel: "Eliminar partida",
    onAccept
  });
};
