import { Button } from "primereact/button";

export default function GradientButton({ type = "submit", ...buttonProps }) {
  return (
    <Button
      type={type}
      className="auth__submit"
      {...buttonProps}
    />
  );
}
