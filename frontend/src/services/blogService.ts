const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostPayload {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
}

export interface UpdatePostPayload {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  published: boolean;
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const res = await fetch(`${BASE_URL}/api/blog/posts`);
  if (!res.ok) throw new Error(`Failed to fetch posts: ${res.status}`);
  return res.json();
}

export async function getPost(slug: string): Promise<BlogPost> {
  const res = await fetch(`${BASE_URL}/api/blog/posts/${slug}`);
  if (res.status === 404) throw new Error("not found");
  if (!res.ok) throw new Error(`Failed to fetch post: ${res.status}`);
  return res.json();
}

export async function getAllPosts(token: string): Promise<BlogPost[]> {
  const res = await fetch(`${BASE_URL}/api/admin/blog/posts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(`Failed to fetch posts: ${res.status}`);
  return res.json();
}

export async function getPostById(
  id: string,
  token: string,
): Promise<BlogPost> {
  const res = await fetch(`${BASE_URL}/api/admin/blog/posts/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (res.status === 404) throw new Error("not found");
  if (!res.ok) throw new Error(`Failed to fetch post: ${res.status}`);
  return res.json();
}

export async function createPost(
  payload: CreatePostPayload,
  token: string,
): Promise<BlogPost> {
  const res = await fetch(`${BASE_URL}/api/admin/blog/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (res.status === 409) throw new Error("slug already exists");
  if (!res.ok) throw new Error(`Failed to create post: ${res.status}`);
  return res.json();
}

export async function updatePost(
  id: string,
  payload: UpdatePostPayload,
  token: string,
): Promise<BlogPost> {
  const res = await fetch(`${BASE_URL}/api/admin/blog/posts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (res.status === 404) throw new Error("not found");
  if (res.status === 409) throw new Error("slug already exists");
  if (!res.ok) throw new Error(`Failed to update post: ${res.status}`);
  return res.json();
}

export async function deletePost(id: string, token: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/blog/posts/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (res.status === 404) throw new Error("not found");
  if (!res.ok) throw new Error(`Failed to delete post: ${res.status}`);
}

export async function setPublished(
  id: string,
  published: boolean,
  token: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/blog/posts/${id}/publish`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ published }),
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (res.status === 404) throw new Error("not found");
  if (!res.ok) throw new Error(`Failed to update post: ${res.status}`);
}
