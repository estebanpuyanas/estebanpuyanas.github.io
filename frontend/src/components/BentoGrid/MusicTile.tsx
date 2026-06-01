import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBentoMusic } from "../../hooks/useBentoMusic";

const FALLBACK_ART = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%232a2a37'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='%23363646'%3E%E2%99%AA%3C/text%3E%3C/svg%3E`;

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
        <div className="bento-music-main">
          <div className="bento-music-content">
            <div className="bento-music-art-wrap">
              <img
                className="bento-music-art"
                src={track.imageUrl || FALLBACK_ART}
                alt={track.album}
              />
            </div>
            <div className="bento-music-info">
              <span className="bento-music-last">last scrobbled</span>
              <p className="bento-music-name">{track.name}</p>
              <p className="bento-music-meta">
                {track.artist} · {track.album}
              </p>
            </div>
          </div>
          <div className="bento-eq-panel">
            <div className="bento-wave-wrap" aria-hidden="true">
              {/* Wide sine — zero-crossing start, slow */}
              <svg className="bento-wave-svg bento-wave-svg--1" viewBox="0 0 800 180" preserveAspectRatio="none">
                <defs>
                  <filter id="bwf1" x="-5%" y="-120%" width="110%" height="340%">
                    <feGaussianBlur stdDeviation="4" result="b"/>
                    <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <path className="bento-wave-path bento-wave-path--1" filter="url(#bwf1)"
                  d="M0,90 C55,25 145,25 200,90 C255,155 345,155 400,90 C455,25 545,25 600,90 C655,155 745,155 800,90"/>
              </svg>
              {/* Wide sine — 90° phase offset, medium speed */}
              <svg className="bento-wave-svg bento-wave-svg--2" viewBox="0 0 800 180" preserveAspectRatio="none">
                <defs>
                  <filter id="bwf2" x="-5%" y="-120%" width="110%" height="340%">
                    <feGaussianBlur stdDeviation="3" result="b"/>
                    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <path className="bento-wave-path bento-wave-path--2" filter="url(#bwf2)"
                  d="M0,45 C67,45 133,135 200,135 C267,135 333,45 400,45 C467,45 533,135 600,135 C667,135 733,45 800,45"/>
              </svg>
              {/* Tight sine — 2× frequency, fast */}
              <svg className="bento-wave-svg bento-wave-svg--3" viewBox="0 0 800 180" preserveAspectRatio="none">
                <defs>
                  <filter id="bwf3" x="-5%" y="-80%" width="110%" height="260%">
                    <feGaussianBlur stdDeviation="2.5" result="b"/>
                    <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <path className="bento-wave-path bento-wave-path--3" filter="url(#bwf3)"
                  d="M0,90 C27,50 73,50 100,90 C127,130 173,130 200,90 C227,50 273,50 300,90 C327,130 373,130 400,90 C427,50 473,50 500,90 C527,130 573,130 600,90 C627,50 673,50 700,90 C727,130 773,130 800,90"/>
              </svg>
              {/* Tight sine — 2× frequency, 180° phase, fastest */}
              <svg className="bento-wave-svg bento-wave-svg--4" viewBox="0 0 800 180" preserveAspectRatio="none">
                <defs>
                  <filter id="bwf4" x="-5%" y="-60%" width="110%" height="220%">
                    <feGaussianBlur stdDeviation="1.5" result="b"/>
                    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <path className="bento-wave-path bento-wave-path--4" filter="url(#bwf4)"
                  d="M0,70 C33,70 67,110 100,110 C133,110 167,70 200,70 C233,70 267,110 300,110 C333,110 367,70 400,70 C433,70 467,110 500,110 C533,110 567,70 600,70 C633,70 667,110 700,110 C733,110 767,70 800,70"/>
              </svg>
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
            <button className="bento-rec-submit" type="submit">
              →
            </button>
          </>
        )}
      </form>

      <span className="bento-cta">// music →</span>
    </div>
  );
}
