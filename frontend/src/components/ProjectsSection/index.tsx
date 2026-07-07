import { useState } from "react";
import { useInView } from "../../hooks/useInView";
import ProjectCard from "../ProjectCard";

const PROJECTS = [
  {
    name: "Project One",
    summary: "One-line placeholder description of what this project does.",
    description:
      "Longer placeholder description of the project — the problem it solves, how it works, and anything worth calling out about the build.",
    tech: ["TypeScript", "React"],
    demoUrl: "#",
    repoUrl: "https://github.com/estebanpuyanas",
  },
  {
    name: "Project Two",
    summary: "One-line placeholder description of what this project does.",
    description:
      "Longer placeholder description of the project — the problem it solves, how it works, and anything worth calling out about the build.",
    tech: ["Python"],
    demoUrl: "#",
    repoUrl: "https://github.com/estebanpuyanas",
  },
  {
    name: "Project Three",
    summary: "One-line placeholder description of what this project does.",
    description:
      "Longer placeholder description of the project — the problem it solves, how it works, and anything worth calling out about the build.",
    tech: ["C++", "Embedded"],
    repoUrl: "https://github.com/estebanpuyanas",
  },
];

export default function ProjectsSection() {
  const ref = useInView();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section id="projects" ref={ref as React.RefObject<HTMLElement>}>
      <div className="section-wrapper">
        <p className="section-label" data-inview>
          // projects
        </p>

        <div className="projects-grid" data-inview data-delay="1">
          {PROJECTS.map((project, i) => (
            <ProjectCard
              key={project.name}
              project={project}
              index={i}
              expanded={expanded === project.name}
              onToggle={() =>
                setExpanded((cur) =>
                  cur === project.name ? null : project.name,
                )
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
