import { ArrowRight } from "../Icons";

interface Project {
  name: string;
  summary: string;
  description: string;
  tech: string[];
  demoUrl?: string;
  repoUrl?: string;
}

export default function ProjectCard({
  project,
  index,
  expanded,
  onToggle,
}: {
  project: Project;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`project-card${expanded ? " project-card--expanded" : ""}`}
      data-inview
      data-delay={String(Math.min(index + 1, 4))}
    >
      <div className="project-cover">
        <img src="/vite.svg" alt="" />
      </div>

      <button
        type="button"
        className="project-card-trigger"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="project-card-header">
          <div>
            <p className="project-num">{String(index + 1).padStart(2, "0")}</p>
            <h3 className="project-name">{project.name}</h3>
          </div>
          <span className="project-toggle" aria-hidden="true">
            +
          </span>
        </div>

        <p className="project-summary">{project.summary}</p>

        <div className="tech-tags">
          {project.tech.map((tag) => (
            <span key={tag} className="tech-tag">
              {tag}
            </span>
          ))}
        </div>
      </button>

      <div className="project-details">
        <div className="project-details-inner">
          <p className="project-desc">{project.description}</p>
          <div className="project-links">
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="project-link"
                tabIndex={expanded ? 0 : -1}
              >
                Live demo <ArrowRight />
              </a>
            )}
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="project-link"
                tabIndex={expanded ? 0 : -1}
              >
                View code <ArrowRight />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
