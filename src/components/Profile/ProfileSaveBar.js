import { Button } from "primereact/button";

// Barra fija al fondo mientras se edita: Guardar siempre queda a la mano
export default function ProfileSaveBar({ hasChanges, saving, onCancel, onSave }) {
  return (
    <div className="profile-savebar" role="region" aria-label="Guardar cambios del perfil">
      <span className="profile-savebar__text">
        <i
          className={`pi ${hasChanges ? "pi-circle-fill profile-savebar__dot" : "pi-info-circle"}`}
          aria-hidden="true"
        />
        {hasChanges ? "Tienes cambios sin guardar" : "Sin cambios todavía"}
      </span>

      <div className="profile-savebar__actions">
        <Button
          label="Cancelar"
          className="gm-btn gm-btn--ghost"
          onClick={onCancel}
          disabled={saving}
        />
        <Button
          label="Guardar cambios"
          icon="pi pi-check"
          className="gm-btn gm-btn--primary"
          onClick={onSave}
          loading={saving}
          disabled={!hasChanges}
        />
      </div>
    </div>
  );
}
