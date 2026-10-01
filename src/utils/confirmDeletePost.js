import i18n from "../i18n";
import { confirmDestructive } from "./confirmDestructive";

export const confirmDeletePost = ({ onAccept }) => {
  confirmDestructive({
    header: i18n.t("common:confirm.deletePost.header"),
    message: i18n.t("common:confirm.deletePost.message"),
    acceptLabel: i18n.t("common:confirm.deletePost.accept"),
    onAccept
  });
};
