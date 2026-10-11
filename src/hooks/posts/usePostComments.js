import { useEffect, useState } from "react";
import { commentsService } from "../../services/posts";

export const usePostComments = (postId, postOwnerId, userId) => {
  const [comments, setComments] = useState([]);

  // Sin sesión no se leen (firestore.rules, auditoría M-11)
  useEffect(() => {
    if (!postId || !userId) {
      setComments([]);
      return;
    }

    const unsubscribe = commentsService.subscribeToComments(
      postId,
      setComments,
      (error) => {
        console.error("Error obteniendo comentarios:", error);
        setComments([]);
      }
    );

    return unsubscribe;
  }, [postId, userId]);

  const publishComment = async (text, file) => {
    if (!text.trim()) {
      return false;
    }

    await commentsService.addComment({
      postId,
      postOwnerId,
      userId,
      text,
      file
    });

    return true;
  };

  const removeComment = (commentId) => {
    return commentsService.deleteComment(commentId);
  };

  return {
    comments,
    publishComment,
    removeComment
  };
};