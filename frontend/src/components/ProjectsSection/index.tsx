import { useInView } from "../../hooks/useInView";
import { useProjectsSection } from "../../hooks/useProjectsSection";
import ProjectCard from "../ProjectCard";

export default function ProjectsSection() {
  const ref = useInView();
  const { repos, loading, error } = useProjectsSection();

  return (
    <section id="projects" ref={ref as React.RefObject<HTMLElement>}>
      <div className="section-wrapper">
        <p className="section-label" data-inview>
          // projects
        </p>

        {loading && (
          <div className="projects-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="project-card-skeleton" />
            ))}
          </div>
        )}

        {error && (
          <p className="projects-error">
            Could not load repositories.{" "}
            <a
              href="https://github.com/estebanpuyanas"
              target="_blank"
              rel="noopener noreferrer"
              className="projects-error-link"
            >
              View on GitHub →
            </a>
          </p>
        )}

        {!loading && !error && (
          <div className="projects-grid" data-inview data-delay="1">
            {repos.map((repo, i) => (
              <ProjectCard key={repo.id} repo={repo} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
