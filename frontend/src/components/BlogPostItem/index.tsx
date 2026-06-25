import { Link } from "react-router-dom";
import type { BlogPost } from "../../services/blogService";

export default function BlogPostItem({ post }: { post: BlogPost }) {
  return (
    <div className="blog-item">
      <div className="blog-item-header">
        <div>
          <h3 className="blog-title">{post.title}</h3>
          <p className="blog-excerpt">{post.excerpt}</p>
          <Link to={`/music/${post.slug}`} className="blog-toggle">
            ↓ Read
          </Link>
        </div>
        <span className="blog-date">
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
