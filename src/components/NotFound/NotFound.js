import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./NotFound.css";

export default function NotFound() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Sin historial (link directo) no hay a dónde regresar: se va al inicio
  const canGoBack = window.history.state?.idx > 0;

  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <div className="not-found__card">
        <span className="not-found__eyebrow">{t("notFound.eyebrow")}</span>

        <p className="not-found__code" aria-hidden="true">
          404
        </p>

        <h1 id="not-found-title" className="not-found__title">
          {t("notFound.title")}
        </h1>
        <p className="not-found__text">
          {t("notFound.text")}
        </p>

        <div className="not-found__actions">
          <Button
            label={t("notFound.home")}
            icon="pi pi-home"
            className="gm-btn gm-btn--primary"
            onClick={() => navigate("/")}
          />
          {canGoBack && (
            <Button
              label={t("notFound.back")}
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
