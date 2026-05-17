import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import Terminal from "../Terminal";
import { getRecentTracks, type Track } from "../../services/lastfmService";
import { useTravelPins } from "../../hooks/useTravelPins";
import { useChess, type HeatmapCell } from "../../hooks/useChess";
import "./index.css";

const CARTO_VOYAGER =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

const FALLBACK_ART = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%232a2a37'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='%23363646'%3E%E2%99%AA%3C/text%3E%3C/svg%3E`;

const MINI_PIN_SVG = `<svg viewBox="0 0 24 32" width="12" height="16" xmlns="http://www.w3.org/2000/svg" style="overflow:visible"><path fill="var(--accent)" stroke="rgba(0,0,0,0.35)" stroke-width="1.5" d="M12 1C6.477 1 2 5.477 2 11c0 3.6 1.863 6.77 4.688 8.627L12 31l5.312-11.373C20.137 17.77 22 14.6 22 11c0-5.523-4.477-10-10-10z"/><circle fill="var(--bg-2)" cx="12" cy="11" r="3.5"/></svg>`;

const MINI_PIN_ICON = L.divIcon({
  className: "",
  html: MINI_PIN_SVG,
  iconSize: [12, 16],
  iconAnchor: [6, 16],
});

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const PERF_DISPLAY: {
  key: keyof NonNullable<ReturnType<typeof useChess>["user"]>["perfs"];
  label: string;
}[] = [
  { key: "bullet", label: "Bullet" },
  { key: "blitz", label: "Blitz" },
  { key: "rapid", label: "Rapid" },
  { key: "classical", label: "Classical" },
  { key: "puzzle", label: "Puzzle" },
];

const CELL_STRIDE = 13;

/* ─── Helpers ────────────────────────────────────────────────── */

function cellColor(cell: HeatmapCell): string {
  if (cell.future) return "transparent";
  if (cell.count === 0) return "var(--bg-3)";
  if (cell.count <= 2) return "var(--chess-heat-1)";
  if (cell.count <= 5) return "var(--chess-heat-2)";
  if (cell.count <= 9) return "var(--chess-heat-3)";
  return "var(--accent)";
}

function getMonthLabels(
  weeks: HeatmapCell[][],
): { idx: number; label: string }[] {
  const out: { idx: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    const m = new Date(week[0].date + "T12:00:00").getMonth();
    if (m !== lastMonth) {
      out.push({ idx: i, label: MONTHS[m] });
      lastMonth = m;
    }
  });
  return out;
}

/* ─── Music data hook ────────────────────────────────────────── */
function useBentoMusic() {
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () =>
      getRecentTracks(1)
        .then((t) => setTrack(t[0] ?? null))
        .catch(() => {});

    load().finally(() => setLoading(false));
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  return { track, loading };
}

/* ─── Map auto-fit ───────────────────────────────────────────── */
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

/* ─── Tiles ──────────────────────────────────────────────────── */
function MusicTile() {
  const navigate = useNavigate();
  const { track, loading } = useBentoMusic();

  return (
    <div
      className="bento-tile bento-tile--clickable bento-music"
      onClick={() => navigate("/music")}
      role="button"
      aria-label="Go to music page"
    >
      <span className="bento-label">// music</span>

      {loading && <div className="bento-status">loading...</div>}

      {!loading && !track && (
        <div className="bento-status">nothing playing</div>
      )}

      {!loading && track && (
        <div className="bento-music-content">
          <div className="bento-music-art-wrap">
            <img
              className="bento-music-art"
              src={track.imageUrl || FALLBACK_ART}
              alt={track.album}
            />
            {track.nowPlaying && <span className="bento-music-live">live</span>}
          </div>
          <div className="bento-music-info">
            {!track.nowPlaying && (
              <span className="bento-music-last">last played</span>
            )}
            <p className="bento-music-name">{track.name}</p>
            <p className="bento-music-meta">
              {track.artist} · {track.album}
            </p>
          </div>
        </div>
      )}

      <span className="bento-cta">// music →</span>
    </div>
  );
}

