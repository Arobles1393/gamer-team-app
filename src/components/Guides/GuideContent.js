import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { markExternalImages, sanitizeGuideHtml } from "../../utils";

// Contenido de una guía escrita: HTML sanitizado OTRA VEZ al mostrarlo (el
// documento se puede escribir saltándose la app) y con las imágenes de otros
// sitios cambiadas por "Mostrar imagen de <sitio>" hasta que se pulsan.
export default function GuideContent({ html, className = "guide-content" }) {
  const { t } = useTranslation("guides");
  const [revealed, setRevealed] = useState(() => new Set());

  const safeHtml = useMemo(
    () => markExternalImages(sanitizeGuideHtml(html), {
      revealed,
      label: (host) => t("externalImage.show", { host })
    }),
    [html, revealed, t]
  );

  // Los botones vienen dentro del HTML: un solo manejador para todos (son
  // <button>, así que Enter y Espacio también llegan aquí como click)
  const handleClick = (event) => {
    const button = event.target.closest?.(".guide-external-image");
    if (!button) return;
    const index = Number(button.dataset.index);
    setRevealed((prev) => new Set(prev).add(index));
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className={className}
      onClick={handleClick}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
