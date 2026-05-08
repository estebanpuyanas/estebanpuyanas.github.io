import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import AboutSection from "../components/AboutSection";

export default function AboutPage() {
  return (
    <>
      <NavBar />
      <div className="page-content">
        <AboutSection />
      </div>
      <Footer />
    </>
  );
}
