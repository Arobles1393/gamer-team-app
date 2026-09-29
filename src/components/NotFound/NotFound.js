import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import "./NotFound.css";

export default function NotFound() {
  const navigate = useNavigate();

  // Sin historial (link directo) no hay a dónde regresar: se va al inicio
  const canGoBack = window.history.state?.idx > 0;

  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <div className="not-found__card">
        <span className="not-found__eyebrow">Error 404</span>

        <p className="not-found__code" aria-hidden="true">
          404
        </p>

        <h1 id="not-found-title" className="not-found__title">
          Game over: nivel no encontrado
        </h1>
        <p className="not-found__text">
          La página que buscas no existe o fue movida. Vuelve al inicio para seguir
          buscando partidas.
        </p>

        <div className="not-found__actions">
          <Button
            label="Volver al inicio"
            icon="pi pi-home"
            className="gm-btn gm-btn--primary"
            onClick={() => navigate("/")}
          />
          {canGoBack && (
            <Button
              label="Regresar"
              icon="pi pi-arrow-left"
              className="gm-btn gm-btn--ghost"
              onClick={() => navigate(-1)}
            />
          )}
        </div>
      </div>
    </section>
  );
}
