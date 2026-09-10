import { useEffect, useState } from "react";
import { commentsService } from "../services/posts";

export const usePostComments = (postId, postOwnerId, userId) => {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!postId) return;

    const unsubscribe = commentsService.subscribeToComments(
      postId,
      setComments,
      (error) => {
        console.error("Error obteniendo comentarios:", error);
        setComments([]);
      }
    );

    return unsubscribe;
  }, [postId]);

  const publishComment = async (text, file) => {
    if (!text.trim()) return;

    await commentsService.addComment({
      postId,
      postOwnerId,
      userId,
      text,
      file
    });
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