import { Password } from "primereact/password";
import AuthField from "./AuthField";

export default function PasswordInput({ id, label, hint, ...passwordProps }) {
  return (
    <AuthField id={id} label={label} hint={hint}>
      <Password
        inputId={id}
        className="auth__password"
        inputClassName="auth__input"
        placeholder="••••••••"
        feedback={false}
        toggleMask
        {...passwordProps}
      />
    </AuthField>
  );
}
