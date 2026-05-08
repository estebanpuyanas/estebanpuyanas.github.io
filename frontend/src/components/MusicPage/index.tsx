import NavBar from "../NavBar";
import Footer from "../Footer";
import MusicSection from "../MusicSection";

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
