import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import TravelsMap from "../TravelsMap";
import AdminGate from "../AdminGate";
import {
  createPin,
  deletePin,
  updatePinFolder,
  updatePinLocationName,
  type Pin,
} from "../../services/travelPinService";
import { useTravelPins } from "../../hooks/useTravelPins";
import { useTheme } from "../../hooks/useTheme";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import { useCloudinaryFolders } from "../../hooks/useCloudinaryFolders";
import { useAdminPinImages } from "../../hooks/useAdminPinImages";
import { reverseGeocode } from "../../utils/nominatim";
import ImageCropModal from "../ImageCropModal";
import "./index.css";

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

export default function AdminTravelsPage() {
  const navigate = useNavigate();
  useTheme();

  const {
    token,
    tokenInput,
    setTokenInput,
    authError,
    failedAttempts,
    lastTokenSnippet,
    handleLogin,
    handleLogout,
    handleAuthError,
  } = useAdminAuth(() => navigate("/"));

  const { pins, addPin, removePin } = useTravelPins();
  const { folders } = useCloudinaryFolders(token);

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

  const [showFolderDropdown, setShowFolderDropdown] = useState(false);

  // ── Folder editing state ──────────────────────────────────────
  const [editingFolder, setEditingFolder] = useState(false);
  const [folderDraft, setFolderDraft] = useState("");
  const [savingFolder, setSavingFolder] = useState(false);
  const [showFolderEditDropdown, setShowFolderEditDropdown] = useState(false);

  // ── Location name editing state ───────────────────────────────
  const [editingLocationName, setEditingLocationName] = useState(false);
  const [locationNameDraft, setLocationNameDraft] = useState("");
  const [savingLocationName, setSavingLocationName] = useState(false);

  const editingPinId = panel.mode === "editing" ? panel.pin.id : null;
  const panelPin = panel.mode === "editing" ? panel.pin : undefined;

  const {
    pinImages,
    imagesLoading,
    uploadingImage,
    editingImage,
    setEditingImage,
    captionDraft,
    setCaptionDraft,
    captionSaving,
    deletingImage,
    syncing,
    brokenImages,
    setBrokenImages,
    cropFile,
    setCropFile,
    setReEditingImage,
    fetchingForReEdit,
    draggingPublicId,
    fileInputRef,
    handleUploadImage,
    handleCropConfirm,
    handleReCropClick,
    handleSaveCaption,
    handleDeleteImage,
    handleSync,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  } = useAdminPinImages({
    editingPinId,
    panelPin,
    token,
    handleAuthError,
    setSubmitError,
    setSubmitSuccess,
  });

  // Reset UI-only editing state when the active pin changes
  useEffect(() => {
    setEditingFolder(false);
    setEditingLocationName(false);
    setSubmitSuccess("");
  }, [editingPinId]);

  const markers = pins.map((p) => ({
    id: p.id,
    label: p.locationName,
    lat: p.latitude,
    lng: p.longitude,
    photos: p.images.map((i) => i.cloudinarySecureUrl),
  }));

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

  // ── Folder update ─────────────────────────────────────────────
  const handleSaveFolder = async () => {
    if (panel.mode !== "editing") return;
    const newFolder = folderDraft.trim();
    if (!newFolder) return;
    if (newFolder === panel.pin.cloudinaryFolder) {
      setEditingFolder(false);
      return;
    }
    setSavingFolder(true);
    setSubmitError("");
    try {
      await updatePinFolder(panel.pin.id, newFolder, token);
      setPanel({
        mode: "editing",
        pin: { ...panel.pin, cloudinaryFolder: newFolder },
      });
      setEditingFolder(false);
      setSubmitSuccess("folder updated.");
    } catch (err) {
      if (err instanceof Error && err.message === "unauthorized")
        handleAuthError();
      else setSubmitError("Failed to update folder.");
    } finally {
      setSavingFolder(false);
    }
  };

  // ── Location name update ──────────────────────────────────────
  const handleSaveLocationName = async () => {
    if (panel.mode !== "editing") return;
    const newName = locationNameDraft.trim();
    if (!newName) return;
    if (newName === panel.pin.locationName) {
      setEditingLocationName(false);
      return;
    }
    setSavingLocationName(true);
    setSubmitError("");
    try {
      await updatePinLocationName(panel.pin.id, newName, token);
      setPanel({
        mode: "editing",
        pin: { ...panel.pin, locationName: newName },
      });
      setEditingLocationName(false);
      setSubmitSuccess("location name updated.");
    } catch (err) {
      if (err instanceof Error && err.message === "unauthorized")
        handleAuthError();
      else setSubmitError("Failed to update location name.");
    } finally {
      setSavingLocationName(false);
    }
  };

  // ── Gate screen ───────────────────────────────────────────────
  if (!token) {
    return (
      <AdminGate
        section="travels"
        tokenInput={tokenInput}
        setTokenInput={setTokenInput}
        authError={authError}
        failedAttempts={failedAttempts}
        lastTokenSnippet={lastTokenSnippet}
        onLogin={handleLogin}
      />
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
            {!editingLocationName ? (
              <div className="admin-folder-row">
                <p className="admin-pin-name">{pin.locationName}</p>
                <button
                  className="admin-btn admin-btn--ghost"
                  onClick={() => {
                    setLocationNameDraft(pin.locationName);
                    setEditingLocationName(true);
                    setSubmitError("");
                  }}
                >
                  edit
                </button>
              </div>
            ) : (
              <div className="admin-folder-edit">
                <label className="admin-label">
                  location name
                  <input
                    className="admin-input"
                    type="text"
                    value={locationNameDraft}
                    onChange={(e) => setLocationNameDraft(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveLocationName();
                      if (e.key === "Escape") setEditingLocationName(false);
                    }}
                  />
                </label>
                <div className="admin-folder-actions">
                  <button
                    className="admin-btn admin-btn--primary"
                    onClick={handleSaveLocationName}
                    disabled={savingLocationName || !locationNameDraft.trim()}
                  >
                    {savingLocationName ? "saving..." : "save name"}
                  </button>
                  <button
                    className="admin-btn admin-btn--ghost"
                    onClick={() => setEditingLocationName(false)}
                    disabled={savingLocationName}
                  >
                    cancel
                  </button>
                </div>
              </div>
            )}
            <p className="admin-pin-country">{pin.country}</p>
            <p className="admin-coord-val">
              {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
            </p>
          </div>

          {!editingFolder ? (
            <div className="admin-folder-row">
              <div className="admin-folder-info">
                <span className="admin-form-label">folder</span>
                <span className="admin-coord-val">
                  {pin.cloudinaryFolder || "—"}
                </span>
              </div>
              <button
                className="admin-btn admin-btn--ghost"
                onClick={() => {
                  setFolderDraft(pin.cloudinaryFolder ?? "");
                  setEditingFolder(true);
                  setSubmitError("");
                }}
              >
                edit
              </button>
            </div>
          ) : (
            <div className="admin-folder-edit">
              <label className="admin-label">
                cloudinary folder
                {(() => {
                  const q = folderDraft.toLowerCase();
                  const matches = folders.filter((f) =>
                    f.toLowerCase().includes(q),
                  );
                  const isNew =
                    folderDraft !== "" && !folders.includes(folderDraft);
                  const showList =
                    showFolderEditDropdown && (isNew || matches.length > 0);
                  return (
                    <div className="admin-combobox">
                      <input
                        className="admin-input"
                        type="text"
                        placeholder="e.g. travels/usa/blairstown"
                        value={folderDraft}
                        onChange={(e) => setFolderDraft(e.target.value)}
                        onFocus={() => setShowFolderEditDropdown(true)}
                        onBlur={() =>
                          setTimeout(
                            () => setShowFolderEditDropdown(false),
                            150,
                          )
                        }
                        autoComplete="off"
                        autoFocus
                      />
                      {showList && (
                        <ul className="admin-combobox-list">
                          {isNew && (
                            <li
                              className="admin-combobox-item admin-combobox-item--create"
                              onMouseDown={() =>
                                setShowFolderEditDropdown(false)
                              }
                            >
                              create: {folderDraft}
                            </li>
                          )}
                          {matches.map((f) => (
                            <li
                              key={f}
                              className="admin-combobox-item"
                              onMouseDown={() => {
                                setFolderDraft(f);
                                setShowFolderEditDropdown(false);
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
              <div className="admin-folder-actions">
                <button
                  className="admin-btn admin-btn--primary"
                  onClick={handleSaveFolder}
                  disabled={savingFolder || !folderDraft.trim()}
                >
                  {savingFolder ? "saving..." : "save folder"}
                </button>
                <button
                  className="admin-btn admin-btn--ghost"
                  onClick={() => setEditingFolder(false)}
                  disabled={savingFolder}
                >
                  cancel
                </button>
              </div>
            </div>
          )}

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
              {visibleImages.map((img, index) => (
                <div
                  key={img.cloudinaryPublicId}
                  className={`admin-image-card${draggingPublicId === img.cloudinaryPublicId ? " admin-image-card--dragging" : ""}`}
                  draggable
                  onDragStart={() =>
                    handleDragStart(index, img.cloudinaryPublicId)
                  }
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                >
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
                    title="edit image"
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
        <div className="admin-header-left">
          <Link to="/admin" className="admin-btn admin-btn--ghost">
            ← admin
          </Link>
          <span className="admin-header-label">// travel pins</span>
        </div>
        <div className="admin-header-right">
          <Link to="/admin/music" className="admin-btn admin-btn--ghost">
            music →
          </Link>
          <button className="admin-btn admin-btn--ghost" onClick={handleLogout}>
            log out
          </button>
        </div>
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

      {cropFile && (
        <ImageCropModal
          file={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={() => {
            setCropFile(null);
            setReEditingImage(null);
          }}
        />
      )}

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
                className="admin-btn admin-btn--ghost"
                onClick={handleReCropClick}
                disabled={fetchingForReEdit || deletingImage || captionSaving}
                title="Crop, flip, or adjust this image"
              >
                {fetchingForReEdit ? "loading..." : "✂ crop & adjust"}
              </button>
              <button
                className="admin-btn admin-btn--danger"
                onClick={handleDeleteImage}
                disabled={deletingImage || captionSaving || fetchingForReEdit}
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
