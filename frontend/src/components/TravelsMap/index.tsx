import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { Map as LeafletMap } from "leaflet";
import { getCountryFlag } from "../../utils/countryFlag";
import type { GeoResult } from "../../utils/nominatim";
import { countries as allCountries } from "countries-list";
import { useLocationSearch } from "../../hooks/useLocationSearch";

import "leaflet/dist/leaflet.css";
import "./index.css";

const PIN_SVG = `<svg class="tmap-pin-svg" viewBox="0 0 24 32" width="24" height="32" xmlns="http://www.w3.org/2000/svg">
  <path class="tmap-pin-body" d="M12 1C6.477 1 2 5.477 2 11c0 3.6 1.863 6.77 4.688 8.627L12 31l5.312-11.373C20.137 17.77 22 14.6 22 11c0-5.523-4.477-10-10-10z"/>
  <circle class="tmap-pin-dot" cx="12" cy="11" r="3.5"/>
</svg>`;

const PENDING_SVG = `<svg class="tmap-pin-svg tmap-pin-svg--pending" viewBox="0 0 24 32" width="24" height="32" xmlns="http://www.w3.org/2000/svg">
  <path class="tmap-pin-body" d="M12 1C6.477 1 2 5.477 2 11c0 3.6 1.863 6.77 4.688 8.627L12 31l5.312-11.373C20.137 17.77 22 14.6 22 11c0-5.523-4.477-10-10-10z"/>
  <circle class="tmap-pin-dot" cx="12" cy="11" r="3.5"/>
</svg>`;

const PIN_ICON = L.divIcon({
  className: "",
  html: PIN_SVG,
  iconSize: [24, 32],
  iconAnchor: [12, 32],
  tooltipAnchor: [0, -34],
});

const PENDING_PIN_ICON = L.divIcon({
  className: "",
  html: PENDING_SVG,
  iconSize: [24, 32],
  iconAnchor: [12, 32],
  tooltipAnchor: [0, -34],
});

export interface TravelMarker {
  id: string;
  label: string;
  country?: string;
  lat: number;
  lng: number;
  photos: string[];
}

interface Props {
  label?: string;
  markers?: TravelMarker[];
  onMarkerClick?: (marker: TravelMarker) => void;
  onMapClick?: (lat: number, lng: number) => void;
  onLocationSelect?: (lat: number, lng: number) => void;
  pendingPin?: { lat: number; lng: number } | null;
}

const CARTO_VOYAGER =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const CARTO_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

/* ─── Inner helpers (must live inside MapContainer) ─────────── */

function MapCapture({
  mapRef,
}: {
  mapRef: React.MutableRefObject<LeafletMap | null>;
}) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

function MapClickHandler({
  onMapClick,
  suppressRef,
}: {
  onMapClick?: (lat: number, lng: number) => void;
  suppressRef: React.MutableRefObject<boolean>;
}) {
  useMapEvents({
    click(e) {
      if (suppressRef.current) {
        suppressRef.current = false;
        return;
      }
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Zooms so the world is slightly narrower than the container width.
// The ~15% side clearance (noWrap:true → page bg fills gaps) lets poles come into view.
// Re-runs whenever `trigger` changes (e.g. entering/exiting fullscreen).
function FillWorld({ trigger }: { trigger: unknown }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize();
      const w = map.getContainer().offsetWidth;
      const z = Math.log2(w / 256) + 0.55;
      map.setMinZoom(z);
      map.setView([5, 0], z, { animate: false });
    }, 100);
    return () => clearTimeout(t);
  }, [map, trigger]);
  return null;
}

/* ─── Icons ──────────────────────────────────────────────────── */
function IconExpand() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M0 0h4v1.5H1.5V4H0zm8 0h4v4h-1.5V1.5H8zM0 8h1.5v2.5H4V12H0zm10.5 0H12v4H8v-1.5h2.5z" />
    </svg>
  );
}
function IconCompress() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M4 0v4H0V2.5h2.5V0zm8 4H8V0h1.5v2.5H12zM4 12H2.5V9.5H0V8h4zm8-4v1.5H9.5V12H8V8z" />
    </svg>
  );
}

