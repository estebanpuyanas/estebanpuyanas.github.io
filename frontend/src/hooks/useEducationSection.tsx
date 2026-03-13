import { useInView } from './useInView'
import EducationCard from '../components/EducationCard'

const EDUCATION = [
  {
    institution: 'Northeastern University',
    degree: 'B.S. Computer Science & Philosophy',
    period: '2022 – Present',
    location: 'Boston, MA',
    description:
      'Combined bachelor\'s program spanning computer science fundamentals, software engineering, systems programming, formal logic, and philosophy of mind.',
  },
  {
    institution: 'Blair Academy',
    degree: 'High School Diploma',
    period: '',
    location: 'Blairstown, NJ',
    description: '',
  },
]

export function useEducationSection() {
  const ref = useInView()

  return (
    <section id="education" ref={ref as React.RefObject<HTMLElement>}>
      <div className="section-wrapper">
        <p className="section-label" data-inview>// education</p>

        <div className="edu-grid" data-inview data-delay="1">
          {EDUCATION.map((item) => (
            <EducationCard key={item.institution} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}
