import { InputText } from "primereact/inputtext";
import AuthField from "./AuthField";

export default function AuthInput({ id, label, hint, ...inputProps }) {
  return (
    <AuthField id={id} label={label} hint={hint}>
      <InputText id={id} className="auth__input" {...inputProps} />
    </AuthField>
  );
}
