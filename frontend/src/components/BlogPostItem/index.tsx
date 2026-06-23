import { Link } from "react-router-dom";
import type { BlogPost } from "../../services/blogService";

export default function BlogPostItem({ post }: { post: BlogPost }) {
  return (
    <div className="blog-item">
      <div className="blog-item-header">
        <div>
          <h3 className="blog-title">
            {post.title}
            {post.wip && <span className="wip-badge">WIP</span>}
          </h3>
          <p className="blog-excerpt">{post.excerpt}</p>
          <Link to={`/music/${post.slug}`} className="blog-toggle">
            ↓ Read
          </Link>
        </div>
        <span className="blog-date">{post.date}</span>
      </div>
    </div>
  );
}
