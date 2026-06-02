import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import NavBar from "../NavBar";
import Footer from "../Footer";
import { getPost, type BlogPost } from "../../services/blogService";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    getPost(slug)
      .then(setPost)
      .catch((err: Error) => {
        if (err.message === "not found") setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <>
      <NavBar />
      <div className="page-content">
        <article className="section-wrapper blog-post-page">
          <Link to="/music" className="blog-back-link">
            ← music
          </Link>

          {loading && <p className="blog-post-loading">loading...</p>}

          {!loading && notFound && (
            <p className="projects-error">Post not found.</p>
          )}

          {!loading && post && (
            <>
              <header className="blog-post-header">
                <p className="blog-post-date">
                  {new Date(post.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <h1 className="blog-post-title">{post.title}</h1>
                {post.excerpt && (
                  <p className="blog-post-excerpt">{post.excerpt}</p>
                )}
              </header>

              <div className="blog-post-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {post.content}
                </ReactMarkdown>
              </div>
            </>
          )}
        </article>
      </div>
      <Footer />
    </>
  );
}
