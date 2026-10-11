import { useState } from "react";
import { useTranslation } from "react-i18next";
import { imageHost, isTrustedImageUrl } from "../../utils";

// Imagen de una guía que puede venir de otro sitio (portada o vista previa
// de un enlace). Si el sitio no es de confianza no se carga sola: se muestra
// "Mostrar imagen de <sitio>" y se pide al pulsarlo (ver utils/externalImages).
// autoLoad: se carga siempre (p. ej. la vista previa de quien la está creando)
export default function ExternalImage({ src, className = "", autoLoad = false }) {
  const { t } = useTranslation("guides");
  const [shown, setShown] = useState(false);

  if (!src) return null;

  if (autoLoad || shown || isTrustedImageUrl(src)) {
    return <img className={className} src={src} alt="" loading="lazy" referrerPolicy="no-referrer" />;
  }

  return (
    <button
      type="button"
      className={`guide-external-image ${className}`.trim()}
      title={t("externalImage.hint")}
      onClick={(event) => {
        // Dentro de un enlace (vista previa) no navega: solo muestra la imagen
        event.preventDefault();
        event.stopPropagation();
        setShown(true);
      }}
    >
      <i className="pi pi-image" aria-hidden="true" />
      {t("externalImage.show", { host: imageHost(src) })}
    </button>
  );
}
