import NavBar from "../NavBar";
import Footer from "../Footer";
import AboutSection from "../AboutSection";

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
