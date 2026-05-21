import { useState, useEffect, useCallback, useMemo } from "react";
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
  flipH: boolean,
  flipV: boolean,
  mimeType: string,
): Promise<Blob> {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // Safe canvas size that fits the image at any rotation angle
  const safe = 2 * ((Math.max(image.width, image.height) / 2) * Math.sqrt(2));
  canvas.width = safe;
  canvas.height = safe;

  ctx.translate(safe / 2, safe / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
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

export default function ImageCropModal({ file, onConfirm, onCancel }: Props) {
  const imageSrc = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(imageSrc), [imageSrc]);

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await cropToBlob(
        imageSrc,
        croppedAreaPixels,
        rotation,
        flipH,
        flipV,
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
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
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
            <input
              type="range"
              className="icrop-slider"
              min={-45}
              max={45}
              step={0.5}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
            />
            <span className="icrop-val">
              {rotation > 0 ? `+${rotation}` : rotation}°
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
              >
                ↔ horizontal
              </button>
              <button
                className={`icrop-pill${flipV ? " icrop-pill--on" : ""}`}
                onClick={() => setFlipV((v) => !v)}
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
            disabled={processing}
          >
            {processing ? "processing..." : "crop & upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
