import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import TravelsMap, { type TravelMarker } from "../components/TravelsMap";

const MARKERS: TravelMarker[] = [];

export default function TravelsPage() {
  return (
    <>
      <NavBar />
      <div className="page-content">
        <TravelsMap
          label="// travels"
          markers={MARKERS}
          onMarkerClick={(marker) => {
            console.log("marker clicked:", marker);
          }}
        />
      </div>
      <Footer />
    </>
  );
}
