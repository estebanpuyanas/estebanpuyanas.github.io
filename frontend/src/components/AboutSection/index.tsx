import { useInView } from "../../hooks/useInView";

const INTERESTS = [
  "Software Dev",
  "Data Engineering",
  "Embedded Systems",
  "Philosophy",
  "Music",
];

export default function AboutSection() {
  const ref = useInView();

  return (
    <section id="about" ref={ref as React.RefObject<HTMLElement>}>
      <div className="section-wrapper">
        <p className="section-label" data-inview>
          // about
        </p>

        <div className="about-grid">
          <div>
            <p className="about-bio" data-inview data-delay="1">
              I'm an{" "}
              <em className="about-bio-strong">aspiring software engineer</em>{" "}
              pursuing a combined B.S. in{" "}
              <em className="about-bio-strong">
                Computer Science &amp; Philosophy
              </em>{" "}
              at Northeastern University in Boston, MA.
            </p>
            <br />
            <p className="about-bio" data-inview data-delay="2">
              I have a deep passion for technology and a strong interest in
              <em className="about-bio-strong">
                {" "}
                software development and data engineering
              </em>
              . I love finding elegant solutions to complex systems problems —
              whether at the level of embedded firmware or distributed data
              infrastructure.
            </p>
            <br />
            <p className="about-bio" data-inview data-delay="3">
              Outside of work, you'll find me at the gym, on the squash court,
              playing chess, or deep in a record collection — hunting for albums
              worth writing about.
            </p>
            <br />
            <p className="about-bio" data-inview data-delay="4">
              I went to Blair Academy for high school and I'm now at
              Northeastern for college.
            </p>
          </div>

          <div className="stats-panel">
            <div data-inview data-delay="4">
              <p className="stat-label interests-label">Interests</p>
              <div className="pills-row">
                {INTERESTS.map((tag) => (
                  <span key={tag} className="pill">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
