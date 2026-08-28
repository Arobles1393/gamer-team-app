import "./PersonalInfo.css";

import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";

export default function PersonalInfo({
  email,
  username,
  phone,
  region,
  description,
  countries,
  isEditing,
  onEmailChange,
  onUsernameChange,
  onPhoneChange,
  onRegionChange,
  onDescriptionChange
}) {
  return (
    <section className="personal-info profile-section">
      <h4>Datos personales</h4>

      <div className="form-row">
        <div className="form-group">
          <label>Correo</label>
          <InputText
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            disabled={!isEditing}
          />
        </div>

        <div className="form-group">
          <label>NickName</label>
          <InputText
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            disabled={!isEditing}
          />
        </div>

        <div className="form-group">
          <label>Teléfono</label>
          <InputText
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            disabled={!isEditing}
          />
        </div>

        <div className="form-group">
          <label>Region</label>
          <Dropdown
            value={region}
            options={countries}
            onChange={(e) => onRegionChange(e.value)}
            optionLabel="label"
            placeholder="Selecciona tu región"
            filter
            disabled={!isEditing}
          />
        </div>
      </div>

      <div className="personal-info-description">
        <div className="form-group">
          <InputTextarea
            placeholder="Cuéntanos sobre ti..."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={3}
            autoResize
            disabled={!isEditing}
          />
        </div>
      </div>
    </section>
  );
}