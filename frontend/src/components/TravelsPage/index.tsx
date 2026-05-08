import NavBar from "../NavBar";
import Footer from "../Footer";
import TravelsMap, { type TravelMarker } from "../TravelsMap";

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
