import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTravelPins } from "../../hooks/useTravelPins";
import { useSlowLoad } from "../../hooks/useSlowLoad";

const CARTO_VOYAGER =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png";

const MINI_PIN_SVG = `<svg viewBox="0 0 24 32" width="12" height="16" xmlns="http://www.w3.org/2000/svg" style="overflow:visible"><path fill="var(--accent)" stroke="rgba(0,0,0,0.35)" stroke-width="1.5" d="M12 1C6.477 1 2 5.477 2 11c0 3.6 1.863 6.77 4.688 8.627L12 31l5.312-11.373C20.137 17.77 22 14.6 22 11c0-5.523-4.477-10-10-10z"/><circle fill="var(--bg-2)" cx="12" cy="11" r="3.5"/></svg>`;

const MINI_PIN_ICON = L.divIcon({
  className: "",
  html: MINI_PIN_SVG,
  iconSize: [12, 16],
  iconAnchor: [6, 16],
});

function FillWorldMini() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize();
      const w = map.getContainer().offsetWidth;
      const z = Math.max(0, Math.log2(w / 256) + 0.3);
      map.setMinZoom(0);
      map.setView([20, 0], z, { animate: false });
    }, 60);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function TravelTile() {
  const navigate = useNavigate();
  const { pins, loading } = useTravelPins();
  const slow = useSlowLoad(loading);
  const countryCount = new Set(pins.map((p) => p.country).filter(Boolean)).size;

  return (
    <div
      className="bento-tile bento-tile--clickable bento-travel"
      onClick={() => navigate("/travels")}
      role="button"
      aria-label="Go to travels page"
    >
      <div className="bento-travel-map-wrap">
        {loading && (
          <div className="bento-status">
            {slow ? "waking up server…" : "loading..."}
          </div>
        )}
        {!loading && (
          <MapContainer
            center={[20, 0]}
            zoom={0}
            zoomControl={false}
            attributionControl={false}
            dragging={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            touchZoom={false}
            keyboard={false}
            zoomSnap={0.1}
            className="bento-mini-map"
          >
            <FillWorldMini />
            <TileLayer url={CARTO_VOYAGER} subdomains="abcd" noWrap={true} />
            {pins.map((p) => (
              <Marker
                key={p.id}
                position={[p.latitude, p.longitude]}
                icon={MINI_PIN_ICON}
              />
            ))}
          </MapContainer>
        )}
      </div>

      <div className="bento-travel-stats">
        <span className="bento-travel-summary">
          <span className="bento-travel-num">{pins.length}</span>
          {" places · "}
          <span className="bento-travel-num">{countryCount}</span>
          {` ${countryCount === 1 ? "country" : "countries"}`}
        </span>
        <span className="bento-cta bento-cta--inline">// travels →</span>
      </div>
    </div>
  );
}