/* ─── Component ──────────────────────────────────────────────── */
export default function TravelsMap({
  label,
  markers = [],
  onMarkerClick,
  onMapClick,
  onLocationSelect,
  pendingPin,
}: Props) {
  const mapRef = useRef<LeafletMap | null>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const suppressMapClick = useRef(false);
  const [fullscreen, setFs] = useState(false);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const locInputRef = useRef<HTMLInputElement>(null);
  const locDropdownRef = useRef<HTMLDivElement>(null);

  const {
    locQuery,
    setLocQuery,
    locResults,
    locOpen,
    setLocOpen,
    locLoading,
    locHighlightIdx,
    setLocHighlightIdx,
  } = useLocationSearch(!!onLocationSelect);

  useEffect(() => {
    const fn = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", fn);
    return () => document.removeEventListener("fullscreenchange", fn);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        inputRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
      setHighlightIdx(-1);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        locInputRef.current?.contains(e.target as Node) ||
        locDropdownRef.current?.contains(e.target as Node)
      )
        return;
      setLocOpen(false);
      setLocHighlightIdx(-1);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setLocOpen, setLocHighlightIdx]);

  const toggleFs = useCallback(async () => {
    if (!document.fullscreenElement)
      await outerRef.current?.requestFullscreen();
    else await document.exitFullscreen();
  }, []);

  const countryCounts = useMemo(() => {
    const map = new Map<string, number>();
    markers.forEach((m) => {
      if (m.country) map.set(m.country, (map.get(m.country) ?? 0) + 1);
    });
    return map;
  }, [markers]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return Object.values(allCountries)
      .map((c) => c.name)
      .filter((name) => name.toLowerCase().includes(q))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => [name, countryCounts.get(name) ?? 0] as [string, number]);
  }, [countryCounts, query]);

  const handleSelect = useCallback(
    (country: string) => {
      const pts = markers.filter((m) => m.country === country);
      if (pts.length > 0 && mapRef.current) {
        const bounds = L.latLngBounds(pts.map((m) => [m.lat, m.lng]));
        mapRef.current.flyToBounds(bounds.pad(0.3), { maxZoom: 8 });
      }
      // no pins for this country — nothing to fly to
      setQuery("");
      setOpen(false);
      setHighlightIdx(-1);
    },
    [markers],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setHighlightIdx(-1);
      return;
    }
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = highlightIdx >= 0 ? highlightIdx : 0;
      if (results[idx]) handleSelect(results[idx][0]);
    }
  };

  const handleLocSelect = useCallback(
    (result: GeoResult) => {
      mapRef.current?.flyTo([result.lat, result.lng], 12);
      onLocationSelect?.(result.lat, result.lng);
      setLocQuery("");
      setLocOpen(false);
      setLocHighlightIdx(-1);
    },
    [onLocationSelect, setLocOpen, setLocHighlightIdx, setLocQuery],
  );

  const handleLocKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setLocOpen(false);
      setLocHighlightIdx(-1);
      return;
    }
    if (!locOpen || locResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setLocHighlightIdx((i) => Math.min(i + 1, locResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setLocHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = locHighlightIdx >= 0 ? locHighlightIdx : 0;
      if (locResults[idx]) handleLocSelect(locResults[idx]);
    }
  };

  const counterText =
    markers.length === 0
      ? "no places logged yet"
      : `${markers.length} place${markers.length === 1 ? "" : "s"} logged`;

  return (
    <div
      ref={outerRef}
      className={`tmap-outer${fullscreen ? " tmap-outer--fs" : ""}`}
    >
      <div className="tmap-header">
        <div className="tmap-header-left">
          {label && <span className="tmap-label">{label}</span>}
          <input
            ref={inputRef}
            className="tmap-search-input"
            value={query}
            placeholder={counterText}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setHighlightIdx(-1);
            }}
            onFocus={() => {
              if (query.trim()) setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            aria-label="Search by country"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div className="tmap-controls">
          {onLocationSelect && (
            <>
              <input
                ref={locInputRef}
                className="tmap-loc-input"
                value={locQuery}
                placeholder={locLoading ? "searching..." : "fly to location..."}
                onChange={(e) => {
                  setLocQuery(e.target.value);
                  setLocHighlightIdx(-1);
                }}
                onFocus={() => {
                  if (locResults.length > 0) setLocOpen(true);
                }}
                onKeyDown={handleLocKeyDown}
                aria-label="Fly to location"
                autoComplete="off"
                spellCheck={false}
              />
              <div className="tmap-divider" />
            </>
          )}
          <button
            className="tmap-btn"
            onClick={() => mapRef.current?.zoomOut()}
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            className="tmap-btn"
            onClick={() => mapRef.current?.zoomIn()}
            aria-label="Zoom in"
          >
            +
          </button>
          <div className="tmap-divider" />
          <button
            className="tmap-btn"
            onClick={toggleFs}
            aria-label="Toggle fullscreen"
          >
            {fullscreen ? <IconCompress /> : <IconExpand />}
          </button>
        </div>
      </div>

      <MapContainer
        center={[20, 0]}
        zoom={1.75}
        minZoom={1}
        maxZoom={10}
        zoomControl={false}
        attributionControl={true}
        className="tmap-canvas"
        worldCopyJump={false}
        maxBounds={[
          [-85.05, -180],
          [85.05, 180],
        ]}
        maxBoundsViscosity={1.0}
      >
        <MapCapture mapRef={mapRef} />
        <FillWorld trigger={fullscreen} />
        <MapClickHandler onMapClick={onMapClick} suppressRef={suppressMapClick} />

        <TileLayer
          url={CARTO_VOYAGER}
          attribution={CARTO_ATTR}
          subdomains="abcd"
          noWrap={true}
        />

        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={PIN_ICON}
            eventHandlers={{
              click: () => {
                suppressMapClick.current = true;
                onMarkerClick?.(m);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -2]} opacity={0.92}>
              {m.label}
            </Tooltip>
          </Marker>
        ))}
        {pendingPin && (
          <Marker
            position={[pendingPin.lat, pendingPin.lng]}
            icon={PENDING_PIN_ICON}
          >
            <Tooltip direction="top" offset={[0, -2]} opacity={0.92} permanent>
              new pin
            </Tooltip>
          </Marker>
        )}
      </MapContainer>

      {open && (
        <div ref={dropdownRef} className="tmap-dropdown">
          {results.length === 0 ? (
            <div className="tmap-dropdown-empty">no countries found</div>
          ) : (
            results.map(([country, count], i) => (
              <button
                key={country}
                className={`tmap-dropdown-item${i === highlightIdx ? " tmap-dropdown-item--hi" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(country);
                }}
                onMouseEnter={() => setHighlightIdx(i)}
              >
                <span className="tmap-dropdown-flag">
                  {getCountryFlag(country)}
                </span>
                <span className="tmap-dropdown-name">{country}</span>
                <span className="tmap-dropdown-count">
                  {count > 0
                    ? `${count} place${count === 1 ? "" : "s"} logged`
                    : "no places logged :("}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {onLocationSelect && locOpen && locResults.length > 0 && (
        <div ref={locDropdownRef} className="tmap-loc-dropdown">
          {locResults.map((r, i) => (
            <button
              key={`${r.lat},${r.lng}`}
              className={`tmap-dropdown-item${i === locHighlightIdx ? " tmap-dropdown-item--hi" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleLocSelect(r);
              }}
              onMouseEnter={() => setLocHighlightIdx(i)}
            >
              <span className="tmap-loc-result-name">{r.displayName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
