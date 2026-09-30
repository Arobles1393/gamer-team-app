import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";

// Aviso para perfiles sin región (p. ej. creados con Google, que no la provee)
export default function ProfileNudge() {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (dismissed) return null;

  return (
    <div className="profile-nudge" role="status">
      <i className="pi pi-map-marker profile-nudge__icon" aria-hidden="true" />
      <p className="profile-nudge__text">
        Agrega tu región para que otros jugadores sepan desde dónde juegas.
      </p>
      <Button
        label="Completar perfil"
        className="gm-btn gm-btn--ghost profile-nudge__cta"
        onClick={() => navigate("/profile")}
      />
      <Button
        icon="pi pi-times"
        text
        rounded
        className="profile-nudge__close"
        aria-label="Cerrar aviso"
        onClick={() => setDismissed(true)}
      />
    </div>
  );
}
