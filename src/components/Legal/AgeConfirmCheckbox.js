import { useTranslation } from "react-i18next";
import { Checkbox } from "primereact/checkbox";
import "./Legal.css";

// "Tengo 18 años o más" (registro con correo; obligatoria). Con Google y
// Steam se pregunta en AgeGate al entrar por primera vez.
export default function AgeConfirmCheckbox({ checked, onChange }) {
  const { t } = useTranslation("auth");

  return (
    <div className="legal-consent">
      <Checkbox
        inputId="age-confirm"
        checked={checked}
        onChange={(e) => onChange(e.checked)}
      />
      <label htmlFor="age-confirm">{t("register.ageConfirm")}</label>
    </div>
  );
}
