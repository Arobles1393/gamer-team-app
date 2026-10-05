import { useTranslation, Trans } from "react-i18next";
import { Link } from "react-router-dom";
import { Checkbox } from "primereact/checkbox";
import "./Legal.css";

// "He leído y acepto los Términos y la Política de privacidad" (registro,
// solo con REQUIRE_LEGAL_CONSENT). Los enlaces abren en otra pestaña para
// no perder lo escrito en el formulario.
export default function LegalConsentCheckbox({ checked, onChange }) {
  const { t } = useTranslation("legal");

  return (
    <div className="legal-consent">
      <Checkbox
        inputId="legal-consent"
        checked={checked}
        onChange={(e) => onChange(e.checked)}
        aria-describedby="legal-consent-label"
      />
      <label htmlFor="legal-consent" id="legal-consent-label">
        <Trans
          t={t}
          i18nKey="consent"
          components={{
            terms: <Link to="/terminos" target="_blank" rel="noopener noreferrer" />,
            privacy: <Link to="/privacidad" target="_blank" rel="noopener noreferrer" />
          }}
        />
      </label>
    </div>
  );
}
