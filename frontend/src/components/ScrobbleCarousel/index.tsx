import { useState, useEffect, useRef } from 'react'
import type { Track } from '../../services/lastfmService'
import './index.css'

const FALLBACK_IMG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%232a2a37'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='%23363646'%3E%E2%99%AA%3C/text%3E%3C/svg%3E`

interface Props {
  tracks: Track[]
  fetching: boolean
  lastUpdated: Date | null
  onLoadMore: () => void
  onRefresh: () => void
  canLoadMore: boolean
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function ScrobbleCarousel({
  tracks,
  fetching,
  lastUpdated,
  onLoadMore,
  onRefresh,
  canLoadMore,
}: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const historyRowRef = useRef<HTMLDivElement>(null)
  const prevTrackCount = useRef(tracks.length)

  // Scroll history row to end when new tracks are loaded via "load more"
  useEffect(() => {
    if (tracks.length > prevTrackCount.current && historyRowRef.current) {
      historyRowRef.current.scrollLeft = historyRowRef.current.scrollWidth
    }
    prevTrackCount.current = tracks.length
  }, [tracks.length])

  if (tracks.length === 0) {
    return <p className="scrobble-empty">no recent scrobbles.</p>
  }

  const current = tracks[0]
  const history = tracks.slice(1)
  const selectedTrack = selectedIdx !== null ? history[selectedIdx] : null

  const handleHistoryClick = (i: number) =>
    setSelectedIdx(prev => (prev === i ? null : i))

  const handleLoadMore = () => {
    setSelectedIdx(null)
    onLoadMore()
  }

  return (
    <div className="scrobble">
      <div className="scrobble-layout">

        {/* ── Currently playing ── */}
        <div className="scrobble-current">
          <p className="scrobble-section-label">currently playing:</p>
          <div className="scrobble-current-art-wrap">
            <img
              className="scrobble-current-img"
              src={current.imageUrl || FALLBACK_IMG}
              alt={`${current.album} album art`}
            />
            {current.nowPlaying && (
              <span className="scrobble-rec" aria-label="live now">live</span>
            )}
          </div>
          <div className="scrobble-current-info">
            <p className="scrobble-name">{current.name}</p>
            <p className="scrobble-meta">{current.artist} · {current.album}</p>
          </div>
        </div>

        <div className="scrobble-divider" aria-hidden="true" />

        {/* ── History ── */}
        <div className="scrobble-history">
          <p className="scrobble-section-label">previously listened to...</p>

          <div className="scrobble-history-row" ref={historyRowRef}>
            {history.map((track, i) => (
              <button
                key={i}
                className={`scrobble-history-item${selectedIdx === i ? ' scrobble-history-item--selected' : ''}`}
                onClick={() => handleHistoryClick(i)}
                aria-label={`${track.name} by ${track.artist}`}
                aria-pressed={selectedIdx === i}
              >
                <img
                  className="scrobble-history-img"
                  src={track.imageUrl || FALLBACK_IMG}
                  alt={track.album}
                />
              </button>
            ))}
          </div>

          <div className="scrobble-history-info">
            {selectedTrack ? (
              <>
                <p className="scrobble-name">{selectedTrack.name}</p>
                <p className="scrobble-meta">{selectedTrack.artist} · {selectedTrack.album}</p>
                {selectedTrack.playedAt && (
                  <p className="scrobble-time">{selectedTrack.playedAt}</p>
                )}
              </>
            ) : null}
          </div>

          <div className="scrobble-controls">
            {canLoadMore && (
              <button
                className="scrobble-btn"
                onClick={handleLoadMore}
                disabled={fetching}
              >
                {fetching ? 'loading...' : 'load more ›'}
              </button>
            )}
            <button
              className="scrobble-btn scrobble-btn--refresh"
              onClick={onRefresh}
              disabled={fetching}
            >
              <span className={fetching ? 'scrobble-spin' : ''}>↺</span>
              {fetching ? 'fetching...' : 'fetch scrobbles'}
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
  )
}
