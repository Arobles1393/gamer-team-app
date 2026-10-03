import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { OverlayPanel } from "primereact/overlaypanel";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { GUIDE_IMAGE_TYPES } from "../../services/guides";
import { isSafeImageUrl } from "../../utils";

const isHttpUrl = (value) => /^https?:\/\/\S+$/i.test(value.trim());

function ToolButton({ label, icon, text, active = false, disabled = false, onClick }) {
  return (
    <button
      type="button"
      className={`guide-editor__tool${active ? " guide-editor__tool--active" : ""}`}
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      // mousedown: que el editor no pierda la selección al hacer clic
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {icon ? <i className={`pi ${icon}`} aria-hidden="true" /> : text}
    </button>
  );
}

/**
 * Editor de las guías (TipTap). Solo produce lo que permite sanitizeGuideHtml:
 * párrafos, negrita, cursiva, títulos H2/H3, listas, links e imágenes https.
 * - onChange(html) en cada cambio
 * - onUploadImage(file) -> URL (Storage); onError(mensaje)
 */
export default function RichTextEditor({ value, onChange, onUploadImage, onError, invalid = false }) {
  const { t } = useTranslation("guides");
  const linkPanel = useRef(null);
  const imagePanel = useRef(null);
  const fileInput = useRef(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        // Sin subrayado ni bloques de código: no están en la lista del sanitizador
        underline: false,
        codeBlock: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https"],
          isAllowedUri: (url) => isHttpUrl(url),
          HTMLAttributes: { target: "_blank", rel: "noopener noreferrer nofollow" }
        }
      }),
      Image.configure({ inline: false, allowBase64: false })
    ],
    content: value,
    // La barra marca el formato activo según el cursor
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: "guide-editor__content",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": t("editor.label")
      }
    },
    onUpdate: ({ editor: current }) => onChange(current.getHTML())
  });

  if (!editor) {
    return <div className="guide-editor guide-editor--loading">{t("editor.loading")}</div>;
  }

  const chain = () => editor.chain().focus();

  const openLinkPanel = (event) => {
    setLinkUrl(editor.getAttributes("link").href || "");
    linkPanel.current?.toggle(event);
  };

  const applyLink = () => {
    if (!isHttpUrl(linkUrl)) return;
    chain().extendMarkRange("link").setLink({ href: linkUrl.trim() }).run();
    linkPanel.current?.hide();
  };

  const removeLink = () => {
    chain().extendMarkRange("link").unsetLink().run();
    linkPanel.current?.hide();
  };

  const insertImage = (src) => chain().setImage({ src, alt: "" }).run();

  const insertImageUrl = () => {
    if (!isSafeImageUrl(imageUrl.trim())) {
      onError?.(t("create.errors.imageUrl"));
      return;
    }
    insertImage(imageUrl.trim());
    setImageUrl("");
    imagePanel.current?.hide();
  };

  // La imagen se sube al elegirla y se inserta su URL de Storage
  const handleFile = async (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;

    if (!GUIDE_IMAGE_TYPES.includes(file.type) || file.size >= 5 * 1024 * 1024) {
      onError?.(t("create.errors.imageType"));
      return;
    }

    imagePanel.current?.hide();
    setUploading(true);

    try {
      insertImage(await onUploadImage(file));
    } catch (error) {
      console.error("Error subiendo imagen de la guía:", error);
      onError?.(t("create.errors.image"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`guide-editor${invalid ? " guide-editor--invalid" : ""}`}>
      <div className="guide-editor__toolbar" role="toolbar" aria-label={t("editor.toolbar")}>
        <ToolButton label={t("editor.bold")} text={<strong>B</strong>} active={editor.isActive("bold")} onClick={() => chain().toggleBold().run()} />
        <ToolButton label={t("editor.italic")} text={<em>I</em>} active={editor.isActive("italic")} onClick={() => chain().toggleItalic().run()} />
        <span className="guide-editor__divider" aria-hidden="true" />
        <ToolButton label={t("editor.heading2")} text="H2" active={editor.isActive("heading", { level: 2 })} onClick={() => chain().toggleHeading({ level: 2 }).run()} />
        <ToolButton label={t("editor.heading3")} text="H3" active={editor.isActive("heading", { level: 3 })} onClick={() => chain().toggleHeading({ level: 3 }).run()} />
        <span className="guide-editor__divider" aria-hidden="true" />
        <ToolButton label={t("editor.bulletList")} icon="pi-list" active={editor.isActive("bulletList")} onClick={() => chain().toggleBulletList().run()} />
        <ToolButton label={t("editor.orderedList")} icon="pi-sort-numeric-down" active={editor.isActive("orderedList")} onClick={() => chain().toggleOrderedList().run()} />
        <span className="guide-editor__divider" aria-hidden="true" />
        <ToolButton label={t("editor.link")} icon="pi-link" active={editor.isActive("link")} onClick={openLinkPanel} />
        <ToolButton
          label={t("editor.image")}
          icon={uploading ? "pi-spin pi-spinner" : "pi-image"}
          disabled={uploading}
          onClick={(event) => imagePanel.current?.toggle(event)}
        />
        {uploading && <span className="guide-editor__status" role="status">{t("editor.uploading")}</span>}
      </div>

      <EditorContent editor={editor} />

      <OverlayPanel ref={linkPanel} className="gm-panel guide-editor__panel">
        <div className="guide-editor__panel-row">
          <InputText
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyLink())}
            placeholder={t("editor.linkPlaceholder")}
            aria-label={t("editor.link")}
            className="gm-input"
          />
          <Button type="button" label={t("editor.linkApply")} className="gm-btn gm-btn--primary" disabled={!isHttpUrl(linkUrl)} onClick={applyLink} />
        </div>
        {editor.isActive("link") && (
          <Button type="button" label={t("editor.linkRemove")} className="gm-btn gm-btn--ghost guide-editor__panel-secondary" onClick={removeLink} />
        )}
      </OverlayPanel>

      <OverlayPanel ref={imagePanel} className="gm-panel guide-editor__panel">
        <input ref={fileInput} type="file" accept={GUIDE_IMAGE_TYPES.join(",")} hidden onChange={handleFile} />
        <Button
          type="button"
          icon="pi pi-upload"
          label={t("editor.imageUpload")}
          className="gm-btn gm-btn--ghost guide-editor__panel-secondary"
          onClick={() => fileInput.current?.click()}
        />
        <span className="guide-editor__panel-label">{t("editor.imageUrl")}</span>
        <div className="guide-editor__panel-row">
          <InputText
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), insertImageUrl())}
            placeholder={t("editor.imageUrlPlaceholder")}
            aria-label={t("editor.imageUrl")}
            className="gm-input"
          />
          <Button type="button" label={t("editor.imageInsert")} className="gm-btn gm-btn--primary" disabled={!imageUrl.trim()} onClick={insertImageUrl} />
        </div>
      </OverlayPanel>
    </div>
  );
}
