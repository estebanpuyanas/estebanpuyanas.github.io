import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import MusicSection from "../components/MusicSection";

export default function MusicPage() {
  return (
    <>
      <NavBar />
      <div className="page-content">
        <MusicSection />
      </div>
      <Footer />
    </>
  );
}
