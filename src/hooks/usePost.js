import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { postService } from "../services/posts";

export const usePost = (postId) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!postId) return;

    const unsubscribe = postService.subscribeToPost(
      postId,
      (data) => {
        if (!data) {
          navigate("/");
          return;
        }
        setPost(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error obteniendo el post:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [postId, navigate]);

  return { post, loading };
};