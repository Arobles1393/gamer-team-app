import { Dialog } from "primereact/dialog";
import CreatePost from "./CreatePost";

const CreatePostDialog = ({
  visible,
  editingPost,
  user,
  userData,
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
				user={user}
				userData={userData}
				editingPost={editingPost}
				onClose={onClose}
			/>
		</Dialog>
  );
};

export default CreatePostDialog;