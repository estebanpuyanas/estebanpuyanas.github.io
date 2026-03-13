import { useParams, Link } from 'react-router-dom'
import { useNavBar } from '../hooks/useNavBar'
import { BLOG_POSTS } from '../data/blogPosts'
import Footer from '../components/Footer'

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const { nav, mobileMenu } = useNavBar()

  const post = BLOG_POSTS.find((p) => p.slug === slug)

  return (
    <>
      {nav}
      {mobileMenu}
      <div className="page-content">
        <article className="section-wrapper blog-post-page">
          <Link to="/music" className="blog-back-link">← music</Link>

          {post ? (
            <>
              <header className="blog-post-header">
                <p className="blog-post-date">
                  {post.date}
                  {post.wip && <span className="wip-badge">WIP</span>}
                </p>
                <h1 className="blog-post-title">{post.title}</h1>
                <p className="blog-post-excerpt">{post.excerpt}</p>
              </header>

              <div className="blog-post-body">
                {post.paragraphs.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </>
          ) : (
            <p className="projects-error">Post not found.</p>
          )}
        </article>
      </div>
      <Footer />
    </>
  )
}
