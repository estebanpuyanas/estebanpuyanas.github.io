import NavBar from "../NavBar";
import Footer from "../Footer";
import ExperienceSection from "../ExperienceSection";

export default function ExperiencePage() {
  return (
    <>
      <NavBar />
      <div className="page-content">
        <ExperienceSection />
      </div>
      <Footer />
    </>
  );
}
