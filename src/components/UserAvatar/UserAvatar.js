import { Avatar } from "primereact/avatar";

// Avatar de usuario: muestra la foto y, si no hay o no carga, la inicial.
// no-referrer: las fotos de Google (lh3.googleusercontent.com) suelen
// responder 403 cuando la petición lleva Referer.
export default function UserAvatar({ image, username, fallback = "?", ...avatarProps }) {
  const initial = username?.trim().charAt(0).toUpperCase() || fallback;

  return (
    <Avatar
      // key: reinicia el estado de error de PrimeReact si cambia la foto
      key={image || "no-image"}
      image={image || undefined}
      label={initial}
      shape="circle"
      pt={{ image: { referrerPolicy: "no-referrer" } }}
      {...avatarProps}
    />
  );
}
