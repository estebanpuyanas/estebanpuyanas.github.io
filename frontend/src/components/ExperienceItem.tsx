interface Experience {
  company: string;
  role: string;
  period: string;
  location: string;
  description: string;
}

export default function ExperienceItem({
  exp,
  index,
}: {
  exp: Experience;
  index: number;
}) {
  return (
    <div className="timeline-item" data-inview data-delay={String(index + 1)}>
      <div className="timeline-line">
        <div className="timeline-dot" />
      </div>
      <div className="timeline-content">
        <p className="timeline-company">{exp.company}</p>
        <h3 className="timeline-role">{exp.role}</h3>
        <p className="timeline-meta">
          {exp.period} · {exp.location}
        </p>
        <p className="timeline-desc">{exp.description}</p>
      </div>
    </div>
  );
}
