import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import "./NotFound.css";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found">
      <h1 className="not-found-code">404</h1>
      <h2 className="not-found-title">Página no encontrada</h2>
      <p className="not-found-text">
        La página que buscas no existe o fue movida.
      </p>
      <Button
        label="Volver al inicio"
        icon="pi pi-home"
        onClick={() => navigate("/")}
      />
    </div>
  );
}
