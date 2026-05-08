import { useInView } from "../hooks/useInView";
import ExperienceItem from "./ExperienceItem";

const EXPERIENCES = [
  {
    company: "EnviroLogix Inc.",
    role: "Software Engineer Intern",
    period: "May – Aug 2025",
    location: "Portland, ME",
    description:
      "R&D software development focused on building testing automation tools for the company's C++ embedded systems. Created documentation and maintenance systems for embedded software and other internal projects.",
  },
  {
    company: "Logica GHL",
    role: "Data Architecture Engineer Co-Op",
    period: "Aug – Dec 2024",
    location: "Bogotá, Colombia",
    description:
      "Collaborated with the engineering team to develop data infrastructure and pipelines, modernizing the company's information processing and management systems.",
  },
];

export default function ExperienceSection() {
  const ref = useInView();

  return (
    <section id="experience" ref={ref as React.RefObject<HTMLElement>}>
      <div className="section-wrapper">
        <p className="section-label" data-inview>
          // experience
        </p>

        <div className="timeline">
          {EXPERIENCES.map((exp, i) => (
            <ExperienceItem key={exp.company} exp={exp} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
