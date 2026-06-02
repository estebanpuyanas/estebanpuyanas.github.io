import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import "./index.css";

interface Props {
  file: File;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

const ASPECTS = [
  { label: "free", value: undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
  { label: "16:9", value: 16 / 9 },
] as const;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.src = src;
  });
}

async function cropToBlob(
  src: string,
  pixels: Area,
  rotation: number,
  mimeType: string,
): Promise<Blob> {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const safe = 2 * ((Math.max(image.width, image.height) / 2) * Math.sqrt(2));
  canvas.width = safe;
  canvas.height = safe;

  ctx.translate(safe / 2, safe / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(
    pixels.x + safe / 2 - image.width / 2,
    pixels.y + safe / 2 - image.height / 2,
    pixels.width,
    pixels.height,
  );

  canvas.width = pixels.width;
  canvas.height = pixels.height;
  ctx.putImageData(data, 0, 0);

  const quality = mimeType === "image/png" ? undefined : 0.92;
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      mimeType,
      quality,
    ),
  );
}

async function buildFlippedSrc(
  src: string,
  flipH: boolean,
  flipV: boolean,
): Promise<string | null> {
  if (!flipH && !flipV) return null;
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(img.width / 2, img.height / 2);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob ? URL.createObjectURL(blob) : null),
      "image/jpeg",
      0.95,
    );
  });
}

export default function ImageCropModal({ file, onConfirm, onCancel }: Props) {
  const imageSrc = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(imageSrc), [imageSrc]);

  // Blob URLs generated for flip previews — cleaned up on unmount
  const flipBlobUrls = useRef<string[]>([]);
  useEffect(
    () => () => {
      flipBlobUrls.current.forEach(URL.revokeObjectURL);
    },
    [],
  );

  const [displaySrc, setDisplaySrc] = useState(imageSrc);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [snapRotation, setSnapRotation] = useState(0); // multiples of 90°
  const [fineRotation, setFineRotation] = useState(0); // slider -45..+45
  const effectiveRotation = snapRotation + fineRotation;
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [flipping, setFlipping] = useState(false);

  // Re-compute displaySrc whenever flip state changes
  useEffect(() => {
    let cancelled = false;
    setFlipping(true);
    buildFlippedSrc(imageSrc, flipH, flipV).then((url) => {
      if (cancelled) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      setDisplaySrc((prev) => {
        if (prev !== imageSrc) {
          flipBlobUrls.current = flipBlobUrls.current.filter((u) => u !== prev);
          URL.revokeObjectURL(prev);
        }
        const next = url ?? imageSrc;
        if (url) flipBlobUrls.current.push(url);
        return next;
      });
      // Reset crop position since the image source changed
      setCrop({ x: 0, y: 0 });
      setFlipping(false);
    });
    return () => {
      cancelled = true;
    };
  }, [flipH, flipV, imageSrc]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      // Flip is already baked into displaySrc, so only pass rotation
      const blob = await cropToBlob(
        displaySrc,
        croppedAreaPixels,
        effectiveRotation,
        file.type || "image/jpeg",
      );
      onConfirm(blob);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="icrop-backdrop" onClick={onCancel}>
      <div className="icrop-modal" onClick={(e) => e.stopPropagation()}>
        <div className="icrop-header">
          <span className="admin-form-label">edit image</span>
          <button className="admin-btn admin-btn--ghost" onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className="icrop-canvas">
          <Cropper
            image={displaySrc}
            crop={crop}
            zoom={zoom}
            rotation={effectiveRotation}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{ containerStyle: { background: "var(--bg)" } }}
          />
        </div>

        <div className="icrop-controls">
          <div className="icrop-row">
            <span className="icrop-label">aspect</span>
            <div className="icrop-pills">
              {ASPECTS.map((opt) => (
                <button
                  key={opt.label}
                  className={`icrop-pill${aspect === opt.value ? " icrop-pill--on" : ""}`}
                  onClick={() => setAspect(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="icrop-row">
            <span className="icrop-label">rotate</span>
            <button
              className="icrop-step-btn"
              onClick={() => setSnapRotation((r) => r - 90)}
              title="Rotate 90° counter-clockwise"
            >
              ↺
            </button>
            <input
              type="range"
              className="icrop-slider"
              min={-45}
              max={45}
              step={0.5}
              value={fineRotation}
              onChange={(e) => setFineRotation(Number(e.target.value))}
            />
            <button
              className="icrop-step-btn"
              onClick={() => setSnapRotation((r) => r + 90)}
              title="Rotate 90° clockwise"
            >
              ↻
            </button>
            <span className="icrop-val">
              {effectiveRotation > 0
                ? `+${effectiveRotation}`
                : effectiveRotation}
              °
            </span>
          </div>

          <div className="icrop-row">
            <span className="icrop-label">zoom</span>
            <input
              type="range"
              className="icrop-slider"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
            <span className="icrop-val">{zoom.toFixed(2)}×</span>
          </div>

          <div className="icrop-row">
            <span className="icrop-label">flip</span>
            <div className="icrop-pills">
              <button
                className={`icrop-pill${flipH ? " icrop-pill--on" : ""}`}
                onClick={() => setFlipH((v) => !v)}
                disabled={flipping}
              >
                ↔ horizontal
              </button>
              <button
                className={`icrop-pill${flipV ? " icrop-pill--on" : ""}`}
                onClick={() => setFlipV((v) => !v)}
                disabled={flipping}
              >
                ↕ vertical
              </button>
            </div>
          </div>
        </div>

        <div className="icrop-actions">
          <button className="admin-btn admin-btn--ghost" onClick={onCancel}>
            cancel
          </button>
          <button
            className="admin-btn admin-btn--primary"
            onClick={handleConfirm}
            disabled={processing || flipping}
          >
            {processing ? "processing..." : "crop & upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
