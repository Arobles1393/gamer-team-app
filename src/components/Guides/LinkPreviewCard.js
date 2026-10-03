// Vista previa de una guía externa: imagen + título + descripción + sitio.
// large: la versión grande del detalle. Los textos vienen de otro sitio:
// React los escapa, nunca se insertan como HTML.
const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export default function LinkPreviewCard({ url, preview, large = false }) {
  const { title, description, image } = preview ?? {};

  return (
    <div className={`link-preview${large ? " link-preview--large" : ""}`}>
      {image && (
        <span className="link-preview__image">
          <img src={image} alt="" loading="lazy" referrerPolicy="no-referrer" />
        </span>
      )}
      <span className="link-preview__body">
        <span className="link-preview__host">
          <i className="pi pi-globe" aria-hidden="true" />
          {hostOf(url)}
        </span>
        {title && <span className="link-preview__title">{title}</span>}
        {description && <span className="link-preview__description">{description}</span>}
      </span>
    </div>
  );
}
