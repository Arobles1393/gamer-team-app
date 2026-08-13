import { confirmDialog } from "primereact/confirmdialog";

export const confirmDeletePost = ({ onAccept }) => {
  confirmDialog({
    message: "¿Seguro que quieres eliminar esta publicación?",
    header: "Advertencia",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Eliminar",
    rejectLabel: "Cancelar",
    accept: onAccept
  });
};