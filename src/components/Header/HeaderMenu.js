// Menú del avatar: solo lo que no está ya en el rail
// (Inicio, Buscar jugadores, Amigos, Chats y Notificaciones van en el rail).
export const createHeaderMenu = (
    navigate,
    onLogout
) => [
  {
    label: "Mi perfil",
    icon: "pi pi-user",
    command: () => {
      navigate("/profile");
    }
  },
  {
    label: "Mis publicaciones",
    icon: "pi pi-file",
    command: () => {
      navigate("/myposts");
    }
  },
  {
    label: "Mis partidas",
    icon: "pi pi-flag",
    command: () => {
      navigate("/myparties");
    }
  },
  {
    label: "Noticias Gamer",
    icon: "pi pi-megaphone",
    command: () => {
      navigate("/news");
    }
  },
  { separator: true },
  {
    label: "Cerrar sesión",
    icon: "pi pi-sign-out",
    className: "gm-menu__danger",
    command: onLogout
  }
];
