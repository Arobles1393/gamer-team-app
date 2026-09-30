export default function AuthField({ id, label, hint, children }) {
  return (
    <div className="auth__field">
      <label className="auth__label" htmlFor={id}>
        {label}
        {hint && <span className="auth__label-hint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
