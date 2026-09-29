import { Dialog } from "primereact/dialog";
import CreatePost from "./CreatePost";

const CreatePostDialog = ({
  visible,
  editingPost,
  onHide,
  onClose
}) => {
  return (
    <Dialog
      header= { editingPost ? "✏️ Editar publicación" :"🎮 Crear publicación" }
      visible={visible}
      style={{ width: "1000px" }}
      onHide={onHide}
    >
      <CreatePost
        editingPost={editingPost}
        onClose={onClose}
      />
    </Dialog>
  );
};

export default CreatePostDialog; 