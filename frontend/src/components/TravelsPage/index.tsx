import { useState } from "react";
import NavBar from "../NavBar";
import Footer from "../Footer";
import TravelsMap, { type TravelMarker } from "../TravelsMap";
import PinModal from "../PinModal";
import { useTravelPins } from "../../hooks/useTravelPins";
import type { Pin } from "../../services/travelPinService";

export default function TravelsPage() {
  const { pins } = useTravelPins();
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);

  const markers: TravelMarker[] = pins.map((p) => ({
    id: p.id,
    label: p.locationName,
    country: p.country,
    lat: p.latitude,
    lng: p.longitude,
    photos: [],
  }));

  const handleMarkerClick = (marker: TravelMarker) => {
    const pin = pins.find((p) => p.id === marker.id);
    if (pin) setSelectedPin(pin);
  };

  return (
    <>
      <NavBar />
      <div className="page-content">
        <TravelsMap
          label="// travels"
          markers={markers}
          onMarkerClick={handleMarkerClick}
        />
      </div>
      <Footer />

      {selectedPin && (
        <PinModal
          pinId={selectedPin.id}
          locationName={selectedPin.locationName}
          country={selectedPin.country}
          onClose={() => setSelectedPin(null)}
        />
      )}
    </>
  );
}
