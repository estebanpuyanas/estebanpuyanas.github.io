import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import ExperienceSection from "../components/ExperienceSection";

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
