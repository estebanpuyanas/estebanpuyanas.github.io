import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import EducationSection from "../components/EducationSection";

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
