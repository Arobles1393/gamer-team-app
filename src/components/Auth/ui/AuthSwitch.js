export default function AuthSwitch({ question, action, onClick }) {
  return (
    <p className="auth__switch">
      {question}{" "}
      <button type="button" onClick={onClick}>{action}</button>
    </p>
  );
}
