import { Dropdown } from "primereact/dropdown";
import AuthField from "./AuthField";

export default function AuthSelect({ id, label, hint, ...dropdownProps }) {
  return (
    <AuthField id={id} label={label} hint={hint}>
      <Dropdown
        inputId={id}
        className="auth__select"
        panelClassName="auth__select-panel"
        {...dropdownProps}
      />
    </AuthField>
  );
}
