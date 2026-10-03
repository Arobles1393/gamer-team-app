// Menú del avatar: solo lo que no está ya en el rail
// (Inicio, Buscar jugadores, Amigos, Chats, Noticias y Notificaciones van en el rail).
// `t`: función de traducción del componente que arma el menú
// `adminPending`: { reports, guides } por revisar; null si la cuenta no es admin
const withCount = (t, label, count) => (count > 0 ? t("nav.withCount", { label, count }) : label);

export const createHeaderMenu = (
    navigate,
    onLogout,
    t,
    adminPending = null
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
  {
    label: t("actions.logout"),
    icon: "pi pi-sign-out",
    className: "gm-menu__danger",
    command: onLogout
  }
];
