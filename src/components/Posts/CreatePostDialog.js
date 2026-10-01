import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import CreatePost from "./CreatePost";

const CreatePostDialog = ({
  visible,
  editingPost,
  onHide,
  onClose
}) => {
  const { t } = useTranslation("posts");
  // Fuera del Dialog: el aviso sigue visible después de cerrarlo
  const toast = useRef(null);
  const isEditing = Boolean(editingPost);

  const handleSuccess = useCallback((action) => {
    toast.current?.show({
      severity: "success",
      summary: action === "actualizar" ? t("create.done.updatedTitle") : t("create.done.createdTitle"),
      detail: action === "actualizar"
        ? t("create.done.updatedText")
        : t("create.done.createdText"),
      life: 3000
    });

    onClose();
  }, [onClose, t]);

  const handleError = useCallback((message) => {
    toast.current?.show({
      severity: "error",
      summary: t("common:status.error"),
      detail: message,
      life: 3000
    });
  }, [t]);

  return (
    <>
      <Dialog
        header={isEditing ? t("create.titleEdit") : t("create.titleNew")}
        visible={visible}
        onHide={onHide}
        className="gm-dialog create-post-dialog"
        maskClassName="gm-dialog-mask"
        style={{ width: "640px" }}
        breakpoints={{ "767px": "100vw" }}
        draggable={false}
        blockScroll
      >
        <CreatePost
          editingPost={editingPost}
          onClose={onClose}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </Dialog>
      <Toast ref={toast} />
    </>
  );
};

export default CreatePostDialog;
