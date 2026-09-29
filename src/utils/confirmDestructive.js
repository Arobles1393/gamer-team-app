import { confirmDialog } from "primereact/confirmdialog";

// Confirmación de acciones que no se pueden deshacer, con el estilo gm-confirm.
// Requiere un <ConfirmDialog /> montado en la pantalla.
export const confirmDestructive = ({
  header,
  message,
  acceptLabel = "Eliminar",
  icon = "pi pi-trash",
  onAccept
}) => {
  confirmDialog({
    header,
    message,
    icon,
    acceptLabel,
    rejectLabel: "Cancelar",
    defaultFocus: "reject",
    className: "gm-confirm",
    acceptClassName: "gm-confirm__accept",
    rejectClassName: "gm-confirm__reject",
    style: { width: "440px" },
    breakpoints: { "640px": "92vw" },
    accept: onAccept
  });
};
