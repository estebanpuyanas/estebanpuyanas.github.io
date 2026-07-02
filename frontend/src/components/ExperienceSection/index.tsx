import { useInView } from "../../hooks/useInView";
import ExperienceItem from "../ExperienceItem";

const EXPERIENCES = [
  {
    company: "Netcracker Technology",
    roles: [
      {
        title: "Software Solutions Engineer",
        period: "June 2026 - Present",
        location: "Waltham, MA, USA",
        description:
          "Ill update this in a few months when I can more accurately talk about my work here :)",
      },
    ],
  },
  {
    company: "Northeastern University Khoury College of Computer Sciences",
    roles: [
      {
        title: "Teaching Assistant for CS3000: Data Structures & Algorithms",
        period: "May - July 2026",
        location: "Boston, MA, USA",
        description:
          "Worked alongside a team of 10+ teaching assistants to support a summer session of CS3000, a core course in the computer science curriculum. Responsibilities included holding office hours for  135+ students, lead recitation sessions for 25+ students, held individualized tutoring sessions, and assited with overall grading, material proofreading, and course management.",
      },
      {
        title: "Peer Mentor",
        period: "August - May 2026",
        location: "Boston, MA, USA",
        description:
          "Worked with a team of 20+ peer mentors to support first and second year students through the co-op application process. Lead career development workshops and one-on-one sessions to help students with resume building, interview preparation, and job search strategies.",
      },
    ],
  },
  {
    company: "EnviroLogix Inc.",
    roles: [
      {
        title: "Software Engineer Intern",
        period: "May – August 2025",
        location: "Portland, ME, USA",
        description:
          "R&D software development focused on building testing automation tools for the company's C++ embedded systems. Created documentation and maintenance systems for embedded software and other internal projects.",
      },
    ],
  },
  {
    company: "Logica GHL",
    roles: [
      {
        title: "Data Architecture Engineer Co-Op",
        period: "August - December 2024",
        location: "Bogotá, Colombia",
        description:
          "Collaborated with the engineering team to develop data infrastructure and pipelines, modernizing the company's financial information processing and management systems.",
      },
    ],
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
