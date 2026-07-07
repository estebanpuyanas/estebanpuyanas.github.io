interface Role {
  title: string;
  period: string;
  location: string;
  description: string;
}

interface Experience {
  company: string;
  roles: Role[];
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
        {exp.roles.map((role) => (
          <div className="timeline-role-block" key={role.title}>
            <h3 className="timeline-role">{role.title}</h3>
            {(role.period || role.location) && (
              <p className="timeline-meta">
                {[role.period, role.location].filter(Boolean).join(" · ")}
              </p>
            )}
            {role.description && (
              <p className="timeline-desc">{role.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
