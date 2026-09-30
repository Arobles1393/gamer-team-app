import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { ProfileSection } from "../../ProfileSection";
import "./PersonalInfo.css";

function InfoRow({ icon, label, children }) {
  return (
    <div className="personal-info__row">
      <i className={`pi ${icon} personal-info__row-icon`} aria-hidden="true" />
      <dt className="personal-info__label">{label}</dt>
      <dd className="personal-info__value">{children}</dd>
    </div>
  );
}

function Field({ id, label, hint, children }) {
  return (
    <div className="gm-field">
      <label className="gm-field__label" htmlFor={id}>{label}</label>
      {children}
      {hint && <p className="gm-field__hint">{hint}</p>}
    </div>
  );
}

const countryTemplate = (option) =>
  option ? `${option.flag} ${option.label}` : null;

export default function PersonalInfo({
  email,
  username,
  phone,
  region,
  countries,
  isEditing,
  onEmailChange,
  onUsernameChange,
  onPhoneChange,
  onRegionChange
}) {
  const country = countries.find((c) => c.value === region);
  const missing = <span className="personal-info__missing">Sin agregar</span>;

  return (
    <ProfileSection title="Datos personales" icon="pi-id-card" className="personal-info">
      {isEditing ? (
        <>
          <Field id="profile-username" label="Nickname">
            <InputText
              id="profile-username"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              autoComplete="nickname"
              className="gm-input"
            />
          </Field>

          <Field
            id="profile-email"
            label="Correo"
            hint="Si lo cambias, puede pedirte volver a iniciar sesión."
          >
            <InputText
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              autoComplete="email"
              className="gm-input"
            />
          </Field>

          <Field id="profile-phone" label="Teléfono">
            <InputText
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="55 1234 5678"
              autoComplete="tel"
              className="gm-input"
            />
          </Field>

          <Field id="profile-region" label="Región">
            <Dropdown
              inputId="profile-region"
              value={region}
              options={countries}
              onChange={(e) => onRegionChange(e.value)}
              optionLabel="label"
              optionValue="value"
              itemTemplate={countryTemplate}
              valueTemplate={(option, props) => countryTemplate(option) ?? props.placeholder}
              placeholder="Selecciona tu región"
              filter
              className="gm-select"
              panelClassName="gm-panel"
            />
          </Field>
        </>
      ) : (
        <dl className="personal-info__list">
          <InfoRow icon="pi-user" label="Nickname">{username || missing}</InfoRow>
          <InfoRow icon="pi-envelope" label="Correo">{email || missing}</InfoRow>
          <InfoRow icon="pi-phone" label="Teléfono">{phone || missing}</InfoRow>
          <InfoRow icon="pi-globe" label="Región">
            {region ? `${country?.flag ?? ""} ${region}`.trim() : missing}
          </InfoRow>
        </dl>
      )}
    </ProfileSection>
  );
}
