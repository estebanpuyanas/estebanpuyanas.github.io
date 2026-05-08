import NavBar from "../NavBar";
import Footer from "../Footer";
import ProjectsSection from "../ProjectsSection";

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
