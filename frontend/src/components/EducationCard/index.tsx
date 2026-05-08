interface EducationItem {
  institution: string;
  degree: string;
  period: string;
  location: string;
  description: string;
}

export default function EducationCard({ item }: { item: EducationItem }) {
  return (
    <div className="edu-card">
      <p className="edu-institution">{item.institution}</p>
      <h3 className="edu-degree">{item.degree}</h3>
      <p className="edu-meta">
        {[item.period, item.location].filter(Boolean).join(" · ")}
      </p>
      {item.description && <p className="edu-desc">{item.description}</p>}
    </div>
  );
}
