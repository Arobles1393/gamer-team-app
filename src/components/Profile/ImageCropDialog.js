import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Cropper from "react-easy-crop";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Slider } from "primereact/slider";
import { Toast } from "primereact/toast";
import { AVATAR_OUTPUT, BANNER_ASPECT, BANNER_OUTPUT, getCroppedBlob } from "../../utils/cropImage";
import "./ImageCropDialog.css";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

const CONFIG = {
  avatar: { aspect: 1, cropShape: "round", output: AVATAR_OUTPUT },
  banner: { aspect: BANNER_ASPECT, cropShape: "rect", output: BANNER_OUTPUT }
};

const clampZoom = (value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 10) / 10));

/**
 * Recorte de avatar (cuadrado, con guía circular) o portada (5,5:1) antes
 * de subir. Arrastrar o flechas del teclado para mover; control y +/−
 * para acercar. onConfirm(blob) recibe solo la imagen recortada.
 */
export default function ImageCropDialog({ visible, file, type, onCancel, onConfirm }) {
  const { t } = useTranslation("profile");
  const toast = useRef(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);
  // El recortador mide su contenedor al montarse: se monta al terminar la
  // animación de entrada del diálogo (durante ella está escalado)
  const [shown, setShown] = useState(false);
  const config = CONFIG[type] ?? CONFIG.avatar;
  const isGif = file?.type === "image/gif";

  // URL temporal del archivo elegido, revocada al cerrar. Se crea en el
  // efecto (no en useMemo) para que la limpieza nunca deje una URL revocada
  const [imageUrl, setImageUrl] = useState(null);
  useEffect(() => {
    if (!file) {
      setImageUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!visible) setShown(false);
  }, [visible]);

  // Cada archivo empieza centrado y sin zoom
  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAreaPixels(null);
  }, [file]);

  const handleApply = async () => {
    if (!areaPixels || processing) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(imageUrl, areaPixels, config.output.width, config.output.height);
      onConfirm(blob);
    } catch (error) {
      console.error("Error recortando la imagen:", error.message);
      toast.current?.show({ severity: "error", summary: t("common:status.error"), detail: t("crop.error"), life: 4000 });
    } finally {
      setProcessing(false);
    }
  };

  const close = () => {
    if (!processing) onCancel();
  };

  return (
    <>
      <Dialog
        visible={visible}
        onHide={close}
        onShow={() => setShown(true)}
        header={t(type === "banner" ? "crop.titleBanner" : "crop.titleAvatar")}
        className={`gm-dialog image-crop image-crop--${type}`}
        maskClassName="gm-dialog-mask"
        modal
        closable={!processing}
        closeOnEscape={!processing}
        draggable={false}
        resizable={false}
      >
        <p className="image-crop__help">{t("crop.help")}</p>
        {isGif && (
          <p className="image-crop__notice" role="note">
            <i className="pi pi-info-circle" aria-hidden="true" />
            {t("crop.gifNotice")}
          </p>
        )}

        <div className="image-crop__area">
          {imageUrl && shown && (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              aspect={config.aspect}
              cropShape={config.cropShape}
              showGrid
              objectFit="cover"
              keyboardStep={10}
              onCropChange={setCrop}
              onZoomChange={(value) => setZoom(clampZoom(value))}
              onCropComplete={(_, pixels) => setAreaPixels(pixels)}
              cropperProps={{ "aria-label": t("crop.areaLabel") }}
            />
          )}
        </div>

        <div className="image-crop__zoom">
          <Button
            type="button"
            icon="pi pi-minus"
            className="gm-btn gm-btn--ghost image-crop__zoom-btn"
            aria-label={t("crop.zoomOut")}
            disabled={processing || zoom <= MIN_ZOOM}
            onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP * 2))}
          />
          <Slider
            value={zoom}
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={ZOOM_STEP}
            onChange={(e) => setZoom(clampZoom(e.value))}
            disabled={processing}
            className="image-crop__slider"
            aria-label={t("crop.zoom")}
          />
          <Button
            type="button"
            icon="pi pi-plus"
            className="gm-btn gm-btn--ghost image-crop__zoom-btn"
            aria-label={t("crop.zoomIn")}
            disabled={processing || zoom >= MAX_ZOOM}
            onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP * 2))}
          />
        </div>

        <div className="image-crop__actions">
          <Button
            type="button"
            label={t("common:actions.cancel")}
            className="gm-btn gm-btn--ghost"
            disabled={processing}
            onClick={close}
          />
          <Button
            type="button"
            label={processing ? t("crop.applying") : t("crop.apply")}
            icon={processing ? "pi pi-spin pi-spinner" : "pi pi-check"}
            className="gm-btn gm-btn--primary"
            disabled={processing || !areaPixels}
            onClick={handleApply}
          />
        </div>
      </Dialog>
      <Toast ref={toast} />
    </>
  );
}
