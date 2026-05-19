import { useEffect, useState, useCallback } from "react";
import { getPinImages, type PinImage } from "../../services/travelPinService";
import "./index.css";

interface Props {
  pinId: string;
  locationName: string;
  country: string;
  onClose: () => void;
}

export default function PinModal({ pinId, locationName, country, onClose }: Props) {
  const [images, setImages] = useState<PinImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setCurrent(0);
    getPinImages(pinId)
      .then(setImages)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [pinId]);

  const prev = useCallback(() => {
    setCurrent((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && images.length > 1) prev();
      if (e.key === "ArrowRight" && images.length > 1) next();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, prev, next, images.length]);

  const img = images[current];

  return (
    <div className="pmodal-backdrop" onClick={onClose}>
      <div className="pmodal-card" onClick={(e) => e.stopPropagation()}>
        <div className="pmodal-header">
          <div className="pmodal-title-group">
            <span className="pmodal-location">{locationName}</span>
            <span className="pmodal-country">{country}</span>
          </div>
          <button className="pmodal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="pmodal-body">
          {loading && (
            <div className="pmodal-status">
              <span className="pmodal-status-text">loading...</span>
            </div>
          )}

          {!loading && error && (
            <div className="pmodal-status">
              <span className="pmodal-status-text pmodal-status-text--error">
                failed to load images
              </span>
            </div>
          )}

          {!loading && !error && images.length === 0 && (
            <div className="pmodal-status">
              <span className="pmodal-status-text">no images yet</span>
            </div>
          )}

          {!loading && !error && images.length > 0 && (
            <>
              <div className="pmodal-img-wrap">
                {images.length > 1 && (
                  <button
                    className="pmodal-arrow pmodal-arrow--left"
                    onClick={prev}
                    aria-label="Previous image"
                  >
                    ←
                  </button>
                )}
                <img
                  key={current}
                  src={img.cloudinarySecureUrl}
                  alt={img.caption || locationName}
                  className="pmodal-img"
                />
                {images.length > 1 && (
                  <button
                    className="pmodal-arrow pmodal-arrow--right"
                    onClick={next}
                    aria-label="Next image"
                  >
                    →
                  </button>
                )}
              </div>

              <div className="pmodal-footer">
                {images.length > 1 && (
                  <span className="pmodal-counter">
                    {current + 1} / {images.length}
                  </span>
                )}
                {img.caption && (
                  <p className="pmodal-caption">{img.caption}</p>
                )}
                {img.uploadedAt && (
                  <span className="pmodal-date">{img.uploadedAt}</span>
                )}
              </div>

              {images.length > 1 && (
                <div className="pmodal-dots">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      className={`pmodal-dot${i === current ? " pmodal-dot--active" : ""}`}
                      onClick={() => setCurrent(i)}
                      aria-label={`Go to image ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
