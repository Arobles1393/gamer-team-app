// Menú del avatar: solo lo que no está ya en el rail
// (Inicio, Buscar jugadores, Amigos, Chats, Guías, Noticias y Notificaciones van en el rail).
// `t`: función de traducción del componente que arma el menú
// `adminPending`: { reports, guides } por revisar; null si la cuenta no es admin
// "Apoyar el proyecto" solo aparece si REACT_APP_SUPPORT_URL es válida
import { getSupportUrl } from "../../utils/supportUrl";

const withCount = (t, label, count) => (count > 0 ? t("nav.withCount", { label, count }) : label);

export const createHeaderMenu = (
    navigate,
    onLogout,
    t,
    adminPending = null,
    onOpenGuide = null
) => [
  {
    label: t("nav.myProfile"),
    icon: "pi pi-user",
    command: () => {
      navigate("/profile");
    }
  },
  {
    label: t("nav.myPosts"),
    icon: "pi pi-file",
    command: () => {
      navigate("/myposts");
    }
  },
  {
    label: t("nav.myParties"),
    icon: "pi pi-flag",
    command: () => {
      navigate("/myparties");
    }
  },
  // Aquí y no en el rail, para no saturarlo
  {
    label: t("nav.community"),
    icon: "pi pi-globe",
    command: () => {
      navigate("/comunidad");
    }
  },
  ...(adminPending
    ? [
        { separator: true },
        {
          label: t("nav.admin"),
          className: "gm-menu__group",
          items: [
            {
              label: withCount(t, t("nav.adminReports"), adminPending.reports),
              icon: "pi pi-flag-fill",
              command: () => {
                navigate("/admin/reports");
              }
            },
            {
              label: withCount(t, t("nav.adminGuides"), adminPending.guides),
              icon: "pi pi-book",
              command: () => {
                navigate("/admin/guides");
              }
            }
          ]
        }
      ]
    : []),
  { separator: true },
  ...(onOpenGuide
    ? [{
        label: t("nav.guide"),
        icon: "pi pi-question-circle",
        command: onOpenGuide
      }]
    : []),
  ...(getSupportUrl()
    ? [{
        label: t("support:menu"),
        icon: "pi pi-heart",
        // Pestaña nueva sin acceso a esta ventana ni Referer
        command: () => window.open(getSupportUrl(), "_blank", "noopener,noreferrer")
      }]
    : []),
  {
    label: t("nav.privacy"),
    icon: "pi pi-shield",
    command: () => {
      navigate("/privacidad");
    }
  },
  {
    label: t("nav.terms"),
    icon: "pi pi-file",
    command: () => {
      navigate("/terminos");
    }
  },
  {
    label: t("credits:menu"),
    icon: "pi pi-info-circle",
    command: () => {
      navigate("/creditos");
    }
  },
  { separator: true },
  {
    label: t("actions.logout"),
    icon: "pi pi-sign-out",
    className: "gm-menu__danger",
    command: onLogout
  }
];
