import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getRecentTracks, type Track } from "../../services/lastfmService";

const FALLBACK_ART = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%232a2a37'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='%23363646'%3E%E2%99%AA%3C/text%3E%3C/svg%3E`;

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

export default function MusicTile() {
  const navigate = useNavigate();
  const { track, loading } = useBentoMusic();
  const [rec, setRec] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleRec(e: React.FormEvent) {
    e.preventDefault();
    if (!rec.trim()) return;
    setRec("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

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
            <div className={`bento-eq-bars${track.nowPlaying ? "" : " bento-eq-bars--paused"}`}>
              <span className="bento-eq-bar" />
              <span className="bento-eq-bar" />
              <span className="bento-eq-bar" />
              <span className="bento-eq-bar" />
              <span className="bento-eq-bar" />
            </div>
          </div>
        </div>
      )}

      <form
        className="bento-rec-form"
        onSubmit={handleRec}
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <span className="bento-rec-thanks">thanks for the rec!</span>
        ) : (
          <>
            <input
              className="bento-rec-input"
              placeholder="recommend a track..."
              value={rec}
              onChange={(e) => setRec(e.target.value)}
            />
            <button className="bento-rec-submit" type="submit">→</button>
          </>
        )}
      </form>

      <span className="bento-cta">// music →</span>
    </div>
  );
}
