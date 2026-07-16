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
		icon: "pi pi-users",
		command: () => {
			navigate("/mypartys");
		}
	},
	{
		label: "Chats",
		icon: "pi pi-comments",
		command: () => {
			navigate("/chat");
		}
	},
	{
		label: "Amigos",
		icon: "pi pi-comments",
		command: () => {
			navigate("/friends");
		}
	},
	{
		label: "Buscar jugadores",
		icon: "pi pi-comments",
		command: () => {
			navigate("/findPlayers");
		}
	},
	{
		label: "Noticias Gamer",
		icon: "pi pi-megaphone",
		command: () => {
			navigate("/news");
		}
	},
	/*{ separator: true },
	{
		label: "Configuración",
		icon: "pi pi-cog"
	},*/
	{ separator: true },
	{
		label: "Cerrar sesión",
		icon: "pi pi-sign-out",
		command: onLogout
	}
];