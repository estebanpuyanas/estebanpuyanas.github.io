import NavBar from "../NavBar";
import Footer from "../Footer";
import TravelsMap, { type TravelMarker } from "../TravelsMap";
import { useTravelPins } from "../../hooks/useTravelPins";

export default function TravelsPage() {
  const { pins } = useTravelPins();

  const markers: TravelMarker[] = pins.map((p) => ({
    id: p.id,
    label: p.locationName,
    lat: p.latitude,
    lng: p.longitude,
    photos: p.images.map((i) => i.cloudinarySecureUrl),
  }));

  return (
    <>
      <NavBar />
      <div className="page-content">
        <TravelsMap label="// travels" markers={markers} />
      </div>
      <Footer />
    </>
  );
}
