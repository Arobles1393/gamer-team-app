import { useCallback, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import CreatePost from "./CreatePost";

const CreatePostDialog = ({
  visible,
  editingPost,
  onHide,
  onClose
}) => {
  // Fuera del Dialog: el aviso sigue visible después de cerrarlo
  const toast = useRef(null);
  const isEditing = Boolean(editingPost);

  const handleSuccess = useCallback((action) => {
    toast.current?.show({
      severity: "success",
      summary: action === "actualizar" ? "Partida actualizada" : "Partida publicada",
      detail: action === "actualizar"
        ? "Los cambios ya están visibles en el feed."
        : "Tu partida ya aparece en el feed.",
      life: 3000
    });

    onClose();
  }, [onClose]);

  const handleError = useCallback((message) => {
    toast.current?.show({
      severity: "error",
      summary: "Error",
      detail: message,
      life: 3000
    });
  }, []);

  return (
    <>
      <Dialog
        header={isEditing ? "Editar partida" : "Publicar partida"}
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
