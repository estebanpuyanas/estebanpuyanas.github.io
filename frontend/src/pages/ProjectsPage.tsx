import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import ProjectsSection from "../components/ProjectsSection";

export default function ProjectsPage() {
  return (
    <>
      <NavBar />
      <div className="page-content">
        <ProjectsSection />
      </div>
      <Footer />
    </>
  );
}
