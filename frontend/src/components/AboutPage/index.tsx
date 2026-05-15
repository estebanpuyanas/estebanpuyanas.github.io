import NavBar from "../NavBar";
import Footer from "../Footer";
import AboutSection from "../AboutSection";
import EducationSection from "../EducationSection";
import ExperienceSection from "../ExperienceSection";

export default function AboutPage() {
  return (
    <>
      <NavBar />
      <div className="page-content">
        <AboutSection />
        <EducationSection />
        <ExperienceSection />
      </div>
      <Footer />
    </>
  );
}
