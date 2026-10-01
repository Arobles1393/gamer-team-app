import { confirmDialog } from "primereact/confirmdialog";

// Confirmación de acciones que no se pueden deshacer, con el estilo gm-confirm.
// Requiere un <ConfirmDialog /> montado en la pantalla; con `group`, uno
// con ese mismo group (p. ej. el del diálogo de perfil).
export const confirmDestructive = ({
  header,
  message,
  acceptLabel = "Eliminar",
  icon = "pi pi-trash",
  group,
  onAccept
}) => {
  confirmDialog({
    group,
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
