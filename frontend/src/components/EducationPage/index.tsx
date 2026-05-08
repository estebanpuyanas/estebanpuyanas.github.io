import NavBar from "../NavBar";
import Footer from "../Footer";
import EducationSection from "../EducationSection";

export default function EducationPage() {
  return (
    <>
      <NavBar />
      <div className="page-content">
        <EducationSection />
      </div>
      <Footer />
    </>
  );
}
