import { useTranslation } from "react-i18next";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { ProfileSection } from "../../ProfileSection";
import { getCountryLabel } from "../../../utils";
import { USERNAME_MAX } from "../../../constants";
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
  region,
  countries,
  canChangeEmail,
  isEditing,
  onEmailChange,
  onUsernameChange,
  onRegionChange
}) {
  const { t } = useTranslation("profile");
  const country = countries.find((c) => c.value === region);
  const missing = <span className="personal-info__missing">{t("personal.missing")}</span>;

  // El correo es el de Firebase Auth. Google: el de su cuenta de Google (no
  // se cambia aquí). Steam: no tiene correo, así que el campo no se muestra
  const showEmail = canChangeEmail || Boolean(email);
  const emailHint = canChangeEmail ? t("personal.emailHint") : t("personal.emailManaged");

  return (
    <ProfileSection title={t("personal.title")} icon="pi-id-card" className="personal-info">
      {isEditing ? (
        <>
          <Field id="profile-username" label={t("personal.nickname")}>
            <InputText
              id="profile-username"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              autoComplete="nickname"
              maxLength={USERNAME_MAX}
              className="gm-input"
            />
          </Field>

          {showEmail && (
            <Field
              id="profile-email"
              label={t("personal.email")}
              hint={emailHint}
            >
              <InputText
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                disabled={!canChangeEmail}
                autoComplete="email"
                className="gm-input"
              />
            </Field>
          )}

          <Field id="profile-region" label={t("personal.region")}>
            <Dropdown
              inputId="profile-region"
              value={region}
              options={countries}
              onChange={(e) => onRegionChange(e.value)}
              optionLabel="label"
              optionValue="value"
              itemTemplate={countryTemplate}
              valueTemplate={(option, props) => countryTemplate(option) ?? props.placeholder}
              placeholder={t("personal.regionPlaceholder")}
              filter
              className="gm-select"
              panelClassName="gm-panel"
            />
          </Field>
        </>
      ) : (
        <dl className="personal-info__list">
          <InfoRow icon="pi-user" label={t("personal.nickname")}>{username || missing}</InfoRow>
          {showEmail && (
            <InfoRow icon="pi-envelope" label={t("personal.email")}>{email || missing}</InfoRow>
          )}
          <InfoRow icon="pi-globe" label={t("personal.region")}>
            {region ? `${country?.flag ?? ""} ${getCountryLabel(region)}`.trim() : missing}
          </InfoRow>
        </dl>
      )}
    </ProfileSection>
  );
}
