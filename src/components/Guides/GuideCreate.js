import { lazy, Suspense, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { GameSelect } from "../GameSelect";
import { useCreateGuide, useLinkPreview } from "../../hooks";
import { GUIDE_IMAGE_TYPES } from "../../services/guides";
import { useCurrentUser } from "../../context";
import { isSafeImageUrl } from "../../utils";
import YoutubeEmbed from "./YoutubeEmbed";
import LinkPreviewCard from "./LinkPreviewCard";
import "./Guides.css";

// TipTap pesa bastante: se descarga solo al escribir una guía
const RichTextEditor = lazy(() => import("./RichTextEditor"));

const TYPES = [
  { value: "original", labelKey: "create.typeOriginal", icon: "pi-pencil" },
  { value: "external", labelKey: "create.typeExternal", icon: "pi-link" }
];

function Field({ id, label, optional, error, hint, children }) {
  return (
    <div className="gm-field guide-form__field">
      <label className="gm-field__label" id={`${id}-label`} htmlFor={id}>
        {label}
        {optional && <span className="gm-field__hint"> {optional}</span>}
      </label>
      {children}
      {hint && !error && <p className="gm-field__hint">{hint}</p>}
      {error && <p className="gm-field__error" role="alert">{error}</p>}
    </div>
  );
}

// Portada: subir (Storage) o pegar una URL https
function CoverPicker({ value, onChange, onUpload, onError }) {
  const { t } = useTranslation("guides");
  const fileInput = useRef(null);
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  if (value) {
    return (
      <div className="guide-cover">
        <img src={value} alt="" referrerPolicy="no-referrer" />
        <Button
          type="button"
          icon="pi pi-times"
          className="gm-btn gm-btn--icon guide-cover__remove"
          aria-label={t("create.coverRemove")}
          onClick={() => onChange(null)}
        />
      </div>
    );
  }

  const handleFile = async (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;

    if (!GUIDE_IMAGE_TYPES.includes(file.type) || file.size >= 5 * 1024 * 1024) {
      onError(t("create.errors.imageType"));
      return;
    }

    setUploading(true);
    try {
      onChange(await onUpload(file));
    } catch (error) {
      console.error("Error subiendo la portada:", error);
      onError(t("create.errors.image"));
    } finally {
      setUploading(false);
    }
  };

  const applyUrl = () => {
    if (!isSafeImageUrl(url.trim())) {
      onError(t("create.errors.imageUrl"));
      return;
    }
    onChange(url.trim());
    setUrl("");
  };

  return (
    <div className="guide-cover-picker">
      <input ref={fileInput} type="file" accept={GUIDE_IMAGE_TYPES.join(",")} hidden onChange={handleFile} />
      <Button
        type="button"
        icon={uploading ? "pi pi-spin pi-spinner" : "pi pi-upload"}
        label={t("create.coverUpload")}
        className="gm-btn gm-btn--ghost"
        disabled={uploading}
        onClick={() => fileInput.current?.click()}
      />
      <div className="guide-cover-picker__url">
        <InputText
          id="guide-cover"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyUrl())}
          placeholder={t("create.coverUrlPlaceholder")}
          aria-label={t("create.coverUrl")}
          className="gm-input"
        />
        <Button type="button" label={t("create.coverUse")} className="gm-btn gm-btn--ghost" disabled={!url.trim()} onClick={applyUrl} />
      </div>
    </div>
  );
}

