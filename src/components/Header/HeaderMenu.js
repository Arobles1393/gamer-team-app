// Menú del avatar: solo lo que no está ya en el rail
// (Inicio, Buscar jugadores, Amigos, Chats, Noticias y Notificaciones van en el rail).
// `t`: función de traducción del componente que arma el menú
export const createHeaderMenu = (
    navigate,
    onLogout,
    t
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
  { separator: true },
  {
    label: t("actions.logout"),
    icon: "pi pi-sign-out",
    className: "gm-menu__danger",
    command: onLogout
  }
];
