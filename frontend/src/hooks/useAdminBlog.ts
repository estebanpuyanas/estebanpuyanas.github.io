import { useState, useCallback } from "react";
import {
  type BlogPost,
  type CreatePostPayload,
  type UpdatePostPayload,
  getAllPosts,
  createPost,
  updatePost,
  deletePost,
  setPublished,
} from "../services/blogService";

export function useAdminBlog(token: string, onAuthError: () => void) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof Error && err.message === "unauthorized") {
        onAuthError();
        return;
      }
      setError(err instanceof Error ? err.message : "Unknown error");
    },
    [onAuthError],
  );

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllPosts(token);
      setPosts(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleError]);

  const handleCreate = useCallback(
    async (payload: CreatePostPayload): Promise<BlogPost | null> => {
      try {
        const post = await createPost(payload, token);
        setPosts((prev) => [post, ...prev]);
        return post;
      } catch (err) {
        handleError(err);
        return null;
      }
    },
    [token, handleError],
  );

  const handleUpdate = useCallback(
    async (
      id: string,
      payload: UpdatePostPayload,
    ): Promise<BlogPost | null> => {
      try {
        const post = await updatePost(id, payload, token);
        setPosts((prev) => prev.map((p) => (p.id === id ? post : p)));
        return post;
      } catch (err) {
        handleError(err);
        return null;
      }
    },
    [token, handleError],
  );

  const handleDelete = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await deletePost(id, token);
        setPosts((prev) => prev.filter((p) => p.id !== id));
        return true;
      } catch (err) {
        handleError(err);
        return false;
      }
    },
    [token, handleError],
  );

  const handleTogglePublished = useCallback(
    async (id: string, published: boolean): Promise<boolean> => {
      try {
        await setPublished(id, published, token);
        setPosts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, published } : p)),
        );
        return true;
      } catch (err) {
        handleError(err);
        return false;
      }
    },
    [token, handleError],
  );

  return {
    posts,
    loading,
    error,
    fetchPosts,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleTogglePublished,
  };
}
