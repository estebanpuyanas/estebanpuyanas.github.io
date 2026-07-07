import { useInView } from "../../hooks/useInView";

const INTERESTS = [
  "Software Engineering",
  "Free & Open Source Software",
  "Linux",
  "Chess",
  "Cooking",
  "Weightlifting",
  "Running",
  "Squash",
  "Music",
  "Reading",
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
              My name is Esteban Puyana. I was born in Bogotá, Colombia, and
              lived there until about the age of 16, when I moved to New Jersey
              to attend
              <a href="https://www.blair.edu"> Blair Academy.</a> After Blair, I
              moved to Boston to attend{" "}
              <a href="https://www.northeastern.edu">Northeastern University</a>
              , where I graduated with a double B.S. in Computer Science and
              Philosophy.
            </p>
            <br />
            <p className="about-bio" data-inview data-delay="2">
              During my time at Northeastern, I worked in technical roles
              spanning from software/data engineering to teaching assistant for
              the algorithms and data structures course. I currently work at{" "}
              <a href="https://www.netcracker.com/">Netcracker Technology</a> as
              a Software Solutions Engineer.
            </p>
            <br />
            <p className="about-bio" data-inview data-delay="3">
              I have always been a technology nerd, so outside of work you might
              find me tinkering with my{" "}
              <a href="https://www.frame.work/">Framework Laptop</a>, tweaking
              my{" "}
              <a href="https://www.github.com/estebanpuyana/dotfiles">
                dotfiles
              </a>
              , or simply building things for fun, curiosity, and learning.
              <br />
              <br />
              When I'm not obsessing over whatever technology project I happen
              to be working on, I enjoy various forms of exercise
              (weightlifting, running, squash), cooking, reading, listening to
              music, and spending time with my friends.
            </p>

            <div className="interests-block" data-inview data-delay="4">
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

          <div className="about-image-stack" data-inview data-delay="2">
            <div className="about-image-frame">
              <img src="/vite.svg" alt="placeholder" />
            </div>
            <div className="about-image-frame">
              <img src="/vite.svg" alt="placeholder" />
            </div>
            <div className="about-image-frame">
              <img src="/vite.svg" alt="placeholder" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
