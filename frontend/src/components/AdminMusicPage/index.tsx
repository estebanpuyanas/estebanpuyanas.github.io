import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import NavBar from "../NavBar";
import AdminGate from "../AdminGate";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import { useAdminBlog } from "../../hooks/useAdminBlog";
import {
  type BlogPost,
  type CreatePostPayload,
  type UpdatePostPayload,
} from "../../services/blogService";
import "./index.css";

type EditorMode = "list" | "create" | "edit";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function formatDate(raw: string): string {
  if (!raw) return "";
  try {
    return new Date(raw).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return raw;
  }
}

interface PostFormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  published: boolean;
}

const EMPTY_FORM: PostFormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  published: false,
};

export default function AdminMusicPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<EditorMode>("list");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<PostFormState>(EMPTY_FORM);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<"write" | "preview">("write");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const {
    token,
    tokenInput,
    setTokenInput,
    authError,
    failedAttempts,
    lastTokenSnippet,
    handleLogin,
    handleLogout,
    handleAuthError,
  } = useAdminAuth(() => navigate("/admin/music"));

  const {
    posts,
    loading,
    error,
    fetchPosts,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleTogglePublished,
  } = useAdminBlog(token, handleAuthError);

  useEffect(() => {
    if (token) fetchPosts();
  }, [token, fetchPosts]);

  const openCreate = useCallback(() => {
    setEditingPost(null);
    setForm(EMPTY_FORM);
    setSlugManuallyEdited(false);
    setSaveError(null);
    setPreviewTab("write");
    setMode("create");
  }, []);

  const openEdit = useCallback((post: BlogPost) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      published: post.published,
    });
    setSlugManuallyEdited(true);
    setSaveError(null);
    setPreviewTab("write");
    setMode("edit");
  }, []);

  const handleTitleChange = (value: string) => {
    setForm((f) => ({
      ...f,
      title: value,
      slug: slugManuallyEdited ? f.slug : slugify(value),
    }));
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setForm((f) => ({ ...f, slug: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    if (mode === "create") {
      const payload: CreatePostPayload = {
        slug: form.slug,
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
      };
      const result = await handleCreate(payload);
      if (result) {
        setMode("list");
      } else {
        setSaveError("Failed to create post. Slug may already be taken.");
      }
    } else if (mode === "edit" && editingPost) {
      const payload: UpdatePostPayload = {
        slug: form.slug,
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        published: form.published,
      };
      const result = await handleUpdate(editingPost.id, payload);
      if (result) {
        setMode("list");
      } else {
        setSaveError("Failed to save post. Slug may already be taken.");
      }
    }
    setSaving(false);
  };

  const confirmDelete = async (id: string) => {
    await handleDelete(id);
    setDeleteConfirmId(null);
    if (mode === "edit" && editingPost?.id === id) {
      setMode("list");
    }
  };

  if (!token) {
    return (
      <AdminGate
        section="music"
        tokenInput={tokenInput}
        setTokenInput={setTokenInput}
        authError={authError}
        failedAttempts={failedAttempts}
        lastTokenSnippet={lastTokenSnippet}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <>
      <NavBar />
      <div className="page-content">
        <div className="amusic-wrapper">
          <div className="amusic-header">
            <div className="amusic-header-left">
              <button
                className="amusic-back-btn"
                onClick={() => navigate("/admin")}
              >
                ← admin
              </button>
              <h1 className="amusic-title">music / blog</h1>
            </div>
            <div className="amusic-header-right">
              {mode === "list" && (
                <button className="amusic-new-btn" onClick={openCreate}>
                  + new post
                </button>
              )}
              {(mode === "create" || mode === "edit") && (
                <button
                  className="amusic-cancel-btn"
                  onClick={() => setMode("list")}
                >
                  ← back to list
                </button>
              )}
              <Link to="/admin/travels" className="admin-btn admin-btn--ghost">
                travels →
              </Link>
              <button
                className="admin-btn admin-btn--ghost"
                onClick={handleLogout}
              >
                log out
              </button>
            </div>
          </div>

          {mode === "list" && (
            <div className="amusic-list">
              {loading && <p className="amusic-status">loading...</p>}
              {error && <p className="amusic-error">{error}</p>}
              {!loading && posts.length === 0 && (
                <p className="amusic-status">no posts yet. create one!</p>
              )}
              {posts.map((post) => (
                <div key={post.id} className="amusic-post-row">
                  <div className="amusic-post-meta">
                    <span
                      className={`amusic-badge ${post.published ? "amusic-badge--published" : "amusic-badge--draft"}`}
                    >
                      {post.published ? "published" : "draft"}
                    </span>
                    <span className="amusic-post-date">
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                  <div className="amusic-post-info">
                    <span className="amusic-post-title">{post.title}</span>
                    <span className="amusic-post-slug">/{post.slug}</span>
                  </div>
                  {post.excerpt && (
                    <p className="amusic-post-excerpt">{post.excerpt}</p>
                  )}
                  <div className="amusic-post-actions">
                    <button
                      className="amusic-action-btn"
                      onClick={() =>
                        handleTogglePublished(post.id, !post.published)
                      }
                    >
                      {post.published ? "unpublish" : "publish"}
                    </button>
                    <button
                      className="amusic-action-btn"
                      onClick={() => openEdit(post)}
                    >
                      edit
                    </button>
                    {deleteConfirmId === post.id ? (
                      <>
                        <span className="amusic-confirm-text">sure?</span>
                        <button
                          className="amusic-action-btn amusic-action-btn--danger"
                          onClick={() => confirmDelete(post.id)}
                        >
                          yes, delete
                        </button>
                        <button
                          className="amusic-action-btn"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="amusic-action-btn amusic-action-btn--danger"
                        onClick={() => setDeleteConfirmId(post.id)}
                      >
                        delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {(mode === "create" || mode === "edit") && (
            <div className="amusic-editor">
              <div className="amusic-editor-fields">
                <div className="amusic-field">
                  <label className="amusic-label">title</label>
                  <input
                    className="amusic-input"
                    value={form.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="post title"
                  />
                </div>
                <div className="amusic-field">
                  <label className="amusic-label">slug</label>
                  <div className="amusic-slug-row">
                    <span className="amusic-slug-prefix">/music/</span>
                    <input
                      className="amusic-input amusic-input--slug"
                      value={form.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="post-slug"
                    />
                  </div>
                </div>
                <div className="amusic-field">
                  <label className="amusic-label">excerpt</label>
                  <textarea
                    className="amusic-textarea amusic-textarea--short"
                    value={form.excerpt}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, excerpt: e.target.value }))
                    }
                    placeholder="short summary shown in previews"
                    rows={2}
                  />
                </div>
                {mode === "edit" && (
                  <div className="amusic-field amusic-field--inline">
                    <label className="amusic-label">published</label>
                    <button
                      className={`amusic-toggle ${form.published ? "amusic-toggle--on" : ""}`}
                      onClick={() =>
                        setForm((f) => ({ ...f, published: !f.published }))
                      }
                    >
                      {form.published ? "yes" : "no"}
                    </button>
                  </div>
                )}
              </div>

              <div className="amusic-editor-body">
                <div className="amusic-editor-tabs">
                  <button
                    className={`amusic-tab ${previewTab === "write" ? "amusic-tab--active" : ""}`}
                    onClick={() => setPreviewTab("write")}
                  >
                    write
                  </button>
                  <button
                    className={`amusic-tab ${previewTab === "preview" ? "amusic-tab--active" : ""}`}
                    onClick={() => setPreviewTab("preview")}
                  >
                    preview
                  </button>
                </div>

                {previewTab === "write" ? (
                  <textarea
                    className="amusic-textarea amusic-textarea--content"
                    value={form.content}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, content: e.target.value }))
                    }
                    placeholder="write your post in markdown..."
                    spellCheck
                  />
                ) : (
                  <div className="amusic-preview">
                    {form.content ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {form.content}
                      </ReactMarkdown>
                    ) : (
                      <p className="amusic-preview-empty">
                        nothing to preview yet.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {saveError && <p className="amusic-error">{saveError}</p>}

              <div className="amusic-editor-footer">
                <button
                  className="amusic-save-btn"
                  onClick={handleSave}
                  disabled={saving || !form.title.trim() || !form.slug.trim()}
                >
                  {saving
                    ? "saving..."
                    : mode === "create"
                      ? "create post"
                      : "save changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
