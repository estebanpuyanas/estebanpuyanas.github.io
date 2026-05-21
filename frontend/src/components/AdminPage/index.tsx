import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import TravelsMap from "../TravelsMap";
import {
  createPin,
  deletePin,
  getPinImages,
  uploadPinImage,
  updateImageCaption,
  deletePinImage,
  syncPinImages,
  getCloudinaryFolders,
  type Pin,
  type PinImage,
} from "../../services/travelPinService";
import { useTravelPins } from "../../hooks/useTravelPins";
import { useTheme } from "../../hooks/useTheme";
import { reverseGeocode } from "../../utils/nominatim";
import "./index.css";

const TOKEN_KEY = "ep-admin-token";

const FUNNY_ERRORS = [
  "so close! ...probably not. try again.",
  "nope. but hey, points for persistence!",
  "to get the first 10 characters of the token, simply solve: ∫₀^π sin(x²)·e^(x³) dx, then SHA-256 the result. you're welcome.",
  "have you tried: being me? works every time.",
  "warm... warmer... nope, cold. very cold.",
  "you're literally one character off!",
  "hint: the token contains at least one character. that's all you get.",
  "error 418: I'm a teapot and you're also wrong.",
  "our advanced AI has analyzed your submission and determined it is, in fact, not the token.",
  "at this point the commitment is genuinely impressive. still no.",
  "token not found in database of valid tokens (there is exactly one valid token).",
  "maybe the token was the friends we made along the way.",
  "the token is stored somewhere safe. your brain is not that place.",
  "fun fact: typing the wrong token 13 times in a row does NOT unlock a secret mode. please stop.",
  "All this time and determination could have been spent applying to jobs, maybe consider this: https://careers.mcdonalds.com/",
];

function getFunnyError(attempt: number, snippet: string): string {
  if (attempt === 3) {
    return `oh interesting — "${snippet}…" yeah, no.`;
  }
  return FUNNY_ERRORS[(attempt - 1) % FUNNY_ERRORS.length];
}

function getStoredToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    // eslint-disable-next-line no-console
    if (import.meta.env.DEV)
      console.warn("[AdminPage] localStorage read failed");
    return "";
  }
}

function storeToken(t: string) {
  try {
    localStorage.setItem(TOKEN_KEY, t);
  } catch {
    // eslint-disable-next-line no-console
    if (import.meta.env.DEV)
      console.warn("[AdminPage] localStorage write failed");
  }
}

function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // eslint-disable-next-line no-console
    if (import.meta.env.DEV)
      console.warn("[AdminPage] localStorage delete failed");
  }
}

function formatDate(raw: string): string {
  if (!raw) return "";
  try {
    return new Date(raw).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return raw;
  }
}

type PanelState =
  | { mode: "idle" }
  | { mode: "new"; lat: number; lng: number; geocoding: boolean }
  | { mode: "selected"; pin: Pin }
  | { mode: "editing"; pin: Pin };