// /guias/nueva: escribir una guía o compartir el link a una de otro sitio
export default function GuideCreate() {
  const { t } = useTranslation("guides");
  const navigate = useNavigate();
  const user = useCurrentUser();
  const toast = useRef(null);
  const [submitted, setSubmitted] = useState(false);

  const form = useCreateGuide(user);
  const preview = useLinkPreview();

  const showError = (detail) =>
    toast.current?.show({ severity: "error", summary: t("common:status.error"), detail, life: 4000 });

  const errorFor = (field) => submitted && form.errors[field] ? t(`create.errors.${form.errors[field]}`) : null;

  // La vista previa se pide al salir del campo; la guía se crea al enviar
  const handleUrlBlur = () => {
    const url = form.externalUrl.trim();
    if (form.isHttpUrl(url) && url !== preview.url) preview.load(url);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    if (!form.isValid) return;

    try {
      const usePreview = form.type === "external" && preview.url === form.externalUrl.trim() && preview.status !== "loading";
      const guideId = await form.submit({ preview: usePreview ? preview.preview : undefined });
      navigate(`/guias/${guideId}`, { replace: true, state: { justSent: true } });
    } catch (error) {
      console.error("Error enviando la guía:", error);
      showError(t("create.errors.save"));
    }
  };

  return (
    <div className="feed guides guide-create">
      <header className="feed-header">
        <div className="feed-header__titles">
          <span className="feed-header__eyebrow">{t("title")}</span>
          <h1 className="feed-header__title">{t("create.pageTitle")}</h1>
        </div>
      </header>

      <form className="gm-form guide-form" onSubmit={handleSubmit} noValidate>
        <div className="guide-type" role="radiogroup" aria-label={t("create.typeLabel")}>
          {TYPES.map(({ value, labelKey, icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={form.type === value}
              className={`guide-type__option${form.type === value ? " guide-type__option--active" : ""}`}
              onClick={() => form.setType(value)}
            >
              <i className={`pi ${icon}`} aria-hidden="true" />
              {t(labelKey)}
            </button>
          ))}
        </div>

        <Field id="guide-game" label={t("create.game")} error={errorFor("game")}>
          <GameSelect
            inputId="guide-game"
            labelledBy="guide-game-label"
            value={form.game}
            onChange={form.setGame}
            invalid={Boolean(errorFor("game"))}
          />
        </Field>

        <Field id="guide-title" label={t("create.title")} error={errorFor("title")}>
          <InputText
            id="guide-title"
            value={form.title}
            onChange={(e) => form.setTitle(e.target.value)}
            placeholder={t("create.titlePlaceholder")}
            maxLength={150}
            className={`gm-input${errorFor("title") ? " gm-input--invalid" : ""}`}
          />
        </Field>

        {form.type === "original" ? (
          <>
            <Field id="guide-cover" label={t("create.cover")} optional={t("create.coverOptional")} error={errorFor("cover")}>
              <CoverPicker
                value={form.coverImage}
                onChange={form.setCoverImage}
                onUpload={form.uploadImage}
                onError={showError}
              />
            </Field>

            <Field id="guide-content" label={t("create.content")} error={errorFor("content") || errorFor("contentTooLong")}>
              <Suspense fallback={<div className="guide-editor guide-editor--loading">{t("editor.loading")}</div>}>
                <RichTextEditor
                  value={form.content}
                  onChange={form.setContent}
                  onUploadImage={form.uploadImage}
                  onError={showError}
                  invalid={Boolean(errorFor("content") || errorFor("contentTooLong"))}
                />
              </Suspense>
            </Field>

            <Field id="guide-youtube" label={t("create.youtube")} optional={t("create.youtubeOptional")} error={form.youtubeUrl.trim() && !form.youtubeVideoId ? t("create.errors.youtube") : null}>
              <InputText
                id="guide-youtube"
                value={form.youtubeUrl}
                onChange={(e) => form.setYoutubeUrl(e.target.value)}
                placeholder={t("create.youtubePlaceholder")}
                className={`gm-input${form.youtubeUrl.trim() && !form.youtubeVideoId ? " gm-input--invalid" : ""}`}
              />
              {form.youtubeVideoId && (
                <div className="guide-form__video">
                  <span className="gm-field__hint">{t("create.youtubePreview")}</span>
                  <YoutubeEmbed videoId={form.youtubeVideoId} title={t("create.youtubePreview")} />
                </div>
              )}
            </Field>
          </>
        ) : (
          <Field id="guide-url" label={t("create.url")} hint={t("create.urlHint")} error={errorFor("externalUrl")}>
            <InputText
              id="guide-url"
              type="url"
              value={form.externalUrl}
              onChange={(e) => form.setExternalUrl(e.target.value)}
              onBlur={handleUrlBlur}
              placeholder={t("create.urlPlaceholder")}
              className={`gm-input${errorFor("externalUrl") ? " gm-input--invalid" : ""}`}
            />
            {preview.url === form.externalUrl.trim() && preview.status === "loading" && (
              <p className="guide-form__preview-status" role="status">
                <i className="pi pi-spin pi-spinner" aria-hidden="true" /> {t("create.previewLoading")}
              </p>
            )}
            {preview.url === form.externalUrl.trim() && preview.status === "ready" && (
              <LinkPreviewCard url={preview.url} preview={preview.preview} />
            )}
            {preview.url === form.externalUrl.trim() && preview.status === "failed" && (
              <p className="guide-form__preview-status" role="status">
                <i className="pi pi-info-circle" aria-hidden="true" /> {t("create.previewFailed")}
              </p>
            )}
          </Field>
        )}

        <p className="guide-form__notice">
          <i className="pi pi-shield" aria-hidden="true" /> {t("create.reviewNotice")}
        </p>

        <div className="guide-form__actions">
          <Button type="button" label={t("create.cancel")} className="gm-btn gm-btn--ghost" onClick={() => navigate(-1)} disabled={form.saving} />
          <Button
            type="submit"
            icon="pi pi-send"
            label={form.saving ? t("create.submitting") : t("create.submit")}
            className="gm-btn gm-btn--primary"
            loading={form.saving}
          />
        </div>
      </form>

      <Toast ref={toast} />
    </div>
  );
}