function TravelTile() {
  const navigate = useNavigate();
  const { pins, loading } = useTravelPins();
  const countryCount = new Set(pins.map((p) => p.country).filter(Boolean)).size;

  return (
    <div
      className="bento-tile bento-tile--clickable bento-travel"
      onClick={() => navigate("/travels")}
      role="button"
      aria-label="Go to travels page"
    >
      <div className="bento-travel-map-wrap">
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

function ChessTile() {
  const { user, heatmap, totalGames, loading, error } = useChess();
  const labels = heatmap.length ? getMonthLabels(heatmap) : [];

  return (
    <div className="bento-tile bento-chess">
      <div className="bento-chess-header">
        <span className="bento-label">// chess · goldenorion9</span>
        {!loading && !error && (
          <span className="bento-chess-total">
            {totalGames.toLocaleString()} games this year
          </span>
        )}
      </div>

      {/* Heatmap */}
      <div className="bento-heatmap-scroll">
        <div className="bento-heatmap-layout">
          {/* Day-of-week labels column */}
          <div className="bento-heatmap-days">
            {["M", "", "W", "", "F", "", ""].map((d, i) => (
              <span key={i} className="bento-heatmap-day">
                {d}
              </span>
            ))}
          </div>

          {/* Weeks + month labels */}
          <div className="bento-heatmap-weeks-col">
            <div className="bento-heatmap-months">
              {labels.map(({ idx, label }) => (
                <span
                  key={idx}
                  className="bento-heatmap-month"
                  style={{ left: `${idx * CELL_STRIDE}px` }}
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="bento-heatmap-grid">
              {(loading
                ? Array.from({ length: 53 }, () =>
                    Array.from({ length: 7 }, (_, d) => ({
                      date: "",
                      count: 0,
                      future: false,
                      skeleton: true,
                      _d: d,
                    })),
                  )
                : heatmap
              ).map((week, wi) => (
                <div key={wi} className="bento-heatmap-week">
                  {week.map((cell, di) => (
                    <div
                      key={di}
                      className={`bento-heatmap-cell${"skeleton" in cell && cell.skeleton ? " bento-heatmap-cell--skeleton" : ""}`}
                      style={
                        "skeleton" in cell && cell.skeleton
                          ? undefined
                          : { background: cellColor(cell as HeatmapCell) }
                      }
                      title={
                        "skeleton" in cell || (cell as HeatmapCell).future
                          ? undefined
                          : `${(cell as HeatmapCell).date}: ${(cell as HeatmapCell).count} game${(cell as HeatmapCell).count !== 1 ? "s" : ""}`
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ratings row */}
      <div className="bento-ratings">
        {PERF_DISPLAY.map(({ key, label }) => {
          const perf = user?.perfs[key];
          return (
            <div key={key} className="bento-rating-card">
              <span className="bento-rating-label">{label}</span>
              <span className="bento-rating-value">
                {loading ? "—" : (perf?.rating ?? "—")}
              </span>
              {!loading && perf && (
                <>
                  <span className="bento-rating-games">
                    {perf.games.toLocaleString()}g
                  </span>
                  <span
                    className={`bento-rating-prog ${
                      perf.prog > 0
                        ? "bento-rating-prog--up"
                        : perf.prog < 0
                          ? "bento-rating-prog--down"
                          : "bento-rating-prog--flat"
                    }`}
                  >
                    {perf.prog > 0
                      ? `↑ +${perf.prog}`
                      : perf.prog < 0
                        ? `↓ ${perf.prog}`
                        : "—"}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── BentoGrid ──────────────────────────────────────────────── */

export default function BentoGrid() {
  return (
    <div className="bento">
      <div className="bento-tile bento-terminal">
        <Terminal />
      </div>
      <MusicTile />
      <TravelTile />
      <ChessTile />
    </div>
  );
}