export default function AdminPage() {
  const navigate = useNavigate();
  useTheme();

  const [token, setToken] = useState(getStoredToken);
  const [tokenInput, setTokenInput] = useState("");
  const [authError, setAuthError] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lastTokenSnippet, setLastTokenSnippet] = useState("");

  const { pins, addPin, removePin } = useTravelPins();

  const [panel, setPanel] = useState<PanelState>({ mode: "idle" });
  const [form, setForm] = useState({
    locationName: "",
    country: "",
    cloudinaryFolder: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [folders, setFolders] = useState<string[]>([]);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);

  // ── Edit-mode state ───────────────────────────────────────────
  const [pinImages, setPinImages] = useState<PinImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingImage, setEditingImage] = useState<PinImage | null>(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [captionSaving, setCaptionSaving] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;
    getCloudinaryFolders(token)
      .then(setFolders)
      .catch(() => {});
  }, [token]);

  const editingPinId = panel.mode === "editing" ? panel.pin.id : null;
  useEffect(() => {
    if (!editingPinId) {
      setPinImages([]);
      setBrokenImages(new Set());
      return;
    }
    setImagesLoading(true);
    setBrokenImages(new Set());
    setSubmitSuccess("");
    getPinImages(editingPinId)
      .then(setPinImages)
      .catch(() => {})
      .finally(() => setImagesLoading(false));
  }, [editingPinId]);

  const markers = pins.map((p) => ({
    id: p.id,
    label: p.locationName,
    lat: p.latitude,
    lng: p.longitude,
    photos: p.images.map((i) => i.cloudinarySecureUrl),
  }));

  // ── Auth ──────────────────────────────────────────────────────
  const handleLogin = () => {
    if (!tokenInput.trim()) return;
    storeToken(tokenInput.trim());
    setToken(tokenInput.trim());
    setTokenInput("");
    setAuthError(false);
  };

  const handleLogout = () => {
    clearToken();
    setToken("");
    navigate("/");
  };

  const handleAuthError = () => {
    setLastTokenSnippet(token.slice(0, 6));
    clearToken();
    setToken("");
    setAuthError(true);
    setFailedAttempts((n) => n + 1);
  };

  // ── Map interactions ──────────────────────────────────────────
  const handleMapClick = async (lat: number, lng: number) => {
    setPanel({ mode: "new", lat, lng, geocoding: true });
    setForm({ locationName: "", country: "", cloudinaryFolder: "" });
    setSubmitError("");
    setSubmitSuccess("");

    const geo = await reverseGeocode(lat, lng);
    setPanel((prev) =>
      prev.mode === "new" ? { ...prev, geocoding: false } : prev,
    );
    if (geo) {
      setForm((f) => ({
        ...f,
        locationName: geo.locationName,
        country: geo.country,
      }));
    }
  };

  const handleMarkerClick = (marker: {
    id: string;
    label: string;
    lat: number;
    lng: number;
  }) => {
    const pin = pins.find((p) => p.id === marker.id);
    if (!pin) return;
    setPanel({ mode: "selected", pin });
    setSubmitError("");
    setSubmitSuccess("");
  };

  // ── Create ────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (panel.mode !== "new") return;
    if (!form.locationName || !form.country || !form.cloudinaryFolder) {
      setSubmitError("All fields are required.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const pin: Pin = await createPin(
        {
          locationName: form.locationName,
          country: form.country,
          latitude: panel.lat,
          longitude: panel.lng,
          cloudinaryFolder: form.cloudinaryFolder,
        },
        token,
      );
      addPin(pin);
      setSubmitSuccess(`"${pin.locationName}" added.`);
      setPanel({ mode: "idle" });
      setForm({ locationName: "", country: "", cloudinaryFolder: "" });
    } catch (err) {
      if (err instanceof Error && err.message === "unauthorized")
        handleAuthError();
      else setSubmitError("Failed to save pin. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (panel.mode !== "selected") return;
    const { pin } = panel;
    if (!window.confirm(`Delete "${pin.locationName}"? This cannot be undone.`))
      return;
    setDeleting(true);
    try {
      await deletePin(pin.id, token);
      removePin(pin.id);
      setPanel({ mode: "idle" });
      setSubmitSuccess(`"${pin.locationName}" deleted.`);
    } catch (err) {
      if (err instanceof Error && err.message === "unauthorized")
        handleAuthError();
      else setSubmitError("Failed to delete pin.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Image upload ──────────────────────────────────────────────
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || panel.mode !== "editing") return;
    e.target.value = "";
    setUploadingImage(true);
    setSubmitError("");
    try {
      const img = await uploadPinImage(panel.pin.id, file, token);
      setPinImages((prev) => [img, ...prev]);
    } catch (err) {
      if (err instanceof Error && err.message === "unauthorized")
        handleAuthError();
      else setSubmitError("Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Caption save ──────────────────────────────────────────────
  const handleSaveCaption = async () => {
    if (!editingImage || panel.mode !== "editing") return;
    setCaptionSaving(true);
    try {
      await updateImageCaption(
        panel.pin.id,
        editingImage.cloudinaryPublicId,
        captionDraft,
        token,
      );
      setPinImages((prev) =>
        prev.map((img) =>
          img.cloudinaryPublicId === editingImage.cloudinaryPublicId
            ? { ...img, caption: captionDraft }
            : img,
        ),
      );
      setEditingImage(null);
    } catch (err) {
      if (err instanceof Error && err.message === "unauthorized")
        handleAuthError();
    } finally {
      setCaptionSaving(false);
    }
  };

  // ── Image delete ──────────────────────────────────────────────
  const handleDeleteImage = async () => {
    if (!editingImage || panel.mode !== "editing") return;
    if (!window.confirm("Delete this image? This cannot be undone.")) return;
    setDeletingImage(true);
    try {
      await deletePinImage(
        panel.pin.id,
        editingImage.cloudinaryPublicId,
        token,
      );
      setPinImages((prev) =>
        prev.filter(
          (img) => img.cloudinaryPublicId !== editingImage.cloudinaryPublicId,
        ),
      );
      setEditingImage(null);
    } catch (err) {
      if (err instanceof Error && err.message === "unauthorized")
        handleAuthError();
      else setSubmitError("Failed to delete image.");
    } finally {
      setDeletingImage(false);
    }
  };

  // ── Sync with Cloudinary ──────────────────────────────────────
  const handleSync = async () => {
    if (panel.mode !== "editing") return;
    setSyncing(true);
    setSubmitError("");
    try {
      const pruned = await syncPinImages(panel.pin.id, token);
      // Re-fetch images so the list reflects reality
      const fresh = await getPinImages(panel.pin.id);
      setPinImages(fresh);
      setBrokenImages(new Set());
      if (pruned > 0)
        setSubmitSuccess(
          `Synced! Removed ${pruned} deleted image${pruned === 1 ? "" : "s"}.`,
        );
    } catch (err) {
      if (err instanceof Error && err.message === "unauthorized")
        handleAuthError();
      else setSubmitError("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  // ── Gate screen ───────────────────────────────────────────────
  if (!token) {
    return (
      <div className="admin-gate">
        <div className="admin-gate-box">
          <p className="admin-gate-label">// admin</p>
          <p className="admin-gate-hint">
            Hmmm... Are you sure you should be here? <br /> enter your admin
            token to continue:
          </p>
          {authError && (
            <p className="admin-gate-error">
              token rejected — {getFunnyError(failedAttempts, lastTokenSnippet)}
            </p>
          )}
          <form
            className="admin-gate-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <input
              className="admin-input"
              type="password"
              placeholder="admin token"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              autoFocus
            />
            <button className="admin-btn admin-btn--primary" type="submit">
              unlock
              <br />
            </button>
            <br />
            <p className="admin-gate-hint">
              Psst... if your token got rejected maybe its best you just...
            </p>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={() => navigate(-1)}
            >
              ← go back
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Right panel content ───────────────────────────────────────
  const renderPanel = () => {
    if (panel.mode === "idle") {
      return (
        <div className="admin-panel-idle">
          <p className="admin-panel-idle-text">
            click the map to drop a new pin, or click an existing pin to manage
            it.
          </p>
          {submitSuccess && <p className="admin-success">{submitSuccess}</p>}
        </div>
      );
    }

    if (panel.mode === "selected") {
      const { pin } = panel;
      return (
        <div className="admin-panel-section">
          <div className="admin-panel-header">
            <p className="admin-form-label">pin info</p>
            <button
              className="admin-btn admin-btn--ghost"
              onClick={() => setPanel({ mode: "idle" })}
            >
              ✕
            </button>
          </div>

          <div className="admin-pin-info">
            <p className="admin-pin-name">{pin.locationName}</p>
            <p className="admin-pin-country">{pin.country}</p>
            <p className="admin-coord-val">
              {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
            </p>
          </div>

          {submitError && <p className="admin-error">{submitError}</p>}

          <button
            className="admin-btn admin-btn--danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "deleting..." : "delete pin"}
          </button>
          <button
            className="admin-btn admin-btn--ghost"
            onClick={() => {
              setPanel({ mode: "editing", pin });
              setSubmitError("");
            }}
          >
            edit pin
          </button>
        </div>
      );
    }

    if (panel.mode === "editing") {
      const { pin } = panel;
      const visibleImages = pinImages.filter(
        (img) => !brokenImages.has(img.cloudinaryPublicId),
      );
      return (
        <div className="admin-panel-section">
          <div className="admin-panel-header">
            <p className="admin-form-label">edit pin</p>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button
                className="admin-btn admin-btn--ghost"
                onClick={handleSync}
                disabled={syncing}
                title="Remove DB records for images deleted from Cloudinary dashboard"
              >
                {syncing ? "syncing..." : "sync"}
              </button>
              <button
                className="admin-btn admin-btn--ghost"
                onClick={() => {
                  setPanel({ mode: "selected", pin });
                  setSubmitError("");
                  setSubmitSuccess("");
                }}
              >
                ← back
              </button>
            </div>
          </div>

          <div className="admin-pin-info">
            <p className="admin-pin-name">{pin.locationName}</p>
            <p className="admin-pin-country">{pin.country}</p>
            <p className="admin-coord-val">
              {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
            </p>
          </div>

          <button
            className="admin-btn admin-btn--ghost admin-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
          >
            {uploadingImage ? "uploading..." : "+ upload image"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleUploadImage}
          />

          {submitError && <p className="admin-error">{submitError}</p>}
          {submitSuccess && <p className="admin-success">{submitSuccess}</p>}

          {imagesLoading ? (
            <p className="admin-images-hint">loading images...</p>
          ) : visibleImages.length === 0 ? (
            <p className="admin-images-hint">
              no images yet. Use the button above to upload some photos from
              this location!
            </p>
          ) : (
            <div className="admin-image-grid">
              {visibleImages.map((img) => (
                <div key={img.cloudinaryPublicId} className="admin-image-card">
                  <img
                    src={img.cloudinarySecureUrl}
                    alt={img.caption || ""}
                    className="admin-image-thumb"
                    onError={() =>
                      setBrokenImages(
                        (prev) => new Set([...prev, img.cloudinaryPublicId]),
                      )
                    }
                  />
                  <button
                    className="admin-image-edit-btn"
                    onClick={() => {
                      setEditingImage(img);
                      setCaptionDraft(img.caption);
                    }}
                    title="edit caption"
                  >
                    ✏
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // mode === "new"
    return (
      <form className="admin-panel-section" onSubmit={handleCreate}>
        <div className="admin-panel-header">
          <p className="admin-form-label">new pin</p>
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => setPanel({ mode: "idle" })}
          >
            ✕
          </button>
        </div>

        <div className="admin-coords">
          <span className="admin-coord-val">
            {panel.lat.toFixed(4)}, {panel.lng.toFixed(4)}
          </span>
        </div>

        <label className="admin-label">
          location name
          <div className="admin-input-wrap">
            <input
              className="admin-input"
              type="text"
              placeholder={panel.geocoding ? "looking up..." : "e.g. Tokyo"}
              value={form.locationName}
              onChange={(e) =>
                setForm((f) => ({ ...f, locationName: e.target.value }))
              }
              disabled={panel.geocoding}
            />
            {panel.geocoding && (
              <span className="admin-geocoding-spinner">↻</span>
            )}
          </div>
        </label>

        <label className="admin-label">
          country
          <input
            className="admin-input"
            type="text"
            placeholder={panel.geocoding ? "looking up..." : "e.g. Japan"}
            value={form.country}
            onChange={(e) =>
              setForm((f) => ({ ...f, country: e.target.value }))
            }
            disabled={panel.geocoding}
          />
        </label>

        <label className="admin-label">
          cloudinary folder
          {(() => {
            const q = form.cloudinaryFolder.toLowerCase();
            const matches = folders.filter((f) => f.toLowerCase().includes(q));
            const isNew =
              form.cloudinaryFolder !== "" &&
              !folders.includes(form.cloudinaryFolder);
            const showList =
              showFolderDropdown && (isNew || matches.length > 0);
            return (
              <div className="admin-combobox">
                <input
                  className="admin-input"
                  type="text"
                  placeholder="e.g. travels/tokyo"
                  value={form.cloudinaryFolder}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      cloudinaryFolder: e.target.value,
                    }))
                  }
                  onFocus={() => setShowFolderDropdown(true)}
                  onBlur={() =>
                    setTimeout(() => setShowFolderDropdown(false), 150)
                  }
                  autoComplete="off"
                />
                {showList && (
                  <ul className="admin-combobox-list">
                    {isNew && (
                      <li
                        className="admin-combobox-item admin-combobox-item--create"
                        onMouseDown={() => setShowFolderDropdown(false)}
                      >
                        create: {form.cloudinaryFolder}
                      </li>
                    )}
                    {matches.map((f) => (
                      <li
                        key={f}
                        className="admin-combobox-item"
                        onMouseDown={() => {
                          setForm((prev) => ({
                            ...prev,
                            cloudinaryFolder: f,
                          }));
                          setShowFolderDropdown(false);
                        }}
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })()}
        </label>

        {submitError && <p className="admin-error">{submitError}</p>}

        <button
          className="admin-btn admin-btn--primary"
          type="submit"
          disabled={submitting || panel.geocoding}
        >
          {submitting ? "saving..." : "save pin"}
        </button>
      </form>
    );
  };

  // ── Full admin UI ─────────────────────────────────────────────
  return (
    <div className="admin-layout">
      <div className="admin-header">
        <span className="admin-header-label">// admin — travel pins</span>
        <button className="admin-btn admin-btn--ghost" onClick={handleLogout}>
          log out
        </button>
      </div>

      <div className="admin-body">
        <div className="admin-map-wrap">
          <TravelsMap
            markers={markers}
            onMapClick={handleMapClick}
            onMarkerClick={handleMarkerClick}
            onLocationSelect={handleMapClick}
            pendingPin={
              panel.mode === "new" ? { lat: panel.lat, lng: panel.lng } : null
            }
          />
        </div>
        <div className="admin-side">{renderPanel()}</div>
      </div>

      {editingImage && (
        <div
          className="admin-img-modal-backdrop"
          onClick={() => setEditingImage(null)}
        >
          <div className="admin-img-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-img-modal-header">
              <p className="admin-form-label">edit image</p>
              <button
                className="admin-btn admin-btn--ghost"
                onClick={() => setEditingImage(null)}
              >
                ✕
              </button>
            </div>

            <img
              src={editingImage.cloudinarySecureUrl}
              alt={editingImage.caption || ""}
              className="admin-img-modal-image"
            />

            {editingImage.uploadedAt && (
              <p className="admin-img-modal-date">
                uploaded {formatDate(editingImage.uploadedAt)}
              </p>
            )}

            <label className="admin-label">
              caption
              <textarea
                className="admin-input admin-caption-input"
                value={captionDraft}
                onChange={(e) => setCaptionDraft(e.target.value)}
                placeholder="add a caption..."
                rows={3}
              />
            </label>

            <div className="admin-img-modal-actions">
              <button
                className="admin-btn admin-btn--danger"
                onClick={handleDeleteImage}
                disabled={deletingImage || captionSaving}
              >
                {deletingImage ? "deleting..." : "delete image"}
              </button>
              <button
                className="admin-btn admin-btn--ghost"
                onClick={() => setEditingImage(null)}
                disabled={captionSaving || deletingImage}
              >
                cancel
              </button>
              <button
                className="admin-btn admin-btn--primary"
                onClick={handleSaveCaption}
                disabled={captionSaving || deletingImage}
              >
                {captionSaving ? "saving..." : "save caption"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
