import { useInView } from "../hooks/useInView";
import BlogPostItem from "./BlogPostItem";
import { BLOG_POSTS } from "../data/blogPosts";

export default function MusicSection() {
  const ref = useInView();

  return (
    <section id="music" ref={ref as React.RefObject<HTMLElement>}>
      <div className="section-wrapper">
        <p className="section-label" data-inview>
          // music
        </p>

        <div className="music-inner">
          <blockquote className="music-quote" data-inview data-delay="1">
            Listening is its own
            <br />
            form of thinking.
          </blockquote>

          <p className="music-desc" data-inview data-delay="2">
            Alongside code, I write about music — specifically about albums that
            reward close attention. Each post is an attempt to put into words
            what makes a record worth returning to. Somewhere between criticism,
            philosophy, and liner notes.
          </p>

          <div className="blog-list" data-inview data-delay="3">
            {BLOG_POSTS.map((post) => (
              <BlogPostItem key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
