import { useState, useEffect, useRef } from "react";
import type { Track } from "../../services/lastfmService";
import "./index.css";

const FALLBACK_IMG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%232a2a37'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='%23363646'%3E%E2%99%AA%3C/text%3E%3C/svg%3E`;

const PAGE_SIZE = 4;

interface Props {
  tracks: Track[];
  fetching: boolean;
  lastUpdated: Date | null;
  onLoadMore: () => void;
  onRefresh: () => void;
  canLoadMore: boolean;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function ScrobbleCarousel({
  tracks,
  fetching,
  lastUpdated,
  onLoadMore,
  onRefresh,
  canLoadMore,
}: Props) {
  const [page, setPage] = useState(0);
  const prevTrackCount = useRef(tracks.length);

  // Reset to last page when new tracks load via "load more"
  useEffect(() => {
    if (tracks.length > prevTrackCount.current) {
      const history = tracks.slice(1);
      setPage(Math.floor((history.length - 1) / PAGE_SIZE));
    }
    prevTrackCount.current = tracks.length;
  }, [tracks.length]);

  if (tracks.length === 0) {
    return <p className="scrobble-empty">no recent scrobbles.</p>;
  }

  const current = tracks[0];
  const history = tracks.slice(1);
  const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const pageItems = history.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );

  const isLastPage = page === totalPages - 1;
  const canGoNext = !isLastPage || canLoadMore;

  const handlePrev = () => setPage((p) => Math.max(0, p - 1));

  const handleNext = () => {
    if (!isLastPage) {
      setPage((p) => p + 1);
    } else if (canLoadMore) {
      onLoadMore();
    }
  };

  return (
    <div className="scrobble">
      <div className="scrobble-layout">
        {/* ── History (left) ── */}
        <div className="scrobble-history">
          <p className="scrobble-section-label">previously listened to...</p>

          <div className="scrobble-history-grid">
            {pageItems.map((track, i) => (
              <div key={page * PAGE_SIZE + i} className="scrobble-hist-item">
                <img
                  className="scrobble-hist-img"
                  src={track.imageUrl || FALLBACK_IMG}
                  alt={track.album}
                />
                <p className="scrobble-hist-name">{track.name}</p>
                <p className="scrobble-hist-meta">
                  {track.artist} · {track.album}
                </p>
                {track.playedAt && (
                  <p className="scrobble-hist-time">{track.playedAt}</p>
                )}
              </div>
            ))}
            {/* Fill empty slots so layout stays stable */}
            {Array.from({ length: PAGE_SIZE - pageItems.length }).map(
              (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="scrobble-hist-item scrobble-hist-item--empty"
                />
              ),
            )}
          </div>

          <div className="scrobble-history-nav">
            <button
              className="scrobble-nav-btn"
              onClick={handlePrev}
              disabled={page === 0}
              aria-label="previous page"
            >
              ‹
            </button>
            <span className="scrobble-nav-page">
              {page + 1} / {totalPages}
            </span>
            <button
              className="scrobble-nav-btn"
              onClick={handleNext}
              disabled={!canGoNext || fetching}
              aria-label={isLastPage ? "load more" : "next page"}
            >
              {fetching && isLastPage ? "…" : "›"}
            </button>
          </div>
        </div>

        <div className="scrobble-divider" aria-hidden="true" />

        {/* ── Currently playing (right) ── */}
        <div className="scrobble-current">
          <p className="scrobble-section-label">currently playing:</p>
          <div className="scrobble-current-art-wrap">
            <img
              className="scrobble-current-img"
              src={current.imageUrl || FALLBACK_IMG}
              alt={`${current.album} album art`}
            />
            {current.nowPlaying && (
              <span className="scrobble-rec" aria-label="live now">
                live
              </span>
            )}
          </div>
          <div className="scrobble-current-info">
            <p className="scrobble-name">{current.name}</p>
            <p className="scrobble-meta">
              {current.artist} · {current.album}
            </p>
          </div>

          <div className="scrobble-controls">
            <button
              className="scrobble-btn scrobble-btn--refresh"
              onClick={onRefresh}
              disabled={fetching}
            >
              <span className={fetching ? "scrobble-spin" : ""}>↺</span>
              {fetching ? "fetching..." : "fetch scrobbles"}
            </button>
            {lastUpdated && !fetching && (
              <span className="scrobble-updated">
                updated {formatTime(lastUpdated)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
